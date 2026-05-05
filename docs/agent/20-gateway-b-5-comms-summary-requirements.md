# B-5 Requirements - Comms Summary Endpoint

## Requirement

Implement backend endpoint `GET /app/v1/comms/summary` to power Comms banner and Overview glance metrics.

## Source References

- `build-plan.md` (Wave M, Gateway B-5)
- `docs/agent/02-wave-plan.md` (Backend waves table)
- `docs/agent/04-api-contract.md` (Section 3.3)

## Functional Requirements

1. Add authenticated, user-scoped endpoint under `/app/v1/comms/summary`.
2. Support optional `date` query parameter (`YYYY-MM-DD`).
3. Default to current UTC date when `date` is omitted.
4. Aggregate from NDJSON log events into:
   - `received`,
   - `sent`,
   - `matched`,
   - `unmatched`.
5. Return response shape:
   - `date`, `received`, `sent`, `matched`, `unmatched`.

## Validation

- Added `tests/test_api/test_comms_summary_api.py` coverage for:
  - date-filtered aggregation,
  - default UTC date behavior,
  - auth requirement.
- Header and inventory governance scripts run successfully.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05
