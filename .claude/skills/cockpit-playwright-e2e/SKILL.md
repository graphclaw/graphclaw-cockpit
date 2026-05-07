---
name: cockpit-playwright-e2e
description: Playwright E2E test conventions for GraphClaw Cockpit — file headers, fixture system, seed manifest, locator best practices, DB/MinIO validation, and inventory workflow. Use when writing or reviewing any file under e2e/ in graphclaw-cockpit.
---

# Cockpit Playwright E2E Patterns

## When to use
Writing or reviewing files under `graphclaw-cockpit/e2e/`. This is the ONLY E2E framework — the Puppeteer suite has been deprecated (see `docs/testing/adr/0001-playwright-over-puppeteer.md`).

---

## Mandatory file header

Every spec file starts with this block:

```typescript
/**
 * GC-E-<DOM>-<W>-<NNN> — <One-line title>
 *
 * Scenario: <1-3 sentences describing what end-to-end behaviour this proves.>
 *
 * PRD: <docs/prd/NN-name.md §AC-N.N.N>
 * Build wave: W<NN>
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: YYYY-MM-DD
 *
 * Cases covered:
 *  - <test description 1>
 *  - <test description 2>
 *
 * Notes:
 *  - Requires docker compose stack. Run: docker compose up -d
 *  - Uses seed manifest from e2e/seed/.seed-manifest.json
 */
```

---

## Always import from `e2e/fixtures/test.ts`

```typescript
// CORRECT
import { test, expect } from '../../fixtures/test'

// WRONG — never import directly
import { test } from '@playwright/test'
```

The merged fixture provides these built-ins for every test:
- `page` — Playwright page with auth cookie already injected
- `seed` — accessor for `.seed-manifest.json` (stable IDs across runs)
- `db` — pg client connected to test database
- `minio` — S3 client connected to MinIO
- `api` — typed openapi-fetch client (bypasses the browser)

---

## Seed manifest pattern

`seed-all.ts` creates reference entities once before the suite and writes stable IDs to `e2e/seed/.seed-manifest.json`. Reference IDs from the manifest — never hardcode database IDs.

```typescript
test('task appears after creation', async ({ page, seed, db }) => {
  const goalId = seed.manifest.goals[0].id
  await page.goto(`/goals/${goalId}`)

  await page.getByRole('button', { name: 'New Task' }).click()
  await page.getByLabel('Title').fill('My new task')
  await page.getByRole('button', { name: 'Save' }).click()

  // Validate in DB — prove full path, not just DOM
  const row = await db.queryOne(
    'SELECT * FROM tasks WHERE goal_id = $1 ORDER BY created_at DESC LIMIT 1',
    [goalId]
  )
  expect(row?.title).toBe('My new task')
})
```

---

## Locator priority (strictly follow this order)

1. `getByRole('button', { name: 'Save' })` — semantic, a11y-first
2. `getByLabelText('Task title')` — form inputs
3. `getByText('Exact visible text')` �� visible content
4. `getByTestId('task-card-123')` — requires `data-testid`, last resort
5. CSS selector — only if above are impossible; document why

Never use: `page.$('div > span:nth-child(3)')` — fragile.

---

## DB/MinIO validation after UI mutations

After any create/update/delete action in the UI, validate state in the database and/or MinIO:

```typescript
test('GC-E-INT-W16-004 — save to MinIO persists content', async ({ page, minio, seed }) => {
  await page.goto('/intelligence/profile')
  await page.getByRole('textbox').fill('Updated profile content')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Saved')).toBeVisible()

  // Verify in MinIO — proves full request path
  const content = await minio.getObject(`${seed.manifest.userId}/profile.md`)
  expect(content).toContain('Updated profile content')
})
```

---

## Auth

The `page` fixture already has the dev-token auth cookie injected. Every test starts authenticated. No manual login steps needed.

---

## playwright.config.ts settings

- `workers: 1` — backend rate-limit 300 req/min/user; always sequential
- `timeout: 30_000` — 30s per test
- `retries: 1` in CI; `trace: 'on-first-retry'`; `screenshot: 'only-on-failure'`

---

## Running E2E tests

```bash
# Local
docker compose up -d && npm run test:e2e

# In Docker (CI mode)
docker compose --profile test run --rm e2e

# Single spec
npx playwright test e2e/specs/intelligence/intelligence.spec.ts

# Debug with UI
npx playwright test --ui
```

---

## Inventory workflow

After writing the file, add to `e2e/inventory.md` or regenerate:
```bash
node scripts/regen-inventory.mjs
```

Manual entry format:
```
| GC-E-INT-W16-004 | Save to MinIO persists content | [e2e/intelligence/intelligence-hub.spec.ts](../../../e2e/intelligence/intelligence-hub.spec.ts) |
```

---

## Deprecated: Puppeteer suite

The `e2e-puppeteer/` directory is archived. Do NOT add tests there. All new E2E tests go in `e2e/specs/`. See [ADR-0001](../../../docs/testing/adr/0001-playwright-over-puppeteer.md).
