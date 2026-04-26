import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore, type UserRole } from '@/stores/auth';

export function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    // OTC exchange path (normal OAuth flow)
    if (code) {
      fetch('/auth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Exchange failed');
          return res.json();
        })
        .then((data: { access_token: string; refresh_token: string; user_id: string; role: string; display_name?: string; email?: string }) => {
          useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
          useAuthStore.getState().setUser(data.user_id, data.role as UserRole, data.display_name, data.email);
          navigate('/', { replace: true });
        })
        .catch(() => navigate('/login', { replace: true }));
      return;
    }

    // Fallback path — Redis unavailable, tokens delivered as query params (dev only)
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const userId = searchParams.get('user_id');
    const role = searchParams.get('role');
    const displayName = searchParams.get('display_name') ?? undefined;
    const email = searchParams.get('email') ?? undefined;

    if (accessToken && refreshToken && userId) {
      useAuthStore.getState().setTokens(accessToken, refreshToken);
      useAuthStore.getState().setUser(userId, (role ?? 'USER') as UserRole, displayName, email);
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <p className="text-[var(--text-secondary)]">Signing you in...</p>
    </div>
  );
}
