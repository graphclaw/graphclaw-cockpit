# 01 — Data Sources

> **Status:** Approved · **Date:** 2026-05-03

This document maps every piece of data the Agent Monitor surfaces back to its persistent home. Use it when wiring a hook, debugging a missing field, or onboarding a new engineer.

---

## 1. Source taxonomy

GraphClaw's data lives in five places:

| Layer | Storage | Latency | Authority |
|-------|---------|---------|-----------|
| **SSE event stream** | Redis pub/sub → browser | Real-time | Ephemeral (not replayed) |
| **Property graph (AGE on Postgres)** | `TaskNode`, `CheckinNode`, etc. | Real-time write | Authoritative for messages, state, edges |
| **Postgres tables** | `escalation_queue`, `reply_lineage`, `agent_session_log` (NEW) | Real-time write | Authoritative for control state |
| **MinIO NDJSON** | `{user_id}/logs/{service}/{date}/{HH}00Z*.jsonl` | 0–30s lag (batched) | Authoritative for historical activity |
| **Polled REST endpoints** | Composed from the above | On request | Derived |

---

## 2. Per-panel data table

| Panel / Section | Data source | Endpoint / Stream | Phase |
|-----------------|-------------|--------------------|-------|
| Sidebar badge | escalation_queue + skills/workers FAILED | derived in `useAttentionItems()` | A |
| Attention Strip — failed skills | `/skills/workers` jobs status=FAILED last 24h | `GET /app/v1/skills/workers` | A |
| Attention Strip — stale heartbeats | `/agents/pool/runners` last_heartbeat > 300s | `GET /app/v1/agents/pool/runners` | A |
| KPI: Agent Status | running, queue_depth, last_cycle_at | `GET /app/v1/agent/status` | A |
| KPI: Last Run | last_cycle_at + last briefing tasks_scored | `GET /app/v1/agent/status` + briefing | A |
| KPI: Next Run | next_fire_at from first trigger | `GET /app/v1/agent/triggers/schedule` | A |
| KPI: Needs Attention | escalation count + failed skills | composed | A |
| Glance: Messages received | update_log entries today across user's tasks | `GET /app/v1/comms/summary?date=today` | B |
| Glance: Replies sent | CheckinNode created today | `GET /app/v1/comms/summary?date=today` | B |
| Glance: Skills run | `/skills/workers` completed_jobs filtered today | `GET /app/v1/skills/workers` | A |
| Glance: Tasks scored | last cycle tasks_scored | `GET /app/v1/agent/status` | A |
| Glance: Runs today | count from `/agent/sessions` | `GET /app/v1/agent/sessions` | B |
| Live Ticker | SSE events translated client-side | SSE `/app/v1/events` | A |
| Activity Feed (today, live) | SSE ring buffer (20) + localStorage bridge | SSE `/app/v1/events` | A |
| Activity Feed (historical) | MinIO NDJSON read by gateway, formatted | `GET /app/v1/agent/activity` | **B (moved to Phase A)** |
| Activity Sessions group | `agent_session_log` table | `GET /app/v1/agent/sessions` | B |
| Comms banner counts | composed | `GET /app/v1/comms/summary` | B |
| Comms inbound list | TaskNode.update_log[] flattened | `GET /app/v1/tasks/inbound-log` | B |
| Comms outbound list | CheckinNode records | `GET /app/v1/tasks/outbound-log` | B |
| Scheduling: Next run | first upcoming trigger | `GET /app/v1/agent/triggers/schedule` | A |
| Scheduling: Trigger list | all triggers | `GET /app/v1/agent/triggers/schedule` | A |
| Scheduling: Run history | `agent_session_log` table | `GET /app/v1/agent/sessions` | B |
| Skills: Worker pool | workers + jobs | `GET /app/v1/skills/workers` | A |
| Skills: Recent jobs | completed_jobs | `GET /app/v1/skills/workers` | A |
| Scoring: Task table | action queue | `GET /app/v1/agent/action-queue` | A |
| Scoring: Factor breakdown | per-task scoring detail | `GET /app/v1/scoring/tasks/{id}` | A |
| Scoring: Score history | timeline | `GET /app/v1/scoring/tasks/{id}/history` | A |
| Scoring: What-if simulator | hypothetical recompute | `POST /app/v1/scoring/simulate` | A (verify exists, B-8) |
| Agents: Pool KPIs | pool status | `GET /app/v1/agents/pool/status` | A |
| Agents: Dispatch plan | per-session tier plan | `GET /app/v1/agents/dispatch-plan/{session_id}` | A |
| Agents: Heartbeat timeline | per-runner heartbeats | `GET /app/v1/agents/pool/runners` | A |
| Agents: Active delegations | running delegations | `GET /app/v1/agents/delegations` | A (verify exists, B-9) |

