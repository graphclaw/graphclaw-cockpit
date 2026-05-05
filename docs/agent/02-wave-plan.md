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

**Kickoff notes (2026-05-03):**
- Scope for this step: add shared `EmptyPanel`, `PanelSkeleton`, and `PanelError` components and replace shell placeholders with panel-specific empty-state copy.
- Edge cases validated before coding:
  - comms empty text must switch correctly between inbound and outbound routes,
  - panel wrappers must preserve existing `data-testid` selectors,
  - agent panel empty behavior should not break current nav-shell flow.
- Failure modes to guard:
  - introducing shared components that hardcode copy and block panel-level customization,
  - accessibility regressions on action buttons and retry flows,
  - stale placeholder text remaining in the shell after component swap.

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

**Kickoff notes (2026-05-03):**
- Scope for this step: apply shell-level responsive behavior for mobile warning banner, scoring layout collapse, and heartbeat segment density fallback in placeholder UI.
- Edge cases validated before coding:
  - left nav must remain usable when layout collapses to a single column,
  - responsive classes should not break existing route/test selectors,
  - scoring layout should stay single-column below xl and split only on wide screens.
- Failure modes to guard:
  - forcing fixed widths that cause horizontal overflow on small screens,
  - rendering all heartbeat segments on mobile and reducing readability,
  - introducing breakpoint logic that conflicts with upcoming M-B panel composition.

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

**Kickoff notes (2026-05-03):**
- Scope for this step: implement the 4-card Overview KPI strip with real data sources (`/agent/status`, `/agent/triggers/schedule`, attention composition).
- Edge cases validated before coding:
  - missing `last_cycle_at` should render a safe fallback,
  - trigger payloads without `next_fire_at` must not crash next-run rendering,
  - each card should fail independently and expose a retry action.
- Failure modes to guard:
  - coupling all cards to one loading state (causing unnecessary blanking),
  - stale polling cadence mismatch with wave contract (30s),
  - fallback text becoming ambiguous for non-technical users.

**Completion notes (2026-05-03):**
- Implemented `OverviewKpiStrip` with 4 cards wired to live hooks (`useAgentStatus`, `useAgentTriggers`, `useAttentionItems`) and independent loading/error rendering.
- Updated `useAgentStatus` and `useAgentTriggers` poll cadence to 30s and expanded trigger typing for `next_fire_at` parsing.
- Verification run passed: focused vitest suites (`OverviewKpiStrip`, `AgentMonitorPage`, `AttentionStrip`, `PanelStates`, `Sidebar`), `npm run typecheck`, focused eslint, and Playwright `e2e/agent/agent-monitor.spec.ts`.

| Card | Source | Display rules |
|------|--------|--------------|
| Agent Status | `/agent/status` running + queue_depth | `● Running` (green pulse) / `◉ Idle` (grey) / `✕ Error` (red); subtext: "Scoring N tasks now" or "Last active X mins ago" |
| Last Run | `/agent/status` last_cycle_at | "X mins ago" + tasks_scored badge |
| Next Run | first trigger from `/agent/triggers/schedule` | "In X mins" or absolute time |
| Needs Attention | composed (escalations + failed skills) | red value + "X failed · Y no reply" subtext |

All cards use `<KpiCard />` (existing shared component). Poll cadence: 30s. First-load: skeleton. Error: per-card fallback with retry.

### M-B-2 — Today's Glance Strip

**Kickoff notes (2026-05-03):**
- Scope for this step: implement the 5-chip overview strip directly under KPI cards.
- Data wiring decisions:
  - `Messages received` and `Replies sent` come from `/app/v1/comms/summary`, with `—` fallback when endpoint/field is unavailable.
  - `Skills run` is computed from today's `completed_jobs` in `/app/v1/skills/workers` (split ok/failed).
  - `Tasks scored` comes from `/app/v1/agent/status` with tolerant field parsing (`tasks_scored` + compatibility keys).
  - `Runs today` comes from `/app/v1/agent/sessions`, with `—` fallback when endpoint is unavailable.
