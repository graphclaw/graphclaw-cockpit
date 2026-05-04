# E2E Tests — Playwright

All E2E tests use Playwright (single framework). The Puppeteer suite has been archived — do not add new tests there.

## Quick start

```bash
# 1. Start the full stack
docker compose up -d

# 2. Seed reference data (writes e2e/seed/.seed-manifest.json)
npm run seed

# 3. Run all E2E tests
npm run test:e2e

# 4. Teardown seed data after the suite
npm run teardown
```

## Running in Docker (CI mode)

```bash
docker compose --profile test run --rm e2e
```

## Debug with Playwright UI

```bash
npx playwright test --ui
```

## Single spec

```bash
npx playwright test e2e/specs/intelligence/intelligence-hub.spec.ts
```

## Fixture system

Every spec imports from `e2e/fixtures/test.ts` — never from `@playwright/test` directly.

```typescript
import { test, expect } from '../../fixtures/test'

test('example', async ({ page, db, minio, seed, api }) => {
  // page     — authenticated browser, tokens injected
  // db       — DbClient connected to test Postgres/AGE
  // minio    — MinioClient for storage verification
  // seed     — { manifest } with stable seed IDs
  // api      — Playwright APIRequestContext (direct backend calls)
})
```

## Seed manifest

`seed-all.ts` creates the reference dataset once and writes stable IDs to `.seed-manifest.json`. Reference IDs from `seed.manifest` — never hardcode database IDs in specs.

## Adding a new spec

1. Pick the right feature subdir: `e2e/specs/{feature}/`
2. Allocate a test ID: `GC-E-<DOM>-W<NN>-<NNN>`
3. Write the canonical file header (see `cockpit-playwright-e2e` skill)
4. Import from `../../fixtures/test` (adjust depth as needed)
5. Run `npm run regen-inventory` to register in `e2e/inventory.md`
