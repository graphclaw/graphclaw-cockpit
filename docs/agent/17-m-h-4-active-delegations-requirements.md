# M-H-4 Requirements - Active Delegations Table

## Requirement

Deliver the Active Delegations table in the Agents panel on `/agent-monitor/agents`.

## Source References

- `build-plan.md` (Wave M, M-H-4)
- `docs/agent/02-wave-plan.md` (M-H-4 details)
- `docs/agent/01-data-sources.md` (Agents: Active delegations)
- `docs/prd/03-agent-monitor.md` (Section 8.3)

## Functional Requirements

1. Add `ActiveDelegationsTable` component beneath existing agents KPIs/timeline.
2. Wire to `GET /app/v1/agents/delegations` with optional payload handling.
3. Render columns:
   - Agent ID
   - Task chip
   - Session ID (truncated)
   - Status badge
   - Started
   - Last heartbeat age
   - Duration
4. Highlight stale heartbeat rows (`heartbeat age > 300s`) in amber.
5. Highlight `BLOCKED` status rows in red.
6. Preserve stable test ids for populated table and empty state.

## Edge Cases

- Endpoint absent or returns empty payload.
- Mixed field naming styles (`snake_case` vs `camelCase`).
- Missing timestamps or non-parsable values.

## Verification Plan

- Component tests:
  - populated rows and core columns,
  - stale heartbeat styling,
  - blocked status styling,
  - empty state fallback.
- Agent Monitor integration test for agents route composition.
- Playwright route assertion for delegations section visibility.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05