- Edge cases validated before coding:
  - missing optional endpoints in Phase A must not show panel-level errors,
  - mixed snake_case/camelCase payload keys should still map correctly,
  - date boundaries should use UTC day start/end for "today" counters.
- Failure modes to guard:
  - hard failure when `/comms/summary` or `/agent/sessions` returns 404/501,
  - counting stale skill jobs from prior days,
  - layout collapse on narrow screens.

**Completion notes (2026-05-03):**
- Implemented `GlanceStrip` with 5 chips and responsive wrapping directly under the KPI strip.
- Added `useGlanceMetrics` to compose metrics from `/agent/status`, `/skills/workers`, `/comms/summary`, and `/agent/sessions` with tolerant payload parsing and Phase A fallbacks.
- Added optional API hooks for comms summary, sessions, and skills workers in `api-hooks.ts` to keep polling behavior centralized.
- Verification passed: focused unit tests (`GlanceStrip`, `AgentMonitorPage`, `OverviewKpiStrip`), `npm run typecheck`, focused eslint, and Playwright `e2e/agent/agent-monitor.spec.ts`.

**File:** `components/GlanceStrip.tsx`

5 chips with icon + value + label. Phase A fallback: Messages received and Replies sent show `—` until B-5 ships.

### M-B-3 — Live Activity Ticker

**Kickoff notes (2026-05-03):**
- Scope for this step: implement `LiveTicker` with SSE subscription, 20-event ring buffer, and UTC-day localStorage restore/rollover.
- Event scope for Phase A: `task.scored`, `skill.completed`, `briefing.ready`, `task.state_changed`, `approval.pending`.
- Data decisions:
  - use direct `EventSource('/app/v1/events')` with safe JSON parse per message,
  - map events to plain-language ticker rows via `formatEvent.ts`,
  - persist only today rows at `gc:ticker:today` with date guard.
- Edge cases validated before coding:
  - invalid/non-JSON SSE frames,
  - reconnect/disconnect states should toggle LIVE badge visibility,
  - old-day cache must clear automatically at UTC day change.
- Failure modes to guard:
  - unlimited in-memory growth without ring-buffer cap,
  - localStorage parse crashes blocking render,
  - noisy unknown event types flooding ticker.

**Completion notes (2026-05-03):**
- Implemented `LiveTicker` with a 6-row viewport over a 20-event ring buffer and a conditional LIVE badge when SSE is connected.
- Added `useLiveTickerEvents` with direct EventSource subscriptions for the required event set and localStorage bridge (`gc:ticker:today`) with UTC-day rollover reset.
- Added `formatEvent.ts` to map SSE payloads into plain-language ticker records and ignore unsupported events.
- Verification passed: focused unit tests (`formatEvent`, `LiveTicker`, `GlanceStrip`, `OverviewKpiStrip`, `AgentMonitorPage`), `npm run typecheck`, focused eslint, and Playwright `e2e/agent/agent-monitor.spec.ts`.

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

**Kickoff notes (2026-05-03):**
- Scope for this step: deliver Activity panel table with filter bar, server-backed pagination, and error-row details affordance.
- Dependency decision: Gateway B-3 (`GET /app/v1/agent/activity`) is not present in current backend routes, so this step includes implementing B-3 first, then wiring cockpit M-C-1.
- Data contract for this step:
  - query params: `from`, `to`, `type`, `limit`, `cursor`,
  - response: `{ items, nextCursor }` with newest-first ordering,
  - row fields consumed by cockpit: `timestamp`, `eventType`, `message`, `taskId`, `status`, optional `raw`.
- Edge cases validated before coding:
  - invalid/partial NDJSON lines must be skipped safely,
  - ranges over 7 days must fail with explicit 400 contract error,
  - missing task id should render `—` without breaking row layout.
- Failure modes to guard:
  - expensive full-prefix scans in MinIO for each request,
  - cursor decode failures causing 500s instead of safe 400s,
  - event type filters drifting from agreed taxonomy (all/decisions/comms/skills/errors).

