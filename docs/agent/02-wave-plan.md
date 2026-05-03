# 02 — Wave Plan

> **Status:** Approved · **Date:** 2026-05-03

This is the canonical execution plan for Wave M. It supersedes [Wave 5 in build-plan.md](../../build-plan.md) (the existing Agent Monitor stub).

---

## 0. How to use this plan

- Each wave is a **PR-sized chunk**. Don't combine waves.
- Each sub-requirement (M-A-1, M-A-2, etc.) is a **commit-sized chunk** with `feat(wave-M-X-N): ...` commit format.
- Verification block at the end of each wave **must pass** before moving on.
- Cross-cutting concerns (typegen, testing, dark mode) listed in §10 apply to every wave.

**Sequencing constraints:**
1. M-A must ship first (foundation + Wave 5 retirement).
2. M-B can ship in parallel with backend B-1..B-7 (overview is mostly Phase A).
3. M-C requires backend B-3 + B-4 + B-7.
4. M-D requires backend B-5 + B-6.
5. M-E, M-F, M-G, M-H can ship in any order after M-A (mostly Phase A).

---

## 1. Wave M-A — Foundation, Wave 5 retirement, Navigation Shell

**Goal:** Page structure, routing, left nav, retire Wave 5 stubs, ship empty 7-panel skeleton.
**Phase:** A · **Depends on:** nothing · **PRs:** 1 cockpit

### M-A-0 — Wave 5 retirement (do this first)

**Kickoff notes (2026-05-03):**
- Scope for this step is strictly migration/retirement: move Wave 5 artifacts into `src/features/agent-monitor/`, rewire imports, and remove legacy directories.
- Edge cases validated before coding:
  - route import must be updated before deleting `src/features/agent/AgentMonitorPage.tsx` to avoid lazy-load runtime failure,
  - tests must be moved with components to avoid orphaned specs,
  - no references to `@/features/scoring` may remain after directory removal.
- Failure modes to guard:
  - dangling imports in `src/routes.tsx` or tests,
  - stale path aliases in feature-level imports,
  - hidden references outside `src/` (validated via grep before delete).
- No blocking ambiguities identified for M-A-0; proceed with implementation.

**Files to audit:**
```bash
grep -rn "from '@/features/agent\b" src/
grep -rn "ScoreExplainer" src/
grep -rn "AgentMonitorPage" src/
```

**Migration:**
1. Move `src/features/agent/hooks/useAgentData.ts` → `src/features/agent-monitor/hooks/useAgentStatus.ts` (refactor to TanStack Query v5 if not already).
2. Move `src/features/scoring/ScoreExplainer.tsx` → `src/features/agent-monitor/components/ScoreFactorBreakdown.tsx` and adapt to factor-row component spec.
3. Move `ScoreExplainer.test.tsx` alongside.
4. Update all import sites surfaced by grep.
5. Delete `src/features/agent/AgentMonitorPage.tsx`, `AgentMonitorPage.test.tsx`, `components/AgentCard.tsx` after consumer audit.
6. Delete `src/features/scoring/` directory.
7. Update `build-plan.md`: mark Wave 5 entries (lines ~530–566) with `~~strikethrough~~` + note "→ Superseded by Wave M".

**Acceptance:** typecheck + lint + test all green; no dangling imports.

### M-A-1 — Route + page shell

**Kickoff notes (2026-05-03):**
- Scope for this step: route normalization (`/agent-monitor` redirect), URL-driven section selection, and 7-panel shell scaffolding only.
- Edge cases validated before coding:
  - `/agent-monitor/comms/:tab` must resolve section as `comms` while preserving tab state,
  - invalid section slugs must not leave the page in an undefined state,
  - browser back/forward should switch panels without local component state drift.
- Failure modes to guard:
  - route precedence collision between `/agent-monitor/:section` and `/agent-monitor/comms/:tab`,
  - nav item links mutating to non-bookmarkable state,
  - stale tests asserting retired Wave 5 KPI layout.
- No blocking ambiguities for M-A-1; proceed with implementation in `src/routes.tsx` and `src/features/agent-monitor/AgentMonitorPage.tsx`.

