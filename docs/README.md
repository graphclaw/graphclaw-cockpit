# GraphClaw Cockpit Documentation Hub

This index is the entry point for cockpit documentation and follows the same taxonomy model as the backend repository.

## Start Here

1. Product requirements index: `docs/prd/00-index.md`
2. Execution tracker: `docs/planning/build-plan.md`
3. Self-host guide: `docs/how-to/self-host.md`
4. Testing strategy: `docs/testing/test-strategy.md`
5. Agent monitor implementation docs: `docs/agent/`
6. Governance policy: `docs/governance/documentation-governance.md`
7. A2A future-release design plan (pending): `docs/planning/a2a-future-release-design-plan.md`
8. A2A API-plane alignment spike (in progress): `docs/planning/a2a-api-plane-alignment-spike.md`

## Maintainer Guides

- Release process: `docs/how-to/release.md`
- Versioning policy: `docs/explanation/versioning.md`
- Deprecation policy: `docs/explanation/deprecations.md`

## Taxonomy

- `docs/prd/`: canonical cockpit product requirements.
- `docs/agent/`: active implementation wave specs and references.
- `docs/testing/`: test strategy, ADRs, and scenario catalogs.
- `docs/governance/`: documentation lifecycle and quality policy.
- `docs/archive/`: historical records and completed-wave evidence.

## Source-of-Truth Matrix

- Product surfaces and UX contracts: `docs/prd/`
- Delivery status and wave progression: `docs/planning/build-plan.md`
- A2A deferred design and rollout plan: `docs/planning/a2a-future-release-design-plan.md`
- A2A cockpit/backend plane-alignment spike artifacts: `docs/planning/a2a-api-plane-alignment-spike.md`
- Testing conventions and gates: `docs/testing/test-strategy.md`
- End-to-end scenario inventory: `e2e/inventory.md`
- Unit/component test inventory: `src/test/inventory.md`
- Historical delivery trail: `docs/archive/build-timeline.md`

## Maintenance Rules

- Archive first, remove later: move superseded docs into `docs/archive/` before deletion.
- Any file move or rename must be recorded in `docs/redirects.md`.
- If implementation changes API usage, UI contracts, routing, or tests, update corresponding PRD/testing docs in the same change.
- Follow governance policy in `docs/governance/documentation-governance.md`.
