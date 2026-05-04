# Test Strategy — graphclaw-cockpit (frontend)

> Frontend-specific details. For the full cross-repo pyramid and conventions see [graphclaw/docs/testing/master-strategy.md](../../../graphclaw/docs/testing/master-strategy.md).

---

## Test stack

| Layer | Tool | Location | Runs on |
|---|---|---|---|
| L1 Unit | Vitest 3 + jsdom | `src/**/*.test.tsx` co-located | Every PR |
| L2 Component | Vitest + React Testing Library | `src/**/*.test.tsx` | Every PR |
| L3 Contract | Vitest | `src/test/contract/handlers.contract.test.ts` | Every PR |
| L5 E2E | Playwright | `e2e/specs/**/*.spec.ts` | Every PR (Docker) |

---

## Unit + component tests (Vitest + RTL + MSW)

### Setup

- Config: `vite.config.ts` `test` block — `globals: true`, `environment: jsdom`, `setupFiles: ['./src/test/setup.ts']`
- Coverage: `provider: 'v8'`, reports HTML + lcov, gate at **60% lines/branches/functions** (raises each release)
- MSW server started in `src/test/setup.ts` via `src/test/server.ts`

### Always use `renderWithProviders`

```typescript
import { renderWithProviders } from '@/test/utils'

it('renders task title', () => {
  renderWithProviders(<TaskCard task={mockTask} />)
  expect(screen.getByRole('heading', { name: 'Ship Q2 plan' })).toBeInTheDocument()
})
```

Never render components bare. `renderWithProviders` sets up QueryClient (retry: false, gcTime: 0), MemoryRouter, and MSW.

### MSW handlers

All API responses are intercepted by handlers in `src/test/handlers.ts`. If a component calls an endpoint not yet mocked, the MSW server logs an unhandled request warning and returns 500. Add the handler before writing component tests.

```typescript
// src/test/handlers.ts
http.get('/app/v1/tasks', () =>
  HttpResponse.json({ items: taskFixtures.list, total: taskFixtures.list.length })
)
```

### Locator priority

1. `getByRole` — semantic, accessible
2. `getByLabelText` / `getByPlaceholderText` — form elements
3. `getByText` — visible text
4. `getByTestId` — last resort, requires `data-testid` on element

---

## E2E tests (Playwright)

### Setup

- Config: `playwright.config.ts` — 1 worker (backend rate-limit 300 req/min), 30s timeout, trace on first retry, screenshot on failure
- Requires full Docker stack: `docker compose up -d` then `npm run test:e2e`

### Always import `test` from `e2e/fixtures/test.ts`

```typescript
import { test, expect } from '../fixtures/test'

test('GC-E-CHT-W18-003 — chat streams tokens', async ({ page, seed, db }) => {
  const convId = seed.manifest.conversations[0].id
  await page.goto(`/chat/${convId}`)
  // ...
  const row = await db.queryOne('SELECT * FROM messages WHERE conv_id = $1', [convId])
  expect(row).toBeTruthy()
})
```

The merged fixture exposes: `page`, `auth` (cookie injected), `db` (pg client), `minio` (S3 client), `api` (openapi-fetch client), `seed` (manifest accessor).

### Seed manifest

`e2e/seed/seed-all.ts` runs once before the suite and writes `.seed-manifest.json`. Reference stable IDs via `seed.manifest.*` — never hardcode database IDs in test files.

### Locator priority (same as unit)

`getByRole` → `getByText` → `getByTestId` → CSS (last resort)

---

## Contract tests

`src/test/contract/handlers.contract.test.ts` loads `openapi.json` from the backend (either via network or a committed snapshot) and asserts:
1. Every handler in `src/test/handlers.ts` references a real path + method from the spec.
2. Response shapes from handlers match the spec's response schemas.

This layer catches drift: backend changes an endpoint shape → contract test fails before E2E even runs.

---

## File header requirement

Every test file starts with the canonical block. See [master-strategy.md](../../../graphclaw/docs/testing/master-strategy.md#file-header-convention) for the full template.

Quick reference:

```typescript
/**
 * GC-C-TSK-W09-004 — TaskCard renders priority badge
 *
 * Scenario: TaskCard receives a task with priority=HIGH and renders
 * the priority badge with the correct colour and aria-label.
 *
 * PRD: docs/prd/03-task-management.md §AC-3.1.7
 * Build wave: W09
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-04
 *
 * Cases covered:
 *  - HIGH priority → red badge, aria-label "High priority"
 *  - LOW priority → grey badge
 *  - undefined priority → no badge rendered
 */
```

---

## Related docs

- [scenario-catalog.md](scenario-catalog.md) — full E2E scenario inventory
- [contributing-tests.md](contributing-tests.md) — decision tree for adding a test
- [adr/0001-playwright-over-puppeteer.md](adr/0001-playwright-over-puppeteer.md)
- [adr/0002-msw-for-component-tests.md](adr/0002-msw-for-component-tests.md)
- Cross-repo: [graphclaw/docs/testing/master-strategy.md](../../../graphclaw/docs/testing/master-strategy.md)
