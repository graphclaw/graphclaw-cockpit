# M-H-3 Requirements - Heartbeat Timeline

## Requirement

Deliver the Agents panel heartbeat timeline for Wave M-H-3 on `/agent-monitor/agents`.

## Source References

- `build-plan.md` (Wave M, M-H-3)
- `docs/agent/02-wave-plan.md` (M-H-3 details)
- `docs/agent/01-data-sources.md` (Agents: Heartbeat timeline)
- `docs/prd/03-agent-monitor.md` (Section 8.3)

## Functional Requirements

1. Add `HeartbeatTimeline` component in agents section below KPI strip.
2. Data source: `GET /app/v1/agents/pool/runners` (optional payload handling).
3. Render one row per runner with state and heartbeat age.
4. Render 30 timeline segments on desktop, 15 visible on mobile.
5. Segment colors:
   - green for heartbeat <= 60s,
   - amber for 60-300s,
   - red for > 300s,
   - empty/grey for idle/no heartbeat.
6. If runners payload missing, fallback to `/app/v1/agents` list for row shells.
7. Keep stable test id in both populated and empty states.

## Edge Cases

- Missing or invalid heartbeat timestamps.
- Endpoint returns `{ runners: [...] }` or bare list.
- State values can vary by casing.

## Verification Plan

- Component tests:
  - populated runner rows with segment rendering,
  - stale heartbeat renders red segment tone,
  - empty state when no runners/agents available.
- Agent Monitor route test:
  - agents route renders heartbeat timeline component.
- Playwright:
  - `/agent-monitor/agents` shows heartbeat timeline container.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05
