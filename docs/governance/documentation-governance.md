# Documentation Governance

## Scope

This policy defines how documentation is authored, updated, archived, and validated in the cockpit repository.

## Canonical Sources

- Product requirements index: `docs/prd/00-index.md`
- Delivery status and wave sequencing: `docs/planning/build-plan.md`
- Testing policy: `docs/testing/test-strategy.md`
- End-to-end and component test inventories: `e2e/inventory.md`, `src/test/inventory.md`

## Required Update Triggers

Update documentation in the same change whenever you modify:

- API contracts consumed by cockpit hooks/components.
- Route structure, major feature surfaces, or UX behavior.
- Test strategy, fixtures, inventory registration, or contract handlers.
- Build wave status and implementation milestones.
- Agent monitor requirements or design references under `docs/agent/`.

## Archive Policy

- Use archive-first workflow for superseded docs.
- Move outdated documents into `docs/archive/` with date and cohort naming.
- Do not hard-delete until links and references are validated.

## Redirect Policy

- Track every move or rename in `docs/redirects.md`.
- Keep redirect mappings through at least one release cycle.

## Quality Gates For Documentation Changes

Before merge, run:

- `npm run typecheck`
- `npm run lint`
- `npm run test`

Also verify:

- Updated docs have no contradictory wave/status claims.
- New links resolve correctly.
- PRD/testing source docs are updated when implementation contracts change.

## Commit Discipline

- Use requirement or wave scoped commits where applicable.
- Do not mix unrelated documentation migrations into feature commits.
- Include concise migration notes in commit body for moved/archived files.

## Drift Audit Cadence

- Run a monthly documentation drift review.
- Reconcile `CLAUDE.md`, `docs/planning/build-plan.md`, and PRD status claims.
- Validate test inventories and scenario catalogs remain synchronized.