**Closeout notes (2026-05-04):**
- Delivered `ActivityFeed` table with time/type filters, failed-row details drawer, and server cursor pagination.
- Delivered `useActivityFeed` hook built on `useInfiniteAgentActivity` with `from`/`to` bounds for last hour, today, and last 7 days.
- Completed dependency `Gateway B-3` in backend (`GET /app/v1/agent/activity`) with MinIO NDJSON reader + plain-language formatter.
- Validated against live stack:
  - CLI API smoke returned `200` for `/app/v1/agent/activity` with expected envelope.
  - Manual browser auth (Dev Token) succeeded and `/agent-monitor/activity` rendered filter bar + table/empty states.
  - Playwright `e2e/agent/agent-monitor.spec.ts` passed with activity route assertions.
  - Injected MinIO test record was surfaced by `/agent/activity` in the selected time window.

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

**Closeout notes (2026-05-03):**
- Added View toggle (`Time`/`Session`) to Activity filter bar.
- Added session grouping mode that clusters consecutive records by `session_id` and renders group headers with chips:
  - `Tools {n}` from `agent.tool_call` + `mcp.tool_call`
  - `Skills {n}` from `skill.completed`
  - `Sent {n}` from `agent.message` + `outbound.sent`
- Added chevron expand/collapse per session group with inline table expansion.
- Added Phase A guard: Session toggle is disabled and shows tooltip `Coming soon` when `/app/v1/agent/sessions` is unavailable/empty.
- Validation:
  - Unit: `ActivityFeed.test.tsx` expanded to cover disabled guard and grouped session rendering.
  - E2E: `e2e/agent/agent-monitor.spec.ts` asserts disabled Session toggle with tooltip on Activity route.

### M-C-3 — SSE + poll hybrid

- While "Today" filter active: SSE events also append live to top of table (debounced 1s).
- Other ranges: poll-only (60s).

**Closeout notes (2026-05-03):**
- Implemented SSE subscription for Activity feed when `timeRange === 'today'`.
- Live events are buffered and appended to the top of the table with a 1-second debounce to avoid row churn.
- Existing paged server results remain the baseline; live and paged items are merged with duplicate suppression.
- Non-today ranges (`last-hour`, `last-7-days`) clear live buffers and run poll-only behavior.
- Validation:
  - Unit: new `useActivityFeed.test.ts` verifies today-mode SSE append and non-today poll-only fallback.
  - Regression: `ActivityFeed.test.tsx` and `agent-monitor.spec.ts` remain green.

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

**Closeout notes (2026-05-03):**
- Added `CommsSummaryBanner` component to the Comms panel with:
  - stats cards for `Received` and `Sent`,
  - range selector (`Today`, `7d`, `30d`),
  - phase fallback messaging when summary API data is unavailable.
- Wired banner into `/agent-monitor/comms/*` section above existing empty-state scaffold.
- Validation:
  - Unit: `CommsSummaryBanner.test.tsx` (counts, fallback, selector state).
  - Page integration: `AgentMonitorPage.test.tsx` confirms banner presence on comms routes.
  - E2E: `agent-monitor.spec.ts` checks banner + selector visibility in outbound comms route.

### M-D-2 — Inbound tab

**URL:** `/agent-monitor/comms/inbound`

- `useInboundLog({ from, to })` → `GET /app/v1/tasks/inbound-log`.
- Columns: Time, Channel badge, From (display name), Message preview (60 char), Task chip, Action taken badge.
- Click row → navigates to task detail.

**Closeout notes (2026-05-03):**
- Added inbound route panel rendering for `/agent-monitor/comms/inbound` using `InboundCommsTable`.
- Added `useInboundLog({ from, to, limit })` API hook with optional fetch semantics.
- Delivered table columns and row/task affordances for inbound audit:
  - Time, Channel, From, Message preview, Task chip, Action.
