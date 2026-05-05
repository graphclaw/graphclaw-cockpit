# B-7 Requirements - MinIO Log Write Race Fix

## Requirement

Fix object-storage log write collisions caused by multiple processes writing to the same hourly key.

## Source References

- `build-plan.md` (Wave M, Gateway B-7)
- `docs/agent/02-wave-plan.md` (Backend waves table)
- `docs/agent/01-data-sources.md` (MinIO NDJSON layout)
- `docs/agent/05-open-risks.md` (R-2 race risk)

## Functional Requirements

1. Update object-storage logging path computation to include a per-process suffix.
2. New key pattern:
   - `{user_id}/logs/{service}/{YYYY-MM-DD}/{HH}00Z-{pid}-{suffix}.jsonl`
3. Ensure one process writes one hourly object key to avoid cross-process overwrite races.
4. Keep log-reader compatibility with glob/regex patterns that parse `{HH}00Z` partitions.

## Validation

- Updated `tests/test_infra/test_logging/test_object_storage_handler.py` to validate:
  - race-safe suffix shape in computed paths,
  - per-handler path suffix stability,
  - existing batching behavior remains intact.
- Header and inventory governance scripts run successfully.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05
