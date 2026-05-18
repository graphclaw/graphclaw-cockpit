# A2A API Plane Alignment Spike (Cockpit)

Status: In progress (spike)
Owner: TBD
Last updated: 2026-05-18

## Goal

Start cockpit-side alignment work so A2A consumers can read from either API plane while backend canonicalization is decided.

Planes in scope:

- App plane: `/app/v1/a2a/*`
- Runtime plane: `/api/v1/a2a/*`

## Problem

Cockpit currently contains A2A data consumers that assume app-plane response shapes. During canonicalization, these assumptions can cause breakage if runtime-plane responses are used directly.

## Spike implementation (completed in this pass)

1. Added shared A2A plane adapter:
- `src/lib/a2a-api-plane.ts`
- Resolves path strategy from `VITE_A2A_API_PLANE` (`app` default, `runtime` optional)
- Normalizes list/create payloads into cockpit-friendly shape

2. Wired existing A2A hooks to adapter:
- `src/lib/api-hooks.ts` now uses normalized paths and response adapters
- `src/features/canvas/hooks/useCanvasApi.ts` now consumes normalized A2A list payloads

## Current environment switch

- `VITE_A2A_API_PLANE=app` (default behavior)
- `VITE_A2A_API_PLANE=runtime` (spike mode to exercise runtime-plane management paths)

## Non-goals

- No production rollout of runtime-plane mode yet
- No UI expansion of A2A controls in current release
- No orchestrator outbound callback implementation in this spike

## Follow-up tasks

1. Add contract tests for normalized cockpit shape against both planes.
2. Add telemetry around plane mode and payload mismatch counts.
3. Promote this from spike to release default only after backend canonicalization decision.

## References

- `docs/planning/a2a-future-release-design-plan.md`
- `../graphclaw/docs/planning/a2a-api-plane-alignment-spike.md`