- Added empty-state fallback for unavailable/empty inbound data while preserving route structure.
- Validation:
  - Unit: `InboundCommsTable.test.tsx` for row + empty-state coverage.
  - Page integration: `AgentMonitorPage.test.tsx` verifies inbound tab wiring.
  - E2E: `agent-monitor.spec.ts` validates inbound route rendering with summary + panel content.

### M-D-3 — Outbound tab

**Kickoff notes (2026-05-03):**
- Scope for this step: deliver outbound comms table for `/agent-monitor/comms/outbound` with route-bound rendering and resilient empty/error fallbacks.
- Data wiring decision:
  - consume `/app/v1/tasks/outbound-log` via `useOutboundLog({ from, to, limit })`, defaulting to today's UTC range and optional semantics when backend payload is unavailable.
- Edge cases validated before coding:
  - missing `toDisplay` and `subject` should render safe placeholder values,
  - missing `taskId` should render `-` and keep row non-navigable,
  - invalid timestamps should render `--:--:--` without row crash.
- Failure modes to guard:
  - panel crash on partial snake_case/camelCase response keys,
  - outbound route silently falling back to inbound content,
  - clickable row navigation firing when no task id exists.

**URL:** `/agent-monitor/comms/outbound`

- `useOutboundLog({ from, to })` → `GET /app/v1/tasks/outbound-log`.
- Columns: Time, Channel badge, To (display name resolved per B-6 priority list), Subject/summary, Task chip, Status.

**Closeout notes (2026-05-03):**
- Added outbound route panel rendering for `/agent-monitor/comms/outbound` using `OutboundCommsTable`.
- Added `useOutboundLog({ from, to, limit })` API hook in shared hooks with optional fetch semantics and 60s polling.
- Delivered table columns and row/task affordances for outbound audit:
  - Time, Channel, To, Subject/Summary, Task chip, Status.
- Added empty-state fallback for unavailable/empty outbound data while preserving route structure.
- Validation:
  - Unit: `OutboundCommsTable.test.tsx` for row + empty-state coverage.
  - Page integration: `AgentMonitorPage.test.tsx` verifies outbound tab wiring.
  - E2E: `e2e/agent/agent-monitor.spec.ts` validates outbound route rendering with summary + panel content.

### M-D-4 — Channel badge component

**File:** `components/ChannelBadge.tsx`

**Kickoff notes (2026-05-03):**
- Scope for this step: introduce shared `ChannelBadge` and replace plain channel text in inbound/outbound comms tables.
- Styling decision:
  - add channel token vars to `src/styles/themes.css` for root + dark theme first (`email`, `cli`, `api`, `web`), with neutral fallback for unknown values.
- Edge cases validated before coding:
  - unknown channel strings should map to neutral badge style and uppercase fallback text,
  - mixed casing in payload channel value should not affect variant selection,
  - tables must remain readable in both light and dark themes.
- Failure modes to guard:
  - badge styles hardcoded in component without theme token usage,
  - inbound/outbound tables diverging in badge rendering behavior,
  - dark theme low-contrast badge text.

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

**Closeout notes (2026-05-03):**
- Added shared `ChannelBadge` component for known channel variants (`email`, `cli`, `api`, `web`) plus neutral unknown fallback.
- Added channel badge CSS variables in `src/styles/themes.css` for light (`:root`) and dark (`[data-theme='dark']`) themes.
- Replaced plain-text channel cells in both `InboundCommsTable` and `OutboundCommsTable` with `ChannelBadge`.
- Validation:
  - Unit: `ChannelBadge.test.tsx` validates known, unknown, and missing-channel rendering.
  - Regression: `InboundCommsTable.test.tsx`, `OutboundCommsTable.test.tsx`, and `AgentMonitorPage.test.tsx` all pass.
  - E2E: `e2e/agent/agent-monitor.spec.ts` passes for comms route navigation and panel rendering.

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

**Kickoff notes (2026-05-03):**
- Scope for this step: render scheduling panel "Next run" card and support manual `Run Now` trigger fire action.
- Data wiring decisions:
  - consume trigger schedule via existing `useAgentTriggers()` and pick earliest `next_fire_at` / `nextFireAt`,
  - invoke `POST /app/v1/agent/triggers/{id}/fire` through a dedicated mutation hook and invalidate status/trigger queries after success.
