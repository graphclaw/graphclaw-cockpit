// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * live-auth fixture — extended fixtures for tests that use real OAuth
 * (no dev-token shortcut).  Used exclusively by google-oauth-onboarding.spec.ts.
 *
 * Provides:
 *  db    — DbClient for graph store verification
 *  minio — MinioClient for object store verification
 *
 * The `page` fixture is NOT overridden here — the spec navigates to /login and
 * waits for the human to approve the Google OAuth flow manually.
 */

import { test as base } from '@playwright/test';
import { DbClient } from '../helpers/db.js';
import { MinioClient } from '../helpers/minio.js';

type LiveAuthFixtures = {
  db: DbClient;
  minio: MinioClient;
};

export const test = base.extend<LiveAuthFixtures>({
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
});

export { expect } from '@playwright/test';
