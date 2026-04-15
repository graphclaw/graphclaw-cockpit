import { test as base, expect } from '@playwright/test';

/**
 * Authenticated page fixture.
 * POSTs to /auth/dev-token, stores the real JWT in both:
 *   - localStorage['gc-access-token']  (read by api-client.ts middleware)
 *   - localStorage['gc-auth']          (read by Zustand useAuthStore / RequireAuth)
 * so every API call in a test goes through with a valid bearer token.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/');

    // Get a real dev-token from the backend (proxied via Vite /auth/dev-token)
    let accessToken = '';
    let refreshToken = '';
    try {
      const res = await page.request.post('/auth/dev-token', {
        data: {},
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok()) {
        const body = (await res.json()) as {
          access_token: string;
          refresh_token: string;
        };
        accessToken = body.access_token ?? '';
        refreshToken = body.refresh_token ?? '';
      }
    } catch {
      // backend unreachable — fall through to fake token
    }

    // Inject auth into localStorage so both the API middleware and
    // Zustand RequireAuth guard treat the user as authenticated.
    await page.evaluate(
      ({ access, refresh }) => {
        const finalAccess = access || 'e2e-test-token';
        const finalRefresh = refresh || 'e2e-refresh-token';

        // api-client.ts reads this key for the Bearer header
        localStorage.setItem('gc-access-token', finalAccess);
        localStorage.setItem('gc-refresh-token', finalRefresh);

        // Zustand persisted store (key = 'gc-auth')
        const authState = {
          state: {
            accessToken: finalAccess,
            refreshToken: finalRefresh,
            userId: 'test-user',
            role: 'ADMIN',
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem('gc-auth', JSON.stringify(authState));
      },
      { access: accessToken, refresh: refreshToken },
    );

    await page.reload();
    await use(page);
  },
});

export { expect };
