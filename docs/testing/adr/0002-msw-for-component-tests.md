# ADR-0002: MSW for component and unit test API mocking

**Status**: Accepted  
**Date**: 2026-05-04

## Decision

Use Mock Service Worker (MSW 2.x) to intercept API calls in Vitest component and unit tests. Do not mock `fetch`, `axios`, or the `openapi-fetch` client directly.

## Context

Component tests in a React + TanStack Query application need API responses to be controlled. Two approaches were considered:

**Option A — mock the API client directly**: `vi.mock('@/lib/api-client')` and return fake data from each call site. Simple per-test, but couples tests to the internal implementation of how the component calls the API.

**Option B — MSW at the network layer**: Define handlers in `src/test/handlers.ts` that intercept actual HTTP requests before they leave the process. Components call the API exactly as they do in production; only the network response is intercepted.

MSW was chosen because:
- Tests verify the full component→query→fetch→parse→render path, not just the render part.
- Handler definitions double as living documentation of the API surface the frontend depends on.
- The same handler set can be used in Storybook, development, and tests without per-test wiring.
- If a component changes which endpoint it calls (e.g., moves from GET /tasks to GET /tasks/v2), the test fails at the MSW level — the change is visible in the handler diff.
- MSW 2.x works with the native fetch API used by `openapi-fetch` — no additional adapter required.

## Consequences

- All API mocks live in `src/test/handlers.ts`. Component test files do not import or mock `api-client.ts`.
- MSW node server is started in `src/test/setup.ts` (called once per Vitest worker).
- Handlers are typed to match the OpenAPI response shape — a type error in a handler means a type error in the contract test too.
- The contract test (`src/test/contract/handlers.contract.test.ts`) validates that every handler in `handlers.ts` matches a real path/method in the backend OpenAPI spec — so MSW handlers cannot silently drift.
- Unhandled requests trigger a warning in test output (`onUnhandledRequest: 'warn'`). If a component calls an endpoint not in `handlers.ts`, the test sees a 500 and fails loudly.
