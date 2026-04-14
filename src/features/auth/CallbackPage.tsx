import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore, type UserRole } from '@/stores/auth';

export function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      useAuthStore.getState().setTokens(accessToken, refreshToken);

      // Fetch user info
      fetch('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((data: { user_id: string }) => {
          useAuthStore.getState().setUser(data.user_id, 'USER' as UserRole);
          navigate('/', { replace: true });
        })
        .catch(() => {
          navigate('/', { replace: true });
        });
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