- Edge cases validated before coding:
  - empty trigger list should render an explicit no-schedule state,
  - triggers with invalid `nextFireAt` should not crash sorting/formatting,
  - clicking Run Now while mutation pending should prevent duplicate requests.
- Failure modes to guard:
  - scheduling route still showing generic empty panel instead of card,
  - success path without user feedback (toast),
  - missing trigger id causing broken POST path.

- First upcoming trigger from `/agent/triggers/schedule`.
- "Run Now" → `POST /app/v1/agent/triggers/{id}/fire` (existing endpoint).
- Toast on success; ticker should pick up new run.

**Closeout notes (2026-05-03):**
- Added `SchedulingNextRunCard` to `/agent-monitor/scheduling` with next-trigger selection, relative next-run display, and trigger metadata.
- Added `useFireAgentTrigger()` mutation hook and wired Run Now action to `POST /app/v1/agent/triggers/{id}/fire`.
- Added success/failure toast feedback on Run Now and pending-state button disable to prevent duplicate submissions.
- Preserved forward placeholder text for pending M-E-2/M-E-3 scheduling features.
- Validation:
  - Unit: `SchedulingNextRunCard.test.tsx` for schedule render, empty fallback, and Run Now mutation call.
  - Page integration: `AgentMonitorPage.test.tsx` includes scheduling route assertion.
  - E2E: `e2e/agent/agent-monitor.spec.ts` adds scheduling route browser check for next-run card and Run Now control.

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

**Kickoff notes (2026-05-03):**
- Scope for this step: ship skills worker pool utilisation bar and mini-card grid in the Skills panel.
- Data wiring decision:
  - backend `/app/v1/skills/workers` currently returns worker status snapshots (`worker_id`, `state`, `current_job_id`, `last_heartbeat`, counters) and does not expose heartbeat history buckets; sparkline rendering will use deterministic status/counter-derived bars as a Phase A fallback.
- Edge cases validated before coding:
  - empty worker list should render an explicit no-workers state,
  - stale workers (`last_heartbeat > 900s`) should display amber accent and stale pill,
  - pool size > 4 should collapse to 2x2 card view with Show all toggle.
- Failure modes to guard:
  - utilisation percentage divide-by-zero when no workers,
  - stale heartbeat parsing crash on invalid timestamp,
  - skills route still rendering generic empty panel.

- `usePoolUtilBar()` from `/skills/workers`: green (<75%) / amber (75–90%) / red (>90%).
- Up to 4 mini-cards (2×2 grid); "Show all" link expands.
- Each card: skill name, task chip, sparkline (10 bars from heartbeat history).
- Stale workers (last_heartbeat > 900s): amber border + "Stale" pill.

**Closeout notes (2026-05-03):**
- Added `SkillsWorkerPool` component and wired it to `/agent-monitor/skills` route.
- Added `useSkillWorkerStatuses()` hook for `/app/v1/skills/workers` worker snapshot payloads.
- Implemented utilisation bar with threshold colours (green/amber/red), 4-card default layout, and Show all/Show less toggle.
- Implemented stale-worker detection using `last_heartbeat > 900s` and stale pill/amber border rendering.
- Implemented 10-segment sparkline fallback derived from completion/failure counters because backend heartbeat history buckets are not currently exposed by `/skills/workers`.
- Validation:
  - Unit: `SkillsWorkerPool.test.tsx` covers utilisation thresholds, stale marker, and Show all toggle.
  - Page integration: `AgentMonitorPage.test.tsx` includes skills route assertion.
  - E2E: `e2e/agent/agent-monitor.spec.ts` includes skills route browser assertion.

### M-F-2 — Recent jobs table

