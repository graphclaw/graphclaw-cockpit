---
name: cockpit-vitest-patterns
description: Vitest unit and component test patterns for GraphClaw Cockpit — file headers, renderWithProviders, MSW handler usage, RTL locators, and inventory workflow. Use when writing or reviewing *.test.tsx files co-located with components.
---

# Cockpit Vitest Patterns (Unit + Component Tests)

## When to use
Writing `*.test.tsx` or `*.test.ts` files co-located with components in `src/features/` or utilities in `src/lib/`, `src/stores/`, `src/hooks/`.

---

## Mandatory file header

```typescript
/**
 * GC-<C|U>-<DOM>-<W>-<NNN> — <One-line title>
 *
 * Scenario: <What this test proves from a component/user perspective.>
 *
 * PRD: <docs/prd/NN.md §AC-N.N.N>
 * Build wave: W<NN>
 * Layer: <L1 Unit | L2 Component>
 * Owner: frontend-team
 * Last reviewed: YYYY-MM-DD
 *
 * Cases covered:
 *  - <it() description 1>
 *  - <it() description 2>
 *
 * Notes:
 *  - MSW intercepts /app/v1/tasks — see src/test/handlers.ts
 */
```

Use `L1 Unit` for pure logic tests (no React render). Use `L2 Component` for tests that call `renderWithProviders`.

---

## Always use `renderWithProviders`

```typescript
import { renderWithProviders } from '@/test/utils'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskCard } from './TaskCard'
import { taskFixtures } from '@/test/fixtures/tasks'

it('GC-C-TSK-W09-004 — renders priority badge for HIGH priority', () => {
  renderWithProviders(<TaskCard task={taskFixtures.highPriority} />)
  expect(screen.getByRole('status', { name: /high priority/i })).toBeInTheDocument()
})
```

`renderWithProviders` sets up:
- `QueryClient` with `retry: false`, `gcTime: 0`
- `MemoryRouter` (configurable initial route via options)
- MSW server (started in `src/test/setup.ts`)

Never render components bare — missing providers cause cryptic failures.

---

## Locator priority (RTL)

1. `getByRole('button', { name: 'Save' })` — best, tests a11y too
2. `getByLabelText('Email')` — form inputs
3. `getByText('Visible text')` — static content
4. `getByPlaceholderText(...)` — inputs without labels
5. `getByTestId('...')` — only if semantic queries are impossible

Avoid `container.querySelector` — couples tests to DOM structure.

---

## MSW handler usage

API calls are intercepted by handlers in `src/test/handlers.ts`. If a component calls an endpoint not yet in handlers, the request returns 500 and the test logs an "unhandled request" warning.

Adding a handler:
```typescript
// src/test/handlers.ts
import { http, HttpResponse } from 'msw'
import { taskFixtures } from './fixtures/tasks'

http.get('/app/v1/tasks', () =>
  HttpResponse.json({ items: taskFixtures.list, total: taskFixtures.list.length })
),
```

Overriding for a specific test:
```typescript
import { server } from '@/test/server'
import { http, HttpResponse } from 'msw'

it('shows error state on API failure', async () => {
  server.use(
    http.get('/app/v1/tasks', () => HttpResponse.json(null, { status: 500 }))
  )
  renderWithProviders(<TaskList />)
  await waitFor(() => expect(screen.getByText('Failed to load')).toBeInTheDocument())
})
```

---

## Fixture data (`src/test/fixtures/`)

```typescript
// src/test/fixtures/tasks.ts
import type { Task } from '@/lib/api-client'

export const taskFixtures = {
  highPriority: { id: 'task-001', title: 'Ship it', priority: 'HIGH', status: 'OPEN' } satisfies Task,
  list: [/* ... */],
}
```

Import from fixtures — never hardcode inline objects. Fixtures serve as the typed contract between tests and MSW handlers.

---

## Async assertions

```typescript
// waitFor retries until assertion passes or times out
await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())

// userEvent for realistic interactions
import userEvent from '@testing-library/user-event'
const user = userEvent.setup()
await user.click(screen.getByRole('button', { name: 'Save' }))
```

---

## Coverage

Run with coverage: `npm test -- --coverage`
Gate: 60% lines/branches/functions (raises each release).
Exclude: `src/test/**`, `**/*.d.ts`, `**/*.config.*`.

---

## Inventory workflow

Add to `src/test/inventory.md` or regenerate:
```bash
node scripts/regen-inventory.mjs
```