---

## 3. SSE event → panel routing

When an SSE event fires, multiple panels may need to react:

| Event type | Live ticker | Activity (today) | Other side-effects |
|------------|:-----------:|:----------------:|--------------------|
| `task.scored` | ✓ append | ✓ append | invalidate `/agent/action-queue` |
| `skill.completed` | ✓ append | ✓ append | invalidate `/skills/workers`; if FAILED → push to Attention |
| `briefing.ready` | ✓ append | ✓ append | — |
| `task.state_changed` | ✓ append | ✓ append | invalidate task pages if open |
| `approval.pending` | ✓ append | ✓ append | push to Attention |
| `agent.heartbeat` | — | — | live update Heartbeat timeline |
| `agent.tool_call` (Phase B) | — | ✓ append (when Session toggle on) | — |

Implementation: `useSSE([eventType])` hook invalidates the relevant TanStack Query keys.

---

## 4. MinIO NDJSON file layout

```
{user_id}/logs/{service}/{YYYY-MM-DD}/{HH}00Z-{pid}-{suffix}.jsonl
```

- One file per (user, service, hour, process). The `-{pid}-{suffix}` segment is added by **B-7** to fix the existing write race.
- Reader (`GET /agent/activity`) globs `{HH}00Z*.jsonl` and merges by timestamp.
- Each line is a JSON record with at minimum: `timestamp`, `event_type`, `service`, `user_id`, `session_id`, `level`. Other fields per `events.py` model.
- System logs land at `system/logs/...` and are **not** read by the cockpit. Admin only.

---

## 5. Authoritative answers to common questions

**Q: Where do tool calls go?**
A: Same hourly NDJSON file as everything else for that user/service, distinguished by `event_type: "agent.tool_call"`. **Currently not wired** — Phase B B-1 adds the wiring across all 5 agent files.

**Q: Why isn't the Activity panel showing tool calls?**
A: Until B-1 ships, only SSE-emitted event types appear. `agent.tool_call` is not currently emitted.

**Q: Where is the agent's running status persisted?**
A: It isn't — `/agent/status` is computed from in-memory state of the agent loop process. If the gateway restarts, the response shows `running: false` until the loop spins up. This is intentional.

**Q: Why does `cost_usd` always show as $0?**
A: Cost calculation is not implemented in any LLM provider yet (Gap 3 from brainstorm). Cost columns are deliberately not surfaced anywhere in v2; tokens are.

**Q: Where do plain-language event strings come from?**
A: Server-side from `graphclaw.agent.activity_formatter.format_event(record)`. The cockpit's `formatEvent.ts` mirrors the same mapping for live SSE events; CI snapshot-tests both against `tests/fixtures/event_formatter_cases.json`.

---

## 6. Schema assumptions (verify before implementing)

These are assumed by the v2 design but not yet fully verified — confirm during M-A:

| Assumption | Where to check |
|-----------|----------------|
| `TaskNode.update_log[]` has `{date, source, channel, summary, signal, action_taken}` | `graphclaw/src/graphclaw/db/graph/schema.py` (or wherever Node schemas live) |
| `CheckinNode` has `{created_at, channel, recipient_hashed, subject, status}` | same |
| `agent_channel_identities` table maps recipient_hashed → display_name | `graphclaw/migrations/` |
| Each AGE node carries owner `user_id` | graph schema |
| `escalation_queue` table exists with `{user_id, task_id, expires_at}` | `graphclaw/migrations/` |
| `/agents/delegations` endpoint exists | `graphclaw/src/graphclaw/api/agents.py` |
| `/scoring/simulate` endpoint exists | `graphclaw/src/graphclaw/api/scoring.py` |

If any check fails → escalate to gateway work (B-8 / B-9 / new task as appropriate).
