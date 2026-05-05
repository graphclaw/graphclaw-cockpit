# B-2 Requirements - agent_session_log Migration and Writer

## Requirement

Add a durable session-summary table and orchestrator write path so session history can be read without scanning full NDJSON logs.

## Source References

- `build-plan.md` (Wave M, Gateway B-2)
- `docs/agent/02-wave-plan.md` (Backend waves table)
- `graphclaw/docs/architecture/20-agent-activity-logging.md` (Section 7)
- `graphclaw/src/graphclaw/migrations/catalogue.py`
- `graphclaw/src/graphclaw/agent/main_orchestrator.py`

## Functional Requirements

1. Add migration `0023` creating `agent_session_log` with:
   - `session_id` PK
   - `user_id`, `started_at`, `completed_at`, `trigger_type`, `status`
   - summary counters (`tool_call_count`, `skill_count`, `messages_sent`, `messages_received`, `input_tokens`, `output_tokens`)
2. Add index `(user_id, started_at DESC)` for session-history reads.
3. Add orchestrator writer in run cycle:
   - insert `running` row at cycle start (non-cached runs)
   - update completion metadata in `finally` with `completed` or `failed`
4. Keep writer safe in non-DB contexts (unit tests, non-AGE store) via graceful no-op.

## Validation

- `tests/test_agent/test_loop.py::test_run_cycle_writes_session_log_rows`
  - verifies `run_cycle` performs insert + update SQL calls via mocked DB connection.
- Migration catalogue invariants remain sequential with new version `0023`.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05