**Files:**
- `src/features/agent-monitor/AgentMonitorPage.tsx` (new)
- `src/app/routes.tsx` (modify)

**Routes:**
- `/agent-monitor` → redirects to `/agent-monitor/overview`
- `/agent-monitor/:section` (overview | activity | comms | scheduling | skills | scoring | agents)
- `/agent-monitor/comms/:tab` (inbound | outbound)

**Layout (matches wireframe):**
- 196px left rail (`mon-nav` class) with 7 nav items grouped under "Monitor" / "Advanced".
- Active item highlighted via `useParams<{ section: string }>()`, not local state.
- Default landing tab: `overview`.

**Acceptance:** Bookmarkable URL changes the active panel; browser back/forward works.

### M-A-2 — Sidebar integration

**Kickoff notes (2026-05-03):**
- Scope for this step: sidebar active-state normalization for all `/agent-monitor/**` routes and replacement of static Agent Monitor badge with `useAttentionItems()` count.
- Edge cases validated before coding:
  - Agent Monitor should remain highlighted for nested routes like `/agent-monitor/comms/outbound` and `/agent-monitor/scoring`,
  - attention badge must not render when computed count is `0`,
  - skills badge behavior must remain unchanged.
- Failure modes to guard:
  - overlap in badge rendering logic causing double badges on intelligence links,
  - regressions in collapsed sidebar layout due added badge logic,
  - fragile tests that depend on static badge values.

**Files:** `src/components/layout/Sidebar.tsx`

- Highlight Agent Monitor nav item when `pathname.startsWith('/agent-monitor')`.
- Show red badge with count from `useAttentionItems()` when count > 0.
- Badge hidden at count = 0.

**Acceptance:** Nav highlights correctly across all 7 sub-routes; badge appears/disappears with fixture data.

### M-A-3 — Attention Strip

**Kickoff notes (2026-05-03):**
- Scope for this step: ship `AttentionStrip` UI and localStorage dismiss handling, wired to live failed-skill and stale-heartbeat signals from `useAttentionItems()`.
- Edge cases validated before coding:
  - strip should not render when all issues are dismissed or when no issues exist,
  - dismiss state must survive reload and expire after 24h,
  - malformed localStorage payload must fail safely without crashing the page.
- Failure modes to guard:
  - duplicate alert rows from unstable IDs when polling refreshes,
  - stale dismiss entries growing forever if not pruned,
  - strip appearing outside Overview panel and conflicting with shell layout.

**File:** `src/features/agent-monitor/components/AttentionStrip.tsx` (new)

**Sources (Phase A):**
- Failed skill jobs: `/skills/workers` jobs with status=FAILED in last 24h.
- Stale runners: `/agents/pool/runners` with `last_heartbeat > 300s`.

**Each row contains:**
- Stable `id` (deterministic hash of source data).
- Icon (alert-circle for critical, clock for warning).
- Plain-language text (e.g., "Research skill failed on #TK-4821 — tried 3 times and couldn't complete").
- Task chip link (`#TK-NNNN` → task detail).
- Dismiss `×` button.

**Dismiss persistence:** localStorage key `gc:attention:dismissed` storing `{ id: expiresAt }`. Default TTL 24 hours. Helper in `lib/attentionDismiss.ts`.

**Visual:**
- Critical severity → red border-left.
- Warning severity → amber strip background.
- Strip hidden when no undismissed items.

### M-A-4 — Shared empty / loading / error states

**Files (all new):**
- `components/EmptyPanel.tsx`
- `components/PanelSkeleton.tsx`
- `components/PanelError.tsx`

**Empty-state copy table:**

| Panel | Copy |
|-------|------|
| Activity (no events today) | "No activity yet today — agent runs will appear here in real time." |
| Comms inbound (empty) | "No inbound messages yet — incoming emails and replies will land here." |
| Comms outbound (empty) | "No outbound messages yet — when the agent sends a follow-up it will appear here." |
| Scheduling (no triggers) | "No active triggers — set one up in Settings → Triggers." |
| Skills (no jobs) | "No recent skill runs." |
| Scoring (no queue) | "Action queue is empty — agent has no recommendations right now." |
| Agents (pool size 0) | Hide whole panel; nav item shows "—" placeholder |

