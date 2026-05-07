# Cockpit Skills Index

This index tracks cockpit skills and overlap status.

## Skills

| Skill Folder | Domain | Status | Notes |
|---|---|---|---|
| `cockpit-react-patterns/` | React and component patterns | active | Cockpit-specific implementation guidance. |
| `cockpit-api-integration/` | API client and query integration patterns | active | Canonical for openapi-fetch and TanStack Query usage. |
| `cockpit-vitest-patterns/` | Unit/component testing in cockpit | active | Keep paired with backend pytest conventions. |
| `cockpit-contract-tests/` | Contract testing for handlers/OpenAPI alignment | active | Cockpit-specific MSW contract layer. |
| `cockpit-playwright-e2e/` | E2E conventions and fixtures | active | Canonical cockpit E2E guidance. |
| `cockpit-docker-deploy/` | Cockpit Docker and compose workflows | active | Deployment and local stack guidance. |
| `test-inventory-maintenance/` | Shared test inventory conventions | shared-active | Cross-repo shared skill; do not fork. |

## Conservative Deprecation Markers

- `cockpit-vitest-patterns/`: deprecate-candidate if/when unified frontend testing skill supersedes it.
- `cockpit-contract-tests/`: deprecate-candidate if/when contract conventions are merged into a shared contract skill.

## Policy

- No removals in this phase.
- Mark overlap first, then migrate references, then archive in a later phase.
