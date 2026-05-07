# GraphClaw Cockpit Documentation Hub

This index is the entry point for cockpit documentation and follows the same taxonomy model as the backend repository.

## Start Here

1. Product requirements index: `docs/prd/00-index.md`
2. Execution tracker: `docs/planning/build-plan.md`
3. Testing strategy: `docs/testing/test-strategy.md`
4. Agent monitor implementation docs: `docs/agent/`
5. Governance policy: `docs/governance/documentation-governance.md`

## Taxonomy

- `docs/prd/`: canonical cockpit product requirements.
- `docs/agent/`: active implementation wave specs and references.
- `docs/testing/`: test strategy, ADRs, and scenario catalogs.
- `docs/governance/`: documentation lifecycle and quality policy.
- `docs/archive/`: historical records and completed-wave evidence.

## Source-of-Truth Matrix

- Product surfaces and UX contracts: `docs/prd/`
- Delivery status and wave progression: `docs/planning/build-plan.md`
- Testing conventions and gates: `docs/testing/test-strategy.md`
- End-to-end scenario inventory: `e2e/inventory.md`
- Unit/component test inventory: `src/test/inventory.md`
- Historical delivery trail: `docs/archive/build-timeline.md`

## Maintenance Rules

- Archive first, remove later: move superseded docs into `docs/archive/` before deletion.
- Any file move or rename must be recorded in `docs/redirects.md`.
- If implementation changes API usage, UI contracts, routing, or tests, update corresponding PRD/testing docs in the same change.
- Follow governance policy in `docs/governance/documentation-governance.md`.