### M-A-5 — Responsive guards

| Breakpoint | Behaviour |
|-----------|-----------|
| ≥ 1280px | KPI grid `repeat(4, 1fr)` |
| 1024–1279px | KPI grid `repeat(4, 1fr)`; Scoring panel collapses 2-col to single |
| 768–1023px | KPI grid `repeat(2, 1fr)`; Heartbeat shows last 15 segments |
| < 768px | Banner: "Agent Monitor is best on a wider screen — open on desktop"; basic single-col layout |

### M-A verification

```bash
npm run typecheck && npm run lint && npm run test
npm run dev          # in one terminal
docker compose up -d # in another
```

- Open `/agent-monitor` → lands on Overview.
- Click each nav item → URL updates, panel switches.
- Toggle dark mode → all empty states render correctly.
- Sidebar shows badge when fixture has failed skill.
- Old `/agent-monitor` route no longer renders Wave 5 content.

---

## 2. Wave M-B — Overview Panel

**Goal:** KPI cards, glance strip, live SSE ticker.
**Phase:** A · **Depends on:** M-A · **PRs:** 1 cockpit

### M-B-1 — KPI cards (4)

| Card | Source | Display rules |
|------|--------|--------------|
| Agent Status | `/agent/status` running + queue_depth | `● Running` (green pulse) / `◉ Idle` (grey) / `✕ Error` (red); subtext: "Scoring N tasks now" or "Last active X mins ago" |
| Last Run | `/agent/status` last_cycle_at | "X mins ago" + tasks_scored badge |
| Next Run | first trigger from `/agent/triggers/schedule` | "In X mins" or absolute time |
| Needs Attention | composed (escalations + failed skills) | red value + "X failed · Y no reply" subtext |

All cards use `<KpiCard />` (existing shared component). Poll cadence: 30s. First-load: skeleton. Error: per-card fallback with retry.

### M-B-2 — Today's Glance Strip

**File:** `components/GlanceStrip.tsx`

5 chips with icon + value + label. Phase A fallback: Messages received and Replies sent show `—` until B-5 ships.

### M-B-3 — Live Activity Ticker

**File:** `components/LiveTicker.tsx`

- Subscribes via `useSSE(['task.scored', 'skill.completed', 'briefing.ready', 'task.state_changed', 'approval.pending'])`.
- Ring buffer max 20, in component state.
- **localStorage bridge:** persists today's events to `gc:ticker:today` keyed by date. On mount, if today's date matches, restores buffer. Cleared at midnight (UTC).
- `lib/formatEvent.ts` translates each event to `{ time, dotColor, message, taskChip }`.
- **Parity with backend:** snapshot test against `tests/fixtures/event_formatter_cases.json` (mirrored from gateway repo). CI fails if outputs diverge.
- Live badge visible only when SSE state = `connected`.
- Footer: "View full activity history →" → navigates to `/agent-monitor/activity`.

### M-B verification

- Trigger a scoring run via CLI → ticker updates within 2s.
- Reload page → today's events restored from localStorage.
- Disconnect SSE → live badge hides; reconnect → reappears.
- Change dates → localStorage cleared.

---

## 3. Wave M-C — Activity Panel

**Goal:** Full chronological audit trail with session grouping.
**Phase:** B (requires gateway B-3, B-4, B-7) · **Depends on:** M-A · **PRs:** 1 cockpit + 1 gateway

### M-C-1 — Activity table

**Files:** `components/ActivityFeed.tsx`, `hooks/useActivityFeed.ts`

- Hook params: `{ from, to, type, limit, cursor }` → `GET /app/v1/agent/activity`.
- Filter UI: time (Last hour / Today / Last 7 days), type (All / Decisions / Comms / Skills / Errors).
- Columns: Time (HH:MM:SS mono), What happened (plain language), Task chip, Status badge.
- Failed rows: `tr.error-row` red bg + inline "Details" link → opens drawer with raw event JSON.
- Pagination: "Load more" button using opaque `cursor` from API.
- Loading state: skeleton rows.

