# 03 — Agent Monitoring & Observability

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

> **2026-05-02 design extension.** Surface for the comms / inbound / outbound triad must show: distillation events (task_entry written / memory_note written), outbound agent activity, scheduler-driven runs (FollowUpTrigger), pending escalations, and principal-name on every DB call (NFR-008). References:
> - [graphclaw/docs/architecture/14-agent-triad.md](../../../graphclaw/docs/architecture/14-agent-triad.md)
> - [graphclaw/docs/architecture/18-follow-up-cadence.md](../../../graphclaw/docs/architecture/18-follow-up-cadence.md)
> - [graphclaw/docs/requirements/agent-triad-and-comms-substrate.md](../../../graphclaw/docs/requirements/agent-triad-and-comms-substrate.md) NFR-005, NFR-006, NFR-008

---

## 3.1 Agent Activity Dashboard

The agent dashboard is the primary observability surface. It answers: "What is the agent doing right now?"

| Widget | Data Source | Refresh |
|--------|-----------|---------|
| **Agent Status** | `GET /app/v1/agent/status` | SSE `agent.status_changed` |
| Current state (IDLE / RUNNING / ERROR) | | |
| Last invocation timestamp | | |
| Active session_id | | |
| Current trigger type (SCHEDULED / INBOUND / ON_DEMAND) | | |
| **Recent Activity Feed** | SSE stream | Real-time |
| Last 20 events: trigger fired, task scored, state changed, skill started/completed, message sent | | |

---

## 3.2 Action Queue Inspector

View the ranked action queue the agent produces each cycle — before it becomes a briefing.

| Column | Source Field |
|--------|-------------|
| Rank | `ActionQueueEntry.rank` |
| Task ID | `ActionQueueEntry.node_id` (clickable → graph) |
| Score | `ActionQueueEntry.final_score` |
| Recommended Action | `ActionQueueEntry.recommended_action` |
| Autonomy Level | `ActionQueueEntry.autonomy_level` (SUGGEST / AUTONOMOUS / REQUIRE_APPROVAL) |
| Top Factor | `ActionQueueEntry.explanation.factors[0]` |
| Batched With | `ActionQueueEntry.batched_with` (grouped tasks) |

**Endpoint:** `GET /app/v1/agent/action-queue`

Users can:
- Sort by score, rank, or autonomy level
- Click a task to navigate to the graph node
- Compare current queue with previous cycle (delta view)

---

## 3.3 Scoring Inspector

Deep dive into why tasks are ranked the way they are.

### Per-Task Score Breakdown

For any task, display the 7-factor scoring breakdown:

| Factor | Weight | Raw Score | Weighted | Plain English |
|--------|--------|-----------|----------|---------------|
| W1: Timeline Urgency | 0.25 | 0.85 | 0.213 | "Deadline in 3 days with 2 days effort — almost no slack" |
| W2: Dependency Weight | 0.20 | 0.60 | 0.120 | "4 downstream tasks depend on this" |
| W3: Critical Path | 0.20 | 1.00 | 0.200 | "On the critical path for Q3 Launch (P1)" |
| W4: Blocker | 0.15 | 0.00 | 0.000 | "No blockers" |
| W5: Human Override | 0.10 | 0.00 | 0.000 | "No override set" |
| W6: Resource Risk | 0.05 | 0.70 | 0.035 | "Alex hasn't responded to last follow-up" |
| W7: Constraint Pressure | 0.05 | 0.30 | 0.015 | "Budget constraint at 80% threshold" |

**Modifiers applied:**
- Critical path multiplier: 1.5×
- Chain urgency rollup: +0.12 from downstream deadline

**Final Score:** 0.876 → **Rank #1**

**Endpoint:** `GET /app/v1/scoring/tasks/{task_id}`

### Score History

Timeline chart of `computed_priority` over time for any task:
- X-axis: timestamp of each scoring pass
- Y-axis: final score
- Hover: shows which factors changed and by how much (delta view)
- Annotations: state changes, inbound updates, manual overrides marked on timeline

**Endpoint:** `GET /app/v1/scoring/tasks/{task_id}/history`

### Score Simulator

Power users can ask "what if?" questions:
- Modify a task's deadline, assigned resource, or state hypothetically
- See how the score would change without actually making the modification
- Useful for planning: "If I move this deadline by 3 days, does it stay #1?"

**Endpoint:** `POST /app/v1/scoring/simulate`

---

## 3.4 Trigger Schedule View

| Column | Description |
|--------|-------------|
| Trigger ID | Unique identifier |
| Type | SCHEDULED / EVENT / INBOUND / ON_DEMAND |
| Next Fire Time | When the trigger will next execute |
| Target | User / org the trigger is for |
| Status | ACTIVE / PAUSED / FIRED |
| Last Fired | Timestamp of last execution |

**Features:**
- Next 10 upcoming triggers sorted by fire time
- Today's daily briefing status: PENDING / GENERATED / SENT
- Follow-up timing details per task (computed fire time, reason, configurable delay)
- Manual trigger: "Fire Now" button for any trigger

**Endpoints:**
- `GET /app/v1/agent/triggers/schedule`
- `GET /app/v1/agent/triggers/{trigger_id}`
- `POST /app/v1/agent/triggers/{trigger_id}/fire`

