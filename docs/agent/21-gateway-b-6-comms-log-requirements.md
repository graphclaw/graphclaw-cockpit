# B-6 Requirements - Inbound and Outbound Log Endpoints

## Requirement

Implement backend endpoints `GET /app/v1/tasks/inbound-log` and `GET /app/v1/tasks/outbound-log` for Agent Monitor Comms tabs.

## Source References

- `build-plan.md` (Wave M, Gateway B-6)
- `docs/agent/02-wave-plan.md` (Backend waves table)
- `docs/agent/04-api-contract.md` (Sections 3.4 and 3.5)

## Functional Requirements

1. Add authenticated user-scoped routes:
   - `/app/v1/tasks/inbound-log`
   - `/app/v1/tasks/outbound-log`
2. Support query params:
   - `from` (required ISO8601)
   - `to` (required ISO8601)
   - `limit` (1-100, default 50)
   - `cursor` (opaque string)
3. Return paginated rows with `nextCursor` for both endpoints.
4. Inbound log row fields:
   - timestamp, channel, fromDisplay, messagePreview, taskId, actionTaken, signal.
5. Outbound log row fields:
   - timestamp, channel, toDisplay, subject, summary, taskId, status.
6. Reject invalid ranges where `to <= from`.

## Validation

- Added `tests/test_api/test_tasks_logs_api.py` coverage for:
  - inbound cursor pagination,
  - outbound row mapping,
  - invalid range rejection,
  - auth enforcement.
- Header and inventory governance scripts run successfully.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05