- Last 20 from `completed_jobs`.
- Tokens column: numeric or `—` (cost wiring deferred to Phase C).
- Failed rows: red bg + plain-language error.
- **Plain-language error mapping** in `lib/formatSkillError.ts`:
  - `TimeoutError` → "timed out after Xs"
  - `ToolNotFound` → "skill setup is missing — check Settings"
  - `ValidationError` → "input validation failed"
  - fallback → first 80 chars of error message

**Closeout notes (2026-05-05):**
- Added `SkillsRecentJobsTable` and wired it below `SkillsWorkerPool` in `AgentMonitorPage` for `/agent-monitor/skills`.
- Data source uses `/app/v1/skills/workers` via `useSkillWorkers()`, rendering `completed_jobs` (or `jobs`) sorted by latest completion timestamp and capped to 20 rows.
- Added plain-language mapper `formatSkillError()` with TimeoutError, ToolNotFound, ValidationError, and 80-char fallback behavior.
- Added explicit empty state (`skills-recent-jobs-empty`) when worker snapshots do not include recent job history.
- Validation:
  - Unit: `formatSkillError.test.ts`
  - Component: `SkillsRecentJobsTable.test.tsx`
  - Integration: `AgentMonitorPage.test.tsx` skills route assertions
  - E2E: `e2e/agent/agent-monitor.spec.ts` skills route now verifies worker pool plus recent jobs presence/empty state.

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

**Closeout notes (2026-05-05):**
- Added `ScoringTaskTable` and wired it into the scoring panel left column (`/agent-monitor/scoring`).
- Table sources live data from `useActionQueue()` (`/app/v1/agent/action-queue`) and renders rank, task id + context chip, score bar, recommended action, and autonomy badges.
- Implemented sortable headers for rank, score, and autonomy, including direction toggles.
- Implemented top-row highlight and selected-row handoff state in `AgentMonitorPage` to prepare M-G-2 factor panel integration.
- Added explicit empty state (`scoring-task-table-empty`) for no queued actions.
- Validation:
  - Component: `ScoringTaskTable.test.tsx`
  - Integration: `AgentMonitorPage.test.tsx` scoring route assertion
  - E2E: `e2e/agent/agent-monitor.spec.ts` scoring route now verifies table or explicit empty state.

### M-G-2 — Factor breakdown side panel (right column 380px)

**File:** `components/ScoreFactorBreakdown.tsx` (refactor of moved `ScoreExplainer.tsx`)

- Lazy loads `/scoring/tasks/{task_id}` on row click.
- All **7 factors** with weight + raw score + mini progress bar.
- Plain-language explanation sentence above (uses `explanation` field).
- Below 1024px viewport: collapses below table.

**Closeout notes (2026-05-05):**
- Refactored `ScoreFactorBreakdown` to accept `taskId` and lazily load `GET /app/v1/scoring/tasks/{task_id}` via `useTaskScore(taskId)`.
- Implemented panel states for no selection, loading, API error, and missing factor payload.
- Implemented factor-name normalization and ordered rendering for the canonical 7-factor list, with weight/raw/weighted values and mini bars per factor.
- Added plain-language summary resolution from `explanation`, then `summary`, then fallback sentence from factor `plain_english` text.
- Wired scoring side panel in `AgentMonitorPage` to selected rows from `ScoringTaskTable`.
- Validation:
  - Component: `ScoreFactorBreakdown.test.tsx`
  - Integration: `AgentMonitorPage.test.tsx` scoring layout assertions
  - E2E: `e2e/agent/agent-monitor.spec.ts` scoring route includes side-panel placeholder assertion.

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

**Closeout notes (2026-05-05):**
- Added `useSimulateTaskScore()` hook and request/response normalization for `POST /app/v1/scoring/simulate`.
- Added `WhatIfSimulator` modal with seven factor controls and 300ms debounced preview requests.
- Added preview banner copy (`Preview only - no changes are saved.`) and delta line (`Score would change from X -> Y (+/-Z)`).
- Wired modal launcher into `ScoreFactorBreakdown` (`score-what-if-open`) for selected scoring tasks.
- Verified backend support in `graphclaw/src/graphclaw/api/scoring.py` (`/simulate` route).
- Validation:
  - Component: `WhatIfSimulator.test.tsx`
  - Integration: `ScoreFactorBreakdown.test.tsx`, `AgentMonitorPage.test.tsx`
  - E2E: `e2e/agent/agent-monitor.spec.ts` scoring route remains green with simulator entrypoint assertion when queue rows exist.

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