### M-C-2 — Session grouping toggle

- "Time" (default) vs "Session" view.
- Session view groups consecutive events by `session_id`; header row shows trigger type + chips (tool count / skill count / messages sent) + chevron.
- Click chevron → expands inline.
- Phase A guard: if `useSessionList()` returns 501/empty, disable toggle with tooltip "Coming soon".

### M-C-3 — SSE + poll hybrid

- While "Today" filter active: SSE events also append live to top of table (debounced 1s).
- Other ranges: poll-only (60s).

### M-C verification

- "Last 7 days" filter loads from MinIO via gateway.
- Group by Session → events visibly cluster with correct chip counts.
- Failed event → red row + Details drawer shows raw JSON.
- Pagination "Load more" appends next page.
- Cursor encoding/decoding round-trips correctly.

---

## 4. Wave M-D — Comms Panel

**Goal:** Bilateral inbound/outbound message audit.
**Phase:** B (requires gateway B-5, B-6) · **Depends on:** M-A · **PRs:** 1 cockpit + 1 gateway

### M-D-1 — Comms banner

- Stats: today's received / sent counts from `useCommsSummary()`.
- Time range selector (Today / 7d / 30d).
- Phase A fallback: `—` for received until B-5 ships.

### M-D-2 — Inbound tab

**URL:** `/agent-monitor/comms/inbound`

- `useInboundLog({ from, to })` → `GET /app/v1/tasks/inbound-log`.
- Columns: Time, Channel badge, From (display name), Message preview (60 char), Task chip, Action taken badge.
- Click row → navigates to task detail.

### M-D-3 — Outbound tab

**URL:** `/agent-monitor/comms/outbound`

- `useOutboundLog({ from, to })` → `GET /app/v1/tasks/outbound-log`.
- Columns: Time, Channel badge, To (display name resolved per B-6 priority list), Subject/summary, Task chip, Status.

### M-D-4 — Channel badge component

**File:** `components/ChannelBadge.tsx`

Replaces hardcoded `.ch-email`/`.ch-cli`/`.ch-api`/`.ch-web` CSS from wireframe. Theme tokens added in `src/styles/themes.css`:

```css
:root {
  --ch-email-bg: #EFF6FF; --ch-email-fg: #3B82F6;
  --ch-cli-bg:   #F5F3FF; --ch-cli-fg:   #7C3AED;
  --ch-api-bg:   #ECFDF5; --ch-api-fg:   #059669;
  --ch-web-bg:   #FFFBEB; --ch-web-fg:   #D97706;
}
[data-theme="dark"] {
  --ch-email-bg: rgba(59,130,246,0.15); --ch-email-fg: #60A5FA;
  /* …etc */
}
```

Unknown channels: neutral grey.

### M-D verification

- Switch tabs → URL updates, browser back/forward correct.
- Channel badges render in light + dark mode.
- Empty state when no messages today.
- Display name resolution falls through B-6 priority list correctly.

---

## 5. Wave M-E — Scheduling Panel

**Goal:** When the agent runs and why.
**Phase:** A core, B run history · **Depends on:** M-A · **PRs:** 1 cockpit

### M-E-1 — Next run card

- First upcoming trigger from `/agent/triggers/schedule`.
- "Run Now" → `POST /app/v1/agent/triggers/{id}/fire` (existing endpoint).
- Toast on success; ticker should pick up new run.

### M-E-2 — Trigger list table

- Columns: Trigger, Type badge, Schedule (mono), Last fired, Next fire, Status badge, action button.
- Snoozed → "Resume" button (calls existing endpoint).
- Inline expand on row click for trigger detail.

### M-E-3 — Run history (Phase B)

- `useSessionList({ limit: 10 })` → `GET /app/v1/agent/sessions`.
- Phase A fallback: derive from `last_fired_at` of each trigger.

### M-E verification

- "Run Now" fires trigger; new session row appears in ticker within 2s.
- Snooze + Resume cycle works.
- Run history table populates when B-4 ships.

---

## 6. Wave M-F — Skills Panel

