# M-E-3 Requirements - Scheduling Run History

## Requirement

Ship Scheduling panel run history using backend sessions endpoint so operators can review recent agent cycles.

## Source References

- `build-plan.md` (Wave M, M-E-3)
- `docs/agent/02-wave-plan.md` (Section 5: Scheduling panel)
- `docs/agent/04-api-contract.md` (Section 3.2 `GET /app/v1/agent/sessions`)

## Functional Requirements

1. Render run history table in `/agent-monitor/scheduling` under the Next run card.
2. Read data from `GET /app/v1/agent/sessions?limit=10`.
3. Display per-session fields:
   - session ID,
   - trigger type,
   - started timestamp,
   - duration,
   - tool/skill counts,
   - message in/out counts,
   - token totals,
   - status badge.
4. Provide empty state when no sessions exist.
5. Support cursor pagination (`nextCursor`) via Load more action.
6. Keep M-E-2 trigger list deferred (resume endpoint still missing).

## Validation

- `SchedulingRunHistoryTable.test.tsx`
  - row render from session payload,
  - empty fallback,
  - load more pagination action.
- `AgentMonitorPage.test.tsx`
  - scheduling route includes run history block.
- `e2e/agent/agent-monitor.spec.ts`
  - scheduling route shows run history table or empty state.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05
