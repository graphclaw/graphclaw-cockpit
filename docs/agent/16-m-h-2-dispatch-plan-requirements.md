# M-H-2 Requirements - Dispatch Plan Visualization (Blocked)

## Requirement

Deliver dispatch tier swim-lanes for the Agents panel (`/agent-monitor/agents`).

## Source References

- `build-plan.md` (Wave M, M-H-2)
- `docs/agent/02-wave-plan.md` (M-H-2 details)
- `docs/agent/01-data-sources.md` (Agents data section)
- `docs/prd/03-agent-monitor.md` (Section 8.3)

## Functional Requirements

1. Determine active `session_id` from `GET /app/v1/agents/delegations`.
2. Read dispatch tiers from `GET /app/v1/agents/dispatch-plan/{session_id}`.
3. Render swim-lanes for Tier 1..N with state chips:
   - Running (green)
   - Completed (muted + check)
   - Pending (dashed)
   - Blocked (red)

## Blocker

- As of 2026-05-05, backend source scan in `graphclaw/src/graphclaw/api/**/*.py` shows no `GET /app/v1/agents/dispatch-plan/{session_id}` endpoint.
- `GET /app/v1/agents/delegations` is listed as pending backend wave B-9 and is not yet available in backend source.

## Status

- Planned: 2026-05-05
- Blocked pending backend endpoints (B-9 + dispatch-plan route)