**Goal:** Worker pool health + recent jobs with failure surfacing.
**Phase:** A · **Depends on:** M-A · **PRs:** 1 cockpit

### M-F-1 — Worker pool

- `usePoolUtilBar()` from `/skills/workers`: green (<75%) / amber (75–90%) / red (>90%).
- Up to 4 mini-cards (2×2 grid); "Show all" link expands.
- Each card: skill name, task chip, sparkline (10 bars from heartbeat history).
- Stale workers (last_heartbeat > 900s): amber border + "Stale" pill.

### M-F-2 — Recent jobs table

- Last 20 from `completed_jobs`.
- Tokens column: numeric or `—` (cost wiring deferred to Phase C).
- Failed rows: red bg + plain-language error.
- **Plain-language error mapping** in `lib/formatSkillError.ts`:
  - `TimeoutError` → "timed out after Xs"
  - `ToolNotFound` → "skill setup is missing — check Settings"
  - `ValidationError` → "input validation failed"
  - fallback → first 80 chars of error message

### M-F verification

- Failed job → red row with friendly error message.
- Stale worker → amber border.
- Pool >90% utilisation → bar turns red.

---

## 7. Wave M-G — Scoring Panel

**Goal:** Task ranking transparency + factor breakdown + simulator.
**Phase:** A · **Depends on:** M-A · **PRs:** 1 cockpit (+ 0–1 gateway depending on B-8)

### M-G-1 — Task score table

- `useActionQueue()` → `/agent/action-queue`.
- Columns: Rank, Task title + chip, Score bar (0–1), Recommended action badge, Autonomy level badge.
- Top row highlighted (`brand-primary-light`).
- Click row → loads factor breakdown in side panel.
- Sortable by rank / score / autonomy.

### M-G-2 — Factor breakdown side panel (right column 380px)

**File:** `components/ScoreFactorBreakdown.tsx` (refactor of moved `ScoreExplainer.tsx`)

- Lazy loads `/scoring/tasks/{task_id}` on row click.
- All **7 factors** with weight + raw score + mini progress bar.
- Plain-language explanation sentence above (uses `explanation` field).
- Below 1024px viewport: collapses below table.

### M-G-3 — What-if Simulator modal

**File:** `components/WhatIfSimulator.tsx`

7 sliders (one per factor):
1. Timeline urgency (days until deadline)
2. Dependency weight (dependent task count)
3. Critical path (toggle)
4. Blocker (toggle)
5. Human override (priority level 0–3)
6. Resource risk (assignee responsiveness 0–1)
7. Constraint pressure (budget/resource constraint 0–1)

- `POST /app/v1/scoring/simulate` debounced 300ms.
- Banner: "Preview only — no changes are saved."
- Score delta display: "Score would change from 0.87 → 0.91 (+0.04)".

**Backend dependency:** verify `/scoring/simulate` exists; add via B-8 if missing.

### M-G verification

- Click task row → factor panel updates.
- Modal slider drag → debounced score preview.
- All 7 factors interactable.
- Side panel collapses correctly on < 1024px.

---

## 8. Wave M-H — Agents Panel

**Goal:** Sub-agent pool visibility, hidden when pool empty.
**Phase:** A · **Depends on:** M-A · **PRs:** 1 cockpit (+ 0–1 gateway depending on B-9)

**Show panel only when** `/agents/pool/status` returns `total_runners > 0`. Otherwise nav item visible but panel renders large empty state ("No sub-agents are running right now").

### M-H-1 — Pool KPI cards

4 cards: Active runners (X/Y), Queue depth, Avg duration, Stale heartbeats. Stale > 0 → red.

### M-H-2 — Dispatch Plan visualisation

**File:** `components/DispatchPlanViz.tsx`

- Most recent active session_id (from heuristic — first non-completed in `/agents/delegations`).
- `GET /agents/dispatch-plan/{session_id}`.
- Tier 1 → Tier 2 → Tier 3 swim-lanes.
- States: Running (green), Completed (greyed + ✓), Pending (dashed), Blocked (red).

### M-H-3 — Heartbeat timeline

**File:** `components/HeartbeatTimeline.tsx`

