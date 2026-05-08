// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test as base, expect, type APIRequestContext } from '@playwright/test';

// The provisioned test user — matches GRAPHCLAW_USER_ID in docker-compose .env
export const TEST_USER_ID = 'USER-dev-001';
const API_BASE_URL = process.env.API_URL || 'http://localhost:8000';

type AuthFixtures = {
  token: string;
  api: APIRequestContext;
};

/**
 * Extended fixtures:
 *  - page: authenticated browser page (localStorage token injected)
 *  - token: raw Bearer access token string
 *  - api: pre-authenticated Playwright APIRequestContext for direct backend calls
 *    (use this to seed data, read ground truth, and verify persistence)
 */
export const test = base.extend<AuthFixtures>({
  // Raw access token — obtained once per test from /auth/dev-token
  // 1-second preamble delay to stay well under the 300 req/min rate limit
  // across 76 sequential tests (without this, burst calls after test 45+ hit 429).
  token: async ({}, use) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    const ctx = await base.request.newContext({ baseURL: API_BASE_URL });
    const res = await ctx.post('/auth/dev-token', {
      data: { user_id: TEST_USER_ID },
      headers: { 'Content-Type': 'application/json' },
    });
    const body = (await res.json()) as { access_token: string };
    await ctx.dispose();
    await use(body.access_token);
  },

  // APIRequestContext pre-seeded with Bearer token for direct backend calls
  api: async ({ token }, use) => {
    const ctx = await base.request.newContext({
      baseURL: API_BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    await use(ctx);
    await ctx.dispose();
  },

  // Browser page with auth tokens injected into localStorage
  page: async ({ page, token }, use) => {
    await page.goto('/');
    await page.evaluate(
      ({ access, userId }) => {
        localStorage.setItem('gc-access-token', access);
        localStorage.setItem('gc-refresh-token', access);
        localStorage.setItem(
          'gc-auth',
          JSON.stringify({
            state: { accessToken: access, refreshToken: access, userId, role: 'ADMIN', isAuthenticated: true },
            version: 0,
          }),
        );
      },
      { access: token, userId: TEST_USER_ID },
    );
    await page.reload();
    await use(page);
  },
});

export { expect };


