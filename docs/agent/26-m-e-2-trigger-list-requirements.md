# M-E-2 Requirements - Scheduling Trigger List Table

## Requirement

Ship the Scheduling panel trigger list with row-level snooze/resume controls and inline details.

## Source References

- `build-plan.md` (Wave M, M-E-2)
- `docs/agent/02-wave-plan.md` (M-E-2)
- `docs/prd/03-agent-monitor.md` (Section 5.2)
- `docs/agent/04-api-contract.md`

## Functional Requirements

1. Render a trigger table in `/agent-monitor/scheduling` with columns:
   - Trigger
   - Type
   - Schedule
   - Last fired
   - Next fire
   - Status
   - Action button
2. Support row-level inline expansion for trigger details.
3. Action behavior:
   - enabled trigger -> Snooze
   - snoozed/disabled trigger -> Resume
4. Prevent duplicate mutations while request is pending.
5. Keep compatibility with snake_case and camelCase payloads where present.

## Backend Dependency

- Requires B-10 endpoints:
  - `POST /app/v1/agent/triggers/{id}/snooze`
  - `POST /app/v1/agent/triggers/{id}/resume`

## Validation Targets

- `src/features/agent-monitor/components/SchedulingTriggerTable.test.tsx`
- `src/features/agent-monitor/AgentMonitorPage.test.tsx`
- `e2e/agent/agent-monitor.spec.ts`

## Status

- Planned: 2026-05-05
- Implemented: 2026-05-05
- State: Complete

## Implementation Notes

- Added table UI in `src/features/agent-monitor/components/SchedulingTriggerTable.tsx`.
- Wired table in `src/features/agent-monitor/AgentMonitorPage.tsx`.
- Added trigger mutation hooks in `src/lib/api-hooks.ts` for snooze/resume actions.

## Validation

- `npm run test -- src/features/agent-monitor/components/SchedulingTriggerTable.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx`
- `npm run test -- src/features/agent-monitor/components/SchedulingRunHistoryTable.test.tsx src/features/agent-monitor/components/SchedulingNextRunCard.test.tsx`
- `npm run typecheck`
