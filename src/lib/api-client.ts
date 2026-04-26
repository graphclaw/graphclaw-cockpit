import createClient, { type Middleware } from 'openapi-fetch';

import { logoutAndRedirectToLogin, recoverAuthSession } from '@/lib/auth-session';
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
      const refreshed = await recoverAuthSession();
      if (!refreshed) {
        logger.warn('api.auth.refresh_failed', { url: request.url });
        logoutAndRedirectToLogin();
      } else {
        logger.info('api.auth.refreshed');
      }
    }
    return response;
  },
};

export const client = createClient({
  baseUrl: import.meta.env.VITE_API_URL || '',
});

client.use(authMiddleware);
