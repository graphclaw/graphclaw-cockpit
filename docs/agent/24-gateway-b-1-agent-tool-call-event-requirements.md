# B-1 Requirements - AgentToolCallEvent Extension

## Requirement

Extend backend tool-call logging to emit a normalized `agent.tool_call` shape with session/task correlation and success metadata used by Agent Monitor session view.

## Source References

- `build-plan.md` (Wave M, Gateway B-1)
- `docs/agent/02-wave-plan.md` (Backend waves table)
- `docs/agent/04-api-contract.md` (SSE event shape)
- `graphclaw/docs/architecture/20-agent-activity-logging.md`

## Functional Requirements

1. Extend `AgentToolCallEvent` with:
   - `session_id: str`
   - `task_id: str | None`
   - `success: bool`
   - `attempt: int` (default `1`)
2. Emit `agent.tool_call` for both success and failure outcomes.
3. Include retry-attempt metadata where tool retry loops exist.
4. Keep payload PII-safe (no tool arguments or message bodies).

## Implementation Scope

- `graphclaw/src/graphclaw/infra/logging/events.py`
- `graphclaw/src/graphclaw/agent/main_orchestrator.py`
- `graphclaw/src/graphclaw/agent/sub_agent_runner.py`
- `graphclaw/src/graphclaw/mcp/client.py`

## Validation

- `graphclaw/tests/test_agent/test_loop.py`
  - verifies failure path emits `agent.tool_call` with `success=False`, `task_id`, and coerced `attempt`.
- `graphclaw/tests/test_agent/test_sub_agent_orchestration.py`
  - verifies retry loop emits per-attempt `agent.tool_call` records with attempt progression and success flip.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05
