import createClient, { type Middleware } from 'openapi-fetch';

import { logger } from './logger';

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = localStorage.getItem('gc-access-token');
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    logger.debug('api.request', { method: request.method, url: request.url });
    return request;
  },
  async onResponse({ response, request }) {
    logger.debug('api.response', { method: request.method, url: request.url, status: response.status });
    if (response.status === 401) {
      logger.warn('api.auth.expired', { url: request.url });
      const refreshed = await tryRefreshToken();
      if (!refreshed) {
        logger.warn('api.auth.refresh_failed', { url: request.url });
        localStorage.removeItem('gc-access-token');
        localStorage.removeItem('gc-refresh-token');
        window.location.href = '/login';
      } else {
        logger.info('api.auth.refreshed');
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
