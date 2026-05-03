# 03 — Agent Monitor & Observability

**Version:** 2.0 | **Date:** 2026-05-03 | **Status:** Approved

> **v2 redesign.** This supersedes v1.0 (2026-03-21). The original flat technical
> dashboard is replaced by a **7-panel left-nav layout** built around plain-language
> summaries for the non-technical primary user. Wireframe:
> [`wireframes-v2/pages/agent-monitor-v2.html`](../../wireframes-v2/pages/agent-monitor-v2.html).
>
> **Companion design docs (in [`docs/agent/`](../agent/README.md)):**
> - [00-design-overview.md](../agent/00-design-overview.md) — philosophy + IA
> - [01-data-sources.md](../agent/01-data-sources.md) — where every field lives
> - [02-wave-plan.md](../agent/02-wave-plan.md) — execution waves
> - [03-component-spec.md](../agent/03-component-spec.md) — component contracts
> - [04-api-contract.md](../agent/04-api-contract.md) — endpoint contracts
> - [05-open-risks.md](../agent/05-open-risks.md) — risks and decisions
>
> **Backend companion (graphclaw repo):**
> - [docs/requirements/agent-monitor-v2-backend.md](../../../graphclaw/docs/requirements/agent-monitor-v2-backend.md)
> - [docs/architecture/20-agent-activity-logging.md](../../../graphclaw/docs/architecture/20-agent-activity-logging.md)

---

## 0. Audience and goals

**Primary user:** non-technical knowledge worker managing daily tasks.
**Secondary user:** admin / engineer (limited use here — most engineering observability is Phase C / CloudWatch).

The monitor answers four questions in plain language:
1. Is the agent healthy and what's it doing right now?
2. What did it do for me today / this week?
3. What messages did it process and send on my behalf?
4. Why did it prioritise things this way?

---

## 1. Information architecture

7 panels, left-nav layout (URL-driven, bookmarkable):

| # | Panel | Answers |
|---|-------|---------|
| 1 | Overview | "Is everything OK and what just happened?" |
| 2 | Activity | "Show me the full timeline." |
| 3 | Comms | "What messages came in and what did the agent send?" |
| 4 | Scheduling | "When is the next run? Run it now if I want." |
| 5 | Skills | "Are skill workers healthy? Anything failing?" |
| 6 | Scoring | "Why is this task at the top of the queue?" |
| 7 | Agents | "What sub-agents are running? Are they alive?" |

Routes: `/agent-monitor`, `/agent-monitor/:section`, `/agent-monitor/comms/:tab`.

---

## 2. Panel: Overview

**Components:** Attention Strip · 4 KPI cards · Today's Glance Strip · Live Activity Ticker

### 2.1 Attention Strip
Surfaces **only when there's something wrong**. Sources:
- Failed skill jobs in last 24h (`/skills/workers`).
- Stale heartbeats > 300s (`/agents/pool/runners`).
- Pending escalations (`escalation_queue`).

Each row: severity icon, plain-language text, task chip, dismiss `×` (24h localStorage TTL).

### 2.2 KPI cards
| Card | Source |
|------|--------|
| Agent Status (Running / Idle / Error + queue depth) | `GET /agent/status` |
| Last Run (X mins ago + tasks scored) | `GET /agent/status` |
| Next Run (in X mins + trigger description) | `GET /agent/triggers/schedule` |
| Needs Attention (count + breakdown) | composed |

Poll cadence: 30s.

### 2.3 Today's Glance Strip
5 chips: Messages received · Replies sent · Skills run (ok/failed) · Tasks scored · Runs today.
Source: `GET /comms/summary` + `GET /skills/workers` + `GET /agent/status` + `GET /agent/sessions`.

### 2.4 Live Activity Ticker
- Subscribes to SSE `/app/v1/events`.
- Ring buffer 20, persisted to localStorage so reload doesn't lose today's events.
- Each row: time · coloured dot (event type) · plain-language message · task chip.
- "View full activity history →" links to Activity panel.

---

## 3. Panel: Activity

**Components:** Filter bar · Session group rows (toggle) · Data table

### 3.1 Filters
- Time: Last hour · Today · Last 7 days
- Type: All · Decisions · Communications · Skills · Errors only
- Group by: Time (default) · Session

### 3.2 Data source
- **Live (today):** SSE events translated client-side via `formatEvent.ts`.
- **Historical:** `GET /agent/activity?from=&to=&type=&limit=&cursor=` (Phase B endpoint, reads MinIO NDJSON).
- **Session grouping:** `GET /agent/sessions` returns runs from `agent_session_log` table.

### 3.3 Row content
Time (HH:MM:SS) · plain-language message · task chip · status badge.
Failed rows: red row background, inline "Details" link → drawer with raw event JSON.
Pagination: "Load more" using opaque cursor.

---

## 4. Panel: Comms

**Components:** Banner counts · Inbound / Outbound sub-tabs (URL-bound) · Channel badges

### 4.1 Banner
Today's received vs sent counts; date-range selector (Today / 7d / 30d).
Source: `GET /comms/summary`.

### 4.2 Inbound tab (`/agent-monitor/comms/inbound`)
Source: `GET /tasks/inbound-log`.
Columns: Time · Channel badge · From (display name) · Message preview · Task chip · Action taken.
Underlying data: flattened `TaskNode.update_log[]` for user's tasks.

### 4.3 Outbound tab (`/agent-monitor/comms/outbound`)
Source: `GET /tasks/outbound-log`.
Columns: Time · Channel badge · To (display name) · Subject/summary · Task chip · Status.
Underlying data: `CheckinNode` records linked to user's tasks.

