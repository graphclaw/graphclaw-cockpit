import { useEffect, useRef, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth';

const REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes (tokens expire in 15 min)

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, refreshToken } = useAuthStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!isAuthenticated || !refreshToken) return;

    async function refreshTokens() {
      const currentRefresh = useAuthStore.getState().refreshToken;
      if (!currentRefresh) return;

      try {
        const res = await fetch('/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: currentRefresh }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            access_token: string;
            refresh_token: string;
          };
          useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
        } else {
          useAuthStore.getState().logout();
        }
      } catch {
        // Network error — stay logged in, retry next interval
      }
    }

    intervalRef.current = setInterval(refreshTokens, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, refreshToken]);

  return <>{children}</>;
}
