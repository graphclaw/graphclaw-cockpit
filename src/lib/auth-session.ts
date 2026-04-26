import { logger } from '@/lib/logger';
import { useAuthStore, type UserRole } from '@/stores/auth';

const DEV_AUTH_ENABLED = import.meta.env.VITE_ENABLE_DEV_AUTH === 'true';

type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

type DevTokenResponse = {
  access_token: string;
  refresh_token: string;
  user_id: string;
  role: UserRole;
  display_name?: string;
  email?: string;
};

async function refreshWithRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('gc-refresh-token');
  if (!refreshToken) return false;

  try {
    const res = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as RefreshTokenResponse;
    useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
    logger.info('auth.session.refreshed');
    return true;
  } catch {
    return false;
  }
}

async function issueDevToken(): Promise<boolean> {
  if (!DEV_AUTH_ENABLED) return false;

  const auth = useAuthStore.getState();
  const userId = auth.userId ?? 'USER-dev-001';
  const role = auth.role ?? 'ADMIN';

  try {
    const res = await fetch('/auth/dev-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as DevTokenResponse;
    useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
    useAuthStore
      .getState()
      .setUser(data.user_id, data.role, data.display_name, data.email);
    logger.info('auth.session.dev_token_issued', { userId: data.user_id });
    return true;
  } catch {
    return false;
  }
}

export async function recoverAuthSession(): Promise<boolean> {
  if (await refreshWithRefreshToken()) return true;
  if (await issueDevToken()) return true;
  return false;
}

export function logoutAndRedirectToLogin(): void {
  useAuthStore.getState().logout();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}