### 4.4 Display name resolution priority
1. `agent_channel_identities[recipient_hashed].display_name`
2. `TaskNode.counterparty.display_name`
3. `User-{lastFourCharsOfHash}` fallback

---

## 5. Panel: Scheduling

**Components:** Next run card · Trigger list table · Run history (Phase B)

### 5.1 Next run card
Most imminent trigger from `GET /agent/triggers/schedule`.
"Run Now" → `POST /agent/triggers/{id}/fire`.

### 5.2 Trigger list
Columns: Trigger · Type · Schedule · Last fired · Next fire · Status · action button.
Snoozed → "Resume" button. Inline expand on row click.

### 5.3 Run history (Phase B)
Last 10 runs from `GET /agent/sessions`.

---

## 6. Panel: Skills

**Components:** Pool utilisation bar · 4 worker mini-cards · Recent jobs table

### 6.1 Pool utilisation
Bar coloured green (<75%) / amber (75–90%) / red (>90%). Active / total label.

### 6.2 Worker mini-cards
Up to 4 in 2×2 grid; "Show all" link expands.
Each: skill name, task chip, sparkline (10 bars heartbeat), state colour (Running green / Idle grey / Failed red / Stale amber).

### 6.3 Recent jobs
Last 20 from `GET /skills/workers` completed_jobs.
Columns: Time · Skill · Task · Duration · Tokens · Status.
Cost columns deliberately not surfaced (provider gap, Phase C).
Failed rows: red background + plain-language error (mapping in `lib/formatSkillError.ts`).

---

## 7. Panel: Scoring

**Components:** 7-factor scoring transparency.

### 7.1 Task score table
Source: `GET /agent/action-queue`.
Columns: Rank · Task title + chip · Score bar (0–1) · Recommended action · Autonomy.
Top row highlighted; click → loads factor panel on right.

### 7.2 Factor breakdown side panel
Source: `GET /scoring/tasks/{task_id}`.
Lists all 7 factors with weight + raw score + mini progress bar:
1. Timeline urgency (×0.25)
2. Dependency weight (×0.20)
3. Critical path (×0.20)
4. Blocker status (×0.15)
5. Human override (×0.10)
6. Resource risk (×0.05)
7. Constraint pressure (×0.05)

Plain-language explanation sentence above factors.

### 7.3 What-if Simulator
Source: `POST /scoring/simulate` (verify exists; B-8 if not).
Modal with 7 sliders (one per factor); live debounced score preview.
Banner: "Preview only — no changes are saved."

---

## 8. Panel: Agents

Hidden when `total_runners == 0`. Otherwise:

### 8.1 Pool KPIs
4 cards: Active runners (X/Y) · Queue depth · Avg duration · Stale heartbeats.

### 8.2 Dispatch Plan
Source: `GET /agents/dispatch-plan/{session_id}` for most recent active session.
Tier 1 → 2 → 3 swim-lanes. States: Running / Completed / Pending / Blocked.

### 8.3 Heartbeat timeline
Source: `GET /agents/pool/runners`.
Per-runner bar of 30 segments (1/minute, 15 below 768px).
Green ≤ 60s · Amber 60–300s · Red > 300s · Empty (idle).

### 8.4 Active delegations
Source: `GET /agents/delegations` (verify exists; B-9 if not).
Columns: Agent · Task · Session · Status · Started · Last heartbeat · Duration.
Stale rows amber; BLOCKED red.

---

## 9. Phase split

| Phase | Scope |
|-------|-------|
| **A** | M-A foundation, M-B Overview, M-E Scheduling, M-F Skills, M-G Scoring, M-H Agents (uses existing endpoints + `/agent/activity` per user decision) |
| **B** | M-C Activity full historical, M-D Comms full bilateral, session log, race fix, triad-wide tool-call wiring |
| **C** | Token/cost drill-down, MinIO retention worker, structured log viewer, session trace waterfall, LLM Cost Monitor |

---

## 10. Out of scope (Phase C — superseded sections from v1)

The following sections in v1 are deferred to Phase C and **not** part of this build:

| v1 section | New disposition |
|------------|-----------------|
| 3.7 Structured Log Viewer | Phase C — admin only (CloudWatch / NDJSON browser) |
| 3.8 Session Trace View | Phase C — distributed tracing |
| 3.9 LLM Cost Monitor | Phase C — blocked by `cost_usd = 0.0` provider gap |

When provider cost wiring lands and admin separation is built out, these return as a separate "Agent Monitor — Admin" surface or as a dashboard in Settings.

---

## 11. References

- Wireframe: [`wireframes-v2/pages/agent-monitor-v2.html`](../../wireframes-v2/pages/agent-monitor-v2.html)
- Build wave: **Wave M** in [`build-plan.md`](../../build-plan.md) (supersedes Wave 5)
- Backend requirements: [`graphclaw/docs/requirements/agent-monitor-v2-backend.md`](../../../graphclaw/docs/requirements/agent-monitor-v2-backend.md)
- Backend architecture: [`graphclaw/docs/architecture/20-agent-activity-logging.md`](../../../graphclaw/docs/architecture/20-agent-activity-logging.md)
- Agent triad context: [`graphclaw/docs/architecture/14-agent-triad.md`](../../../graphclaw/docs/architecture/14-agent-triad.md)
- Follow-up cadence (drives Scheduling panel): [`graphclaw/docs/architecture/18-follow-up-cadence.md`](../../../graphclaw/docs/architecture/18-follow-up-cadence.md)
- Sub-agent orchestration (drives Agents panel): [`graphclaw/docs/architecture/11-sub-agent-orchestration.md`](../../../graphclaw/docs/architecture/11-sub-agent-orchestration.md)
