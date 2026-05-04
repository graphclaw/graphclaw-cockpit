import { test as base } from '@playwright/test';
import { loadManifest, seedAll } from '../seed/seed-all.js';
import type { SeedManifest } from '../seed/manifest.types.js';

type SeedFixtures = { seed: { manifest: SeedManifest } };

export const test = base.extend<SeedFixtures>({
  seed: async ({}, use) => {
    let manifest = loadManifest();
    if (!manifest) {
      console.warn('[seed.fixture] No .seed-manifest.json found — running seed-all...');
      manifest = await seedAll();
    }
    await use({ manifest });
  },
});