- Per-runner row, 30 segments at desktop (15 below 768px).
- 1 segment per minute, last N minutes.
- Green ≤ 60s, Amber 60–300s, Red > 300s, Empty (grey) = idle.

### M-H-4 — Active delegations table

**Backend dependency:** verify `/agents/delegations` exists; add via B-9 if missing.

- Columns: Agent ID, Task chip, Session ID (truncated), Status badge, Started, Last heartbeat age, Duration.
- Heartbeat age > 300s → amber row.
- Status BLOCKED → red row.

### M-H verification

- Empty pool: panel hidden / placeholder shown.
- 7 active runners: dispatch swim-lanes render with correct tier groupings.
- Heartbeat segments correct colour.
- Delegations table flags stale heartbeats.

---

## 9. Backend (Gateway) Waves — B-1 to B-9

Detailed contracts in [04-api-contract.md](04-api-contract.md). Architecture in `graphclaw/docs/architecture/20-agent-activity-logging.md`. Summary:

| ID | Description | Blocks cockpit wave |
|----|-------------|---------------------|
| B-0 | Migration numbering check (next-free) | B-2 |
| B-1 | Extend `AgentToolCallEvent` model + wire across 5 agent files | M-C session view |
| B-2 | `agent_session_log` table + writer in `loop.py` | M-C session view, M-E history |
| B-3 | `GET /agent/activity` (MinIO reader + plain-lang formatter) | M-C |
| B-4 | `GET /agent/sessions` | M-C, M-E |
| B-5 | `GET /comms/summary` | M-D banner, M-B glance |
| B-6 | `GET /tasks/inbound-log` + `GET /tasks/outbound-log` | M-D tabs |
| B-7 | Fix MinIO write race in `_compute_path` | B-3 reliable |
| B-8 | Verify or add `POST /scoring/simulate` | M-G-3 |
| B-9 | Verify or add `GET /agents/delegations` | M-H-4 |

---

## 10. Cross-cutting concerns (apply to every wave)

### 10.1 OpenAPI typegen

After backend ships any new endpoint:
1. Backend confirms `/openapi.json` includes new path with stable `operationId`.
2. Cockpit runs `npm run gen:api` (verify command exists in `package.json`; add if missing).
3. Cockpit imports use generated types from `src/lib/api-client.ts`, not handwritten paths.
4. PR includes regenerated `src/lib/api-types.ts` (or equivalent).

### 10.2 Testing

Each wave:
- **Unit:** vitest co-located `*.test.tsx` for every new component/hook.
- **E2E:** Playwright spec under `e2e/agent-monitor/<wave>.spec.ts`.
- **Snapshot:** `formatEvent.ts` and gateway formatter both snapshot against shared fixture.

Required passing before commit:
```bash
npm run typecheck && npm run lint && npm run test
```

### 10.3 Dark mode

Every new component must:
- Use CSS custom properties from `src/styles/themes.css`. No hardcoded hex.
- Render correctly in light + dark + custom themes.
- Test: toggle theme in Settings; visual snapshot of every panel.

### 10.4 Accessibility

- All interactive elements have `aria-label` if no visible text.
- Tab order matches visual order.
- Focus states visible (keyboard navigation works).
- Live badge has `aria-live="polite"` on the ticker.
- Modals trap focus.

### 10.5 Commit format

`feat(wave-M-X-N): description` (e.g., `feat(wave-M-B-3): live activity ticker with localStorage bridge`).

For backend PRs in graphclaw repo: `feat(agent-monitor-v2): backend B-X description`.

---

## 11. Out of scope (Phase C)

| Item | Why deferred |
|------|--------------|
| Token / cost drill-down | `cost_usd = 0.0` across all providers — gap not yet fixed |
| Per-agent invocation profile | Needs longer history + aggregation |
| MinIO retention worker (gzip > 7d) | Not blocking for v2 |
| Structured Log Viewer | Admin / engineering scope |
| Session Trace Waterfall | Requires distributed tracing infra |
| LLM Cost Monitor dashboard | Cost data missing |
| CloudWatch deep-dive integration | Admin scope |
