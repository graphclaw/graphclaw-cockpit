# Testing — graphclaw-cockpit

Quick reference for running tests. For the full cross-repo strategy see [graphclaw/docs/testing/master-strategy.md](../../../graphclaw/docs/testing/master-strategy.md). For frontend-specific details see [test-strategy.md](test-strategy.md).

## Commands

| Command | What it runs |
|---|---|
| `npm test` | Vitest unit + component tests (single run) |
| `npm run test:watch` | Vitest in watch mode |
| `npm test -- --coverage` | Unit tests with coverage report |
| `npm run test:e2e` | Playwright E2E (requires Docker stack) |
| `npm run typecheck` | TypeScript check, no emit |
| `npm run lint` | ESLint |

## Running the Docker stack (required for E2E)

```bash
docker compose up -d
# Wait for healthy, then:
npm run test:e2e
# Or in Docker:
docker compose --profile test run --rm e2e
```

## Test layers at a glance

```
L1 Unit          src/**/*.test.tsx      Vitest + MSW, co-located
L2 Component     src/**/*.test.tsx      Vitest + RTL + renderWithProviders
L3 Contract      src/test/contract/     MSW handlers vs openapi.json
L5 E2E           e2e/specs/             Playwright + full Docker stack
```

## Adding a test

See [contributing-tests.md](contributing-tests.md) for the decision tree (which layer → where the file goes → how to allocate a test ID → what the file header must contain).

## Coverage

```bash
npm test -- --coverage
open coverage/index.html
```

CI gate: **60% lines/branches/functions/statements** (raises each release).
