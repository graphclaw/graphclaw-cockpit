import { test as base, expect } from '@playwright/test';

/**
 * Authenticated page fixture.
 * In dev mode, the app auto-authenticates via dev-token shortcut.
 * For E2E against Docker stack, POST /auth/dev-token to get a session.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Try dev-token auth against the backend
    try {
      const res = await page.request.post('/auth/dev-token', {
        data: { user_id: 'test-user' },
      });
      if (res.ok()) {
        const body = await res.json();
        if (body.access_token) {
          await page.context().addCookies([
            {
              name: 'access_token',
              value: body.access_token,
              domain: new URL(page.url() || 'http://localhost:3000').hostname,
              path: '/',
            },
          ]);
        }
      }
    } catch {
      // Backend may not be available — fall back to localStorage auth
    }

    // Fallback: set auth state in localStorage so RequireAuth passes
    // Must match the Zustand auth store shape exactly (flat, not nested user object)
    await page.goto('/');
    await page.evaluate(() => {
      const authState = {
        state: {
          accessToken: 'e2e-test-token',
          refreshToken: 'e2e-refresh-token',
          userId: 'test-user',
          role: 'ADMIN',
          isAuthenticated: true,
        },
        version: 0,
      };
      localStorage.setItem('gc-auth', JSON.stringify(authState));
    });
    await page.reload();

    await use(page);
  },
});

export { expect };
