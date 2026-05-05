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

- Resolved on 2026-05-05 by adding backend `GET /app/v1/agents/dispatch-plan/{session_id}`.
- `GET /app/v1/agents/delegations` is already available from backend wave B-9.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05
