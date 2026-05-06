# Wave M Follow-ups + Wave 6 Kickoff (2026-05-06)

## Purpose

Close remaining Wave M checklist items and remove build/test blockers, then formally start Wave 6 planning.

## Source References

- build-plan.md (Wave M + Wave 6)
- docs/prd/03-agent-monitor.md
- docs/agent/04-api-contract.md
- src/test/openapi.json
- src/test/handlers.ts

## Requirements

1. Complete Wave M unchecked follow-ups:
   - PRD reconciliation marker
   - OpenAPI typegen follow-up marker
2. Resolve cockpit build blockers:
   - fix TypeScript compile errors in affected files
3. Resolve contract conformance blockers:
   - align MSW handler paths/method signatures with OpenAPI paths
4. Start Wave 6:
   - add kickoff notes and mark Wave 6 as in progress in tracker

## Edge Cases and Failure Modes

- Parameter naming mismatch between handlers and OpenAPI path templates
  (camelCase route params in handlers vs snake_case params in OpenAPI).
- Local fallback handlers that do not map to real backend endpoints should not
  remain in contract-validated handler sets.
- Type generation must use the synced OpenAPI snapshot to avoid drift.

## Validation Plan

- npm run build
- npm run test -- src/test/contract/handlers.contract.test.ts
- npm run typecheck
- npm run test -- src/features/agent-monitor/components/SchedulingTriggerTable.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx
