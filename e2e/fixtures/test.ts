/**
 * Merged Playwright fixture export.
 *
 * Every spec file imports from here — never directly from @playwright/test.
 *
 * Provides:
 *  page   — authenticated browser page (localStorage tokens injected)
 *  token  — raw Bearer access token string
 *  api    — Playwright APIRequestContext pre-authenticated for direct backend calls
 *  db     — DbClient connected to the test Postgres/AGE database
 *  minio  — MinioClient connected to the test MinIO bucket
 *  seed   — { manifest: SeedManifest } accessor for stable seed IDs
 */

import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { DbClient } from '../helpers/db.js';
import { MinioClient } from '../helpers/minio.js';
import { loadManifest, seedAll } from '../seed/seed-all.js';
import type { SeedManifest } from '../seed/manifest.types.js';

export const TEST_USER_ID = 'USER-dev-001';

type AllFixtures = {
  token: string;
  api: APIRequestContext;
  db: DbClient;
  minio: MinioClient;
  seed: { manifest: SeedManifest };
};

export const test = base.extend<AllFixtures>({
  // ── Token — obtained once per test, 1s preamble to respect rate limit ──────
  token: async ({}, use) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    const ctx = await base.request.newContext({ baseURL: 'http://localhost:8000' });
    const res = await ctx.post('/auth/dev-token', {
      data: { user_id: TEST_USER_ID },
      headers: { 'Content-Type': 'application/json' },
    });
    const body = (await res.json()) as { access_token: string };
    await ctx.dispose();
    await use(body.access_token);
  },

  // ── API — pre-authenticated Playwright request context ─────────────────────
  api: async ({ token }, use) => {
    const ctx = await base.request.newContext({
      baseURL: 'http://localhost:8000',
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    await use(ctx);
    await ctx.dispose();
  },

  // ── Page — browser with auth tokens injected ──────────────────────────────
  page: async ({ page, token }, use) => {
    await page.goto('/');
    await page.evaluate(
      ({ access, userId }) => {
        localStorage.setItem('gc-access-token', access);
        localStorage.setItem('gc-refresh-token', access);
        localStorage.setItem(
          'gc-auth',
          JSON.stringify({
            state: {
              accessToken: access,
              refreshToken: access,
              userId,
              role: 'ADMIN',
              isAuthenticated: true,
            },
            version: 0,
          }),
        );
      },
      { access: token, userId: TEST_USER_ID },
    );
    await page.reload();
    await use(page);
  },

  // ── DB — connected pg client with AGE session setup ───────────────────────
  db: async ({}, use) => {
    const db = new DbClient();
    await db.connect();
    await use(db);
    await db.disconnect();
  },

  // ── MinIO — S3 client for object storage verification ─────────────────────
  minio: async ({}, use) => {
    await use(new MinioClient());
  },

  // ── Seed — provides stable IDs from seed-all.ts manifest ──────────────────
  seed: async ({}, use) => {
    let manifest = loadManifest();
    if (!manifest) {
      console.warn('[seed fixture] No manifest found — running seed-all...');
      manifest = await seedAll();
    }
    await use({ manifest });
  },
});

export { expect };
