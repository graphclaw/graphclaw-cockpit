# Cockpit Agents Index

This index tracks active agent definitions for cockpit development workflows.

## Agents

| Agent | Primary Use | Status | Notes |
|---|---|---|---|
| `cockpit-builder.md` | Feature implementation and UI build work | active | Primary implementation agent for cockpit code changes. |
| `cockpit-reviewer.md` | Code and fidelity review | active | Use for quality and regression checks. |
| `cockpit-evaluator.md` | Structured UI evaluation workflows | active | Legacy wireframe-eval output path now archived; keep agent file active. |
| `cockpit-tester.md` | E2E and flow validation support | active | Use with Playwright conventions. |

## Conservative Deprecation Markers

- `cockpit-evaluator.md`: deprecate-candidate for legacy write path references (`wireframes-v2/reviews/`); retain until all downstream references move to archive-aware paths.

## Policy

- No removals in this phase.
- If an agent role is merged or renamed later, first add redirect notes in docs and this index.
