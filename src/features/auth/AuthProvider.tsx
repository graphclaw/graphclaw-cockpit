import { useEffect, useRef, type ReactNode } from 'react';

import { recoverAuthSession } from '@/lib/auth-session';
import { useAuthStore } from '@/stores/auth';

const REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes (tokens expire in 15 min)

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasRefreshToken = useAuthStore((state) => !!state.refreshToken);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!isAuthenticated || !hasRefreshToken) return;

    async function refreshTokens() {
      const recovered = await recoverAuthSession();
      if (!recovered) {
        // Keep the current session on transient refresh failures (e.g. 429/network).
        // Request-level 401 handlers still recover or force logout if tokens are truly invalid.
        return;
      }
    }

    // Validate persisted credentials right away so stale tokens after
    // backend restarts do not leave the UI in a broken half-authenticated state.
    void refreshTokens();

    intervalRef.current = setInterval(refreshTokens, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, hasRefreshToken]);

  return <>{children}</>;
}
