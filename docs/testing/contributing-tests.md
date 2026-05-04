# Contributing Tests — graphclaw-cockpit

## Decision tree: where does my test go?

```
Is this testing a React component or hook?
  └─ Yes → src/features/<name>/Component.test.tsx  (Vitest + RTL + MSW, co-located)

Is this verifying that a UI flow works end-to-end in a real browser?
  └─ Yes → e2e/specs/<feature>/my-flow.spec.ts  (Playwright + Docker stack)

Is this checking that MSW handlers match the backend OpenAPI spec?
  └─ Yes → src/test/contract/handlers.contract.test.ts  (Vitest contract)

Is this testing a pure utility function (no React, no API)?
  └─ Yes → src/lib/myUtil.test.ts  (Vitest, co-located with the utility)
```

---

## Step-by-step: adding a unit or component test

### 1. Co-locate the file
Test file lives next to the component: `src/features/tasks/TaskCard.test.tsx` beside `TaskCard.tsx`.

### 2. Allocate a test ID
Format: `GC-<L>-<DOM>-<W>-<NNN>`
- `<L>`: `U` (unit/pure logic) or `C` (component with rendering)
- See [master-strategy.md](../../../graphclaw/docs/testing/master-strategy.md#test-id-scheme) for domains and wave codes
- Check `src/test/inventory.md` for the last used sequence number in your (L, DOM, W)

### 3. Write the file header
Copy the TypeScript template from [test-strategy.md](test-strategy.md#file-header-requirement) and fill all fields before writing any `it()` block.

### 4. Write the test using `renderWithProviders`
```typescript
import { renderWithProviders } from '@/test/utils'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskCard } from './TaskCard'
import { taskFixtures } from '@/test/fixtures/tasks'

it('GC-C-TSK-W09-004 — renders priority badge for HIGH priority', () => {
  renderWithProviders(<TaskCard task={taskFixtures.highPriority} />)
  expect(screen.getByRole('status', { name: /high priority/i })).toBeInTheDocument()
})
```

### 5. Add any missing MSW handlers
If your component calls an endpoint not yet in `src/test/handlers.ts`, add it. Keep the response shape matching the real OpenAPI spec.

### 6. Update inventory
Add a row to `src/test/inventory.md` or run `node scripts/regen-inventory.mjs`.

---

## Step-by-step: adding an E2E test

### 1. Choose or create a spec file under `e2e/specs/<feature>/`
Feature directories: `auth/`, `canvas/`, `chat/`, `graph/`, `intelligence/`, `marketplace/`, `admin/`, `a2a/`, `mcp/`, `skills/`, `settings/`.

### 2. Allocate a test ID (`GC-E-<DOM>-<W>-<NNN>`)
Check `e2e/inventory.md` for last used number in your feature domain.

### 3. Write the file header (see [test-strategy.md](test-strategy.md))

### 4. Import `test` from `e2e/fixtures/test.ts`
```typescript
import { test, expect } from '../../fixtures/test'
```
This gives you `page`, `auth`, `db`, `minio`, `api`, `seed` as fixtures.

### 5. Use `seed.manifest.*` for IDs — never hardcode
```typescript
test('task appears in graph after creation', async ({ page, seed, db }) => {
  const goalId = seed.manifest.goals[0].id  // stable across runs
  await page.goto(`/goals/${goalId}`)
  // ...
})
```

### 6. Validate state in db/minio after UI actions
E2E tests prove the full path. After clicking "Save", query the DB:
```typescript
const row = await db.queryOne('SELECT * FROM tasks WHERE id = $1', [taskId])
expect(row.title).toBe('My task')
```

### 7. Update `e2e/inventory.md`

---

## Dos and don'ts

| Do | Don't |
|---|---|
| Import `test` from `e2e/fixtures/test.ts` | Import directly from `@playwright/test` in spec files |
| Use `renderWithProviders` for every component test | Render components bare |
| Add MSW handlers when an endpoint is missing | Let unhandled requests silently return 500 |
| Use `getByRole` as the first locator choice | Default to CSS selectors |
| Reference `seed.manifest.*` IDs in E2E | Hardcode database IDs |
| Validate DB/MinIO state after UI mutations | Only assert on DOM — verify the full path |
| Write the file header before the first `it()` | Add the header as an afterthought |
