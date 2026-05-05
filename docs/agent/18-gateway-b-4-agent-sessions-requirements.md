# B-4 Requirements - Agent Sessions Endpoint

## Requirement

Implement backend endpoint `GET /app/v1/agent/sessions` to support Agent Monitor session grouping and scheduling run history.

## Source References

- `build-plan.md` (Wave M, Gateway B-4)
- `docs/agent/02-wave-plan.md` (Backend waves table)
- `docs/agent/04-api-contract.md` (Section 3.2)

## Functional Requirements

1. Add authenticated user-scoped sessions endpoint under `/app/v1/agent`.
2. Support query params:
   - `from` (default now-7d)
   - `to` (default now)
   - `limit` (1-50, default 10)
   - `cursor` (offset pagination)
3. Aggregate MinIO NDJSON records by `session_id`.
4. Return fields:
   - `sessionId`, `startedAt`, `completedAt`, `triggerType`
   - `toolCallCount`, `skillCount`, `messagesSent`, `messagesReceived`
   - `inputTokens`, `outputTokens`, `status`
   - `nextCursor`
5. Enforce 7-day max range guard.

## Validation

- Extended `tests/test_api/test_agent_activity_api.py` with:
  - session aggregation assertions,
  - offset-cursor pagination assertions.
- Ran inventory/header governance scripts successfully.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05
