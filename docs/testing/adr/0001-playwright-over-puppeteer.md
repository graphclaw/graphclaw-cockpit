# ADR-0001: Playwright over Puppeteer for E2E

**Status**: Accepted  
**Date**: 2026-05-04

## Decision

Consolidate all E2E testing onto Playwright (`@playwright/test`). The Puppeteer + Jest suite (`e2e-puppeteer/`) is being ported onto Playwright fixtures and will be deleted once parity is confirmed.

## Context

At the time of this decision, two E2E suites coexist:
- `e2e/` — 18 Playwright `.spec.ts` files, basic auth fixture, inline selectors.
- `e2e-puppeteer/` — 29 spec files with richer helpers (`db.helper.ts`, `minio.helper.ts`, `api.helper.ts`, `TestContext` base class, `seed-all.ts` / `teardown-all.ts`). Runs via Jest + `--experimental-vm-modules` + a custom sequencer.

The evaluation favoured Playwright on the following grounds:

**Playwright wins**:
- Full test runner (fixtures, reporter, parallelism control, trace viewer) built in. Puppeteer is a browser library — Jest + ts-jest + custom sequencer are assemblage overhead.
- Auto-waiting locators (`getByRole`, `getByText`) — tests don't break when internal DOM structure changes. Puppeteer requires manual `waitForSelector`.
- Trace viewer — on failure, see the exact DOM state, network log, and console at every step. Invaluable for debugging backend-state bugs.
- First-class TypeScript, codegen, multi-browser.
- `workers: 1` replaces the custom Jest sequencer for sequential execution (required by backend rate-limit of 300 req/min/user).

**Migration cost is bounded**:
- The Puppeteer suite's value is its helpers (`db.helper.ts`, `minio.helper.ts`, `api.helper.ts`) and the seed-manifest pattern. These are pure Node modules that port to Playwright fixtures in a few days.
- Porting 29 specs benefits from Playwright's auto-waiting — many `waitForSelector` / `waitForFunction` calls collapse to simple locator assertions.

**Split-responsibility (Playwright + Puppeteer coexistence) was rejected** because:
- Two places to update selectors when the UI changes.
- Engineers unsure where to add a new test.
- Two CI jobs with overlapping coverage.

## Consequences

- `e2e-puppeteer/` is archived to `e2e-archive/` after all specs are ported, then deleted.
- `package.json` loses: `puppeteer`, `jest`, `ts-jest`, `--experimental-vm-modules` flag, `test:e2e:puppeteer*` scripts, custom sequencer.
- `docker-compose.yml` loses the `e2e-puppeteer` service and `--profile test-puppeteer`.
- `e2e/fixtures/` gains the full set of Playwright fixtures ported from Puppeteer helpers: `db.fixture.ts`, `minio.fixture.ts`, `api.fixture.ts`, `seed.fixture.ts`.
- All future E2E work goes into `e2e/specs/` using the Playwright fixture system.
