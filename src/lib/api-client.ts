import createClient, { type Middleware } from 'openapi-fetch';

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = localStorage.getItem('gc-access-token');
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      const refreshed = await tryRefreshToken();
      if (!refreshed) {
        localStorage.removeItem('gc-access-token');
        localStorage.removeItem('gc-refresh-token');
        window.location.href = '/login';
      }
    }
    return response;
  },
};

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('gc-refresh-token');
  if (!refreshToken) return false;

  try {
    const res = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as { access_token: string; refresh_token: string };
    localStorage.setItem('gc-access-token', data.access_token);
    localStorage.setItem('gc-refresh-token', data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export const client = createClient({
  baseUrl: import.meta.env.VITE_API_URL || '',
});

client.use(authMiddleware);