---

## 3.5 Inbound Processing Log

Recent inbound messages and how the resolver handled them:

| Column | Source |
|--------|--------|
| Message ID | `InboundResult.message_id` |
| Channel | email / api / cli / web |
| Timestamp | `received_at` |
| Matched Task | `TaskResolution.task_id` (clickable) |
| Matched By | TASK_ID / VECTOR_SEARCH |
| Confidence | HIGH / MEDIUM / LOW with score |
| Signal | DONE / IN_PROGRESS / BLOCKED / DELAYED / UNKNOWN |
| Action Taken | state_update_published / unmatched / followup_needed |

Useful for debugging: "Why didn't the agent pick up my email update?"

---

## 3.6 Skill Execution Monitor

| Widget | Data |
|--------|------|
| **Worker Pool** | Total workers, active, idle, failed. Per-worker: worker_id, state, current_job_id, last_heartbeat |
| **Active Jobs** | Running jobs: job_id, skill_name, task_id, started_at, elapsed time |
| **Completed Jobs** | Recent completions: skill_name, task_id, status (COMPLETED/FAILED/TIMEOUT), tokens_used, cost_usd, duration |
| **Heartbeat Health** | Per-worker heartbeat status. Red if last_heartbeat > 900s (timeout threshold) |

**Endpoint:** `GET /app/v1/skills/workers`

---

## 3.7 Structured Log Viewer

Per-user structured log stream filtered by `session_id`:

- Renders structured JSON log entries in a readable table/tree format
- Fields: timestamp, level (INFO/WARN/ERROR), container, event_type, message
- Filterable by: level, container, event_type, session_id, date range
- Search within log messages
- Auto-refresh toggle (tail mode)

Log entries come from CloudWatch log groups: `/workgraph/agent-runtime/USER-{id}` and shared container log groups.

---

## 3.8 Session Trace View

Distributed trace visualization for a single `session_id`:

- Shows the full lifecycle of one agent invocation across all containers
- Timeline (waterfall): trigger-engine → channel-gateway → inbound-processor → agent-loop → skill-worker → outbound
- Per-span: container name, duration, key events
- Click any span → drill into structured logs for that container + session_id

---

## 3.7a Sub-Agent Pool Monitor

Dedicated panel showing the state of all running sub-agents delegated by the orchestrator.

### Runner Pool Status

| Widget | Data Source |
|--------|------------|
| **Pool Utilization** | Active / Total slots (e.g. 3 / 4). Progress bar turns amber at 75%, red at 100%. | `GET /app/v1/agents/pool/status` |
| **Queue Depth** | Jobs waiting in `AGENT_JOBS` broker queue for a free runner slot | `GET /app/v1/agents/pool/status` |
| **Per-Runner Status** | runner_id, state (IDLE/RUNNING/COMPLETED/FAILED), current agent_id, current task_id, elapsed time, last_heartbeat | `GET /app/v1/agents/pool/runners` |

### Active Delegations Table

| Column | Source |
|--------|--------|
| Agent ID | `AgentUpdateEvent.agent_id` |
| Task ID | `AgentUpdateEvent.task_id` (clickable → graph node) |
| Session | `AgentUpdateEvent.session_id` |
| Batch ID | `AgentUpdateEvent.batch_id` (groups parallel tier) |
| Status | RUNNING / COMPLETED / BLOCKED / QUEUED |
| Started | `AgentTaskStartedEvent.emitted_at` |
| Last Heartbeat | `AgentHeartbeatEvent.emitted_at` — red if stale > 300s |
| Duration | Elapsed since started |
| Progress | Latest `AgentTaskProgressEvent.message` |

**Endpoint:** `GET /app/v1/agents/delegations`

### Dispatch Plan Visualizer

When multiple tasks are delegated in one orchestrator turn, shows the `AgentDispatchPlanner` output:
- Tier 1 (parallel) → Tier 2 → Tier 3 shown as horizontal swim lanes
- Dependencies rendered as arrows between tier boxes
- Each box: task_id, agent_id, status badge
- Completed tiers greyed out; active tier highlighted; pending tiers dimmed

**Endpoint:** `GET /app/v1/agents/dispatch-plan/{session_id}`

### Heartbeat Health Timeline

Per-agent heartbeat signal over time (last 30 minutes):
- Green = heartbeat received within 60s
- Amber = 60–300s stale
- Red = > 300s (BLOCKED escalation triggered)
- Shows escalation events as markers on timeline

**Endpoint:** SSE `agent.heartbeat` events on `/app/v1/events`

---

## 3.9 LLM Cost Monitor

| Metric | Granularity |
|--------|-------------|
| Total tokens used | Per day, per week, per month |
| Total cost (USD) | Per day, per week, per month |
| Cost per skill | Breakdown by skill_name |
| Cost per user | If multi-user org |
| Cost per model | Breakdown by model string |
| Token budget remaining | If admin-configured budget limits |

Charts:
- Bar chart: daily cost over last 30 days
- Pie chart: cost distribution by skill
- Line chart: cost trend with projection

**Data source:** `LLMResponse.cost_usd` and `LLMResponse.tokens_used` from skill execution results.