**Closeout notes (2026-05-05):**
- Added `useAgentPoolStatus()` hook for `GET /app/v1/agents/pool/status` with optional payload handling.
- Added `AgentsPoolKpis` component and wired it into `/agent-monitor/agents` panel.
- Implemented fallback derivations when pool-status fields are missing:
  - active/total from `useAgents()` (`/app/v1/agents`),
  - queue depth from `useAgentStatus()` (`/app/v1/agent/status`).
- Implemented stale-heartbeat alert styling when stale count > 0.
- Validation:
  - Component: `AgentsPoolKpis.test.tsx`
  - Integration: `AgentMonitorPage.test.tsx` agents route assertion
  - E2E: `e2e/agent/agent-monitor.spec.ts` agents route assertion

### M-H-2 — Dispatch Plan visualisation

**File:** `components/DispatchPlanViz.tsx`

- Most recent active session_id (from heuristic — first non-completed in `/agents/delegations`).
- `GET /agents/dispatch-plan/{session_id}`.
- Tier 1 → Tier 2 → Tier 3 swim-lanes.
- States: Running (green), Completed (greyed + ✓), Pending (dashed), Blocked (red).

**Blocker notes (2026-05-05):**
- Backend source scan found no `GET /app/v1/agents/dispatch-plan/{session_id}` route under `graphclaw/src/graphclaw/api/**/*.py`.
- `GET /app/v1/agents/delegations` remains pending backend wave B-9.
- M-H-2 remains blocked until these endpoints are available.

### M-H-3 — Heartbeat timeline

**File:** `components/HeartbeatTimeline.tsx`

- Per-runner row, 30 segments at desktop (15 below 768px).
- 1 segment per minute, last N minutes.
- Green ≤ 60s, Amber 60–300s, Red > 300s, Empty (grey) = idle.

**Closeout notes (2026-05-05):**
- Added `useAgentPoolRunners()` hook with flexible payload normalization for optional `GET /app/v1/agents/pool/runners` responses (array or `{ runners: [...] }`).
- Added `HeartbeatTimeline` component with per-runner rows, 30-segment timeline, and mobile 15-segment visibility.
- Implemented heartbeat age coloring thresholds: green (<=60s), amber (<=300s), red (>300s), and empty state for idle/no heartbeat.
- Added fallback row shells from `useAgents()` when runners payload is unavailable.
- Validation:
  - Component: `HeartbeatTimeline.test.tsx`
  - Integration: `AgentMonitorPage.test.tsx`
  - E2E: `e2e/agent/agent-monitor.spec.ts` agents route timeline assertion

### M-H-4 — Active delegations table

**Backend dependency:** verify `/agents/delegations` exists; add via B-9 if missing.

- Columns: Agent ID, Task chip, Session ID (truncated), Status badge, Started, Last heartbeat age, Duration.
- Heartbeat age > 300s → amber row.
- Status BLOCKED → red row.

**Closeout notes (2026-05-05):**
- Added `useAgentDelegations()` hook for optional `GET /app/v1/agents/delegations` with response normalization for array, `{ items }`, and `{ delegations }` payload shapes.
- Added `ActiveDelegationsTable` component with all required columns, status badges, session truncation, and heartbeat/duration formatting.
- Implemented row-level highlights for stale heartbeat (`>300s`, amber) and blocked statuses (`BLOCKED`, red).
- Added empty-state fallback when delegations payload is unavailable or empty.
- Validation:
  - Component: `ActiveDelegationsTable.test.tsx`
  - Integration: `AgentMonitorPage.test.tsx`
  - E2E: `e2e/agent/agent-monitor.spec.ts` agents route assertion for delegations section

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
