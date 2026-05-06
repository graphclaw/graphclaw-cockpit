# B-10 Requirements - Trigger Snooze/Resume Endpoints

## Requirement

Add user-facing trigger mutation endpoints so Scheduling panel rows can snooze and resume triggers.

## Source References

- `build-plan.md` (Wave M, Gateway B-10)
- `docs/agent/02-wave-plan.md` (Backend waves)
- `docs/prd/03-agent-monitor.md` (Section 5.2)
- `graphclaw/src/graphclaw/api/agent.py`
- `graphclaw/src/graphclaw/triggers/scheduler.py`

## Functional Requirements

1. Add endpoints under `/app/v1/agent`:
   - `POST /agent/triggers/{trigger_id}/snooze`
   - `POST /agent/triggers/{trigger_id}/resume`
2. Snooze semantics:
   - set trigger disabled in scheduler registry
   - preserve schedule metadata for later resume
3. Resume semantics:
   - set trigger enabled
   - compute next fire time when required (time-based cron triggers)
4. Return updated trigger config payload after mutation.
5. Return proper 404/503 responses for missing trigger/engine states.

## Validation Targets

- `tests/test_api/test_agent_routes.py` (snooze/resume route coverage)
- Existing trigger schedule endpoint should reflect updated enabled state.

## Status

- Planned: 2026-05-05
- Implemented: 2026-05-05
- State: Complete

## Implementation Notes

- Added backend routes in `graphclaw/src/graphclaw/api/agent.py`:
   - `POST /app/v1/agent/triggers/{trigger_id}/snooze`
   - `POST /app/v1/agent/triggers/{trigger_id}/resume`
- Added route tests in `graphclaw/tests/test_api/test_agent_routes.py` for 503/404 and happy-path state transitions.

## Validation

- Cockpit integration validated via scheduling route component/E2E assertions.
- Backend local pytest execution remains blocked in this environment (`No module named pytest`).
