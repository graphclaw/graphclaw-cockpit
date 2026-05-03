# 03 — Component Spec

> **Status:** Approved · **Date:** 2026-05-03

This document is the contract for every new component in `src/features/agent-monitor/`. It complements [02-wave-plan.md](02-wave-plan.md) — the wave plan tells you *when* and *why*; this tells you *what* the surface area looks like.

---

## 1. File structure

```
src/features/agent-monitor/
├── AgentMonitorPage.tsx             — page root + section routing
├── AgentMonitorPage.test.tsx
├── lib/
│   ├── formatEvent.ts               — SSE event → display object
│   ├── formatEvent.test.ts
│   ├── formatSkillError.ts          — skill error → plain English
│   ├── attentionDismiss.ts          — localStorage helper for dismissed alerts
│   └── channelBadge.ts              — channel id → token ref
├── components/
│   ├── AttentionStrip.tsx
│   ├── GlanceStrip.tsx
│   ├── LiveTicker.tsx
│   ├── ActivityFeed.tsx
│   ├── SessionGroupRow.tsx
│   ├── CommsPanel.tsx
│   ├── CommsTab.tsx
│   ├── SchedulingPanel.tsx
│   ├── SkillsPanel.tsx
│   ├── ScoringPanel.tsx
│   ├── ScoreFactorBreakdown.tsx     — refactor of moved ScoreExplainer
│   ├── WhatIfSimulator.tsx
│   ├── AgentsPanel.tsx
│   ├── DispatchPlanViz.tsx
│   ├── HeartbeatTimeline.tsx
│   ├── PoolUtilBar.tsx
│   ├── ChannelBadge.tsx
│   ├── EmptyPanel.tsx
│   ├── PanelSkeleton.tsx
│   └── PanelError.tsx
└── hooks/
    ├── useAgentStatus.ts            — moved from features/agent
    ├── useActionQueue.ts
    ├── useTriggerSchedule.ts
    ├── useSkillWorkers.ts
    ├── useAgentPool.ts
    ├── useAttentionItems.ts
    ├── useActivityFeed.ts
    ├── useCommsSummary.ts
    ├── useInboundLog.ts
    ├── useOutboundLog.ts
    ├── useSessionList.ts
    ├── useDispatchPlan.ts
    └── useScoringInspector.ts
```

---

## 2. Page root

### `AgentMonitorPage.tsx`

```tsx
type Section = 'overview' | 'activity' | 'comms' | 'scheduling' | 'skills' | 'scoring' | 'agents';

export function AgentMonitorPage() {
  const { section = 'overview' } = useParams<{ section?: Section }>();
  // Renders:
  //   <MonNav active={section} />
  //   <MonContent>{renderPanel(section)}</MonContent>
}
```

- Uses `mon-nav` styling from wireframe (mirrors Intelligence Hub's `ih-nav`).
- Each panel mounts/unmounts on section change — keeps tree small, simplifies SSE subscription scoping.

---

## 3. Hooks

### Polling hooks (TanStack Query v5)

All polling hooks share this shape:
```ts
useXxx(): { data, isLoading, error, refetch }
```

| Hook | Endpoint | Poll | Notes |
|------|----------|------|-------|
| `useAgentStatus` | `/agent/status` | 30s | refetchOnWindowFocus |
| `useActionQueue` | `/agent/action-queue` | 30s | invalidated by `task.scored` SSE |
| `useTriggerSchedule` | `/agent/triggers/schedule` | 30s | |
| `useSkillWorkers` | `/skills/workers` | 15s | invalidated by `skill.completed` |
| `useAgentPool` | `/agents/pool/status` + `/runners` | 15s | composite hook returning both |

### Paginated hooks

```ts
useActivityFeed({ from, to, type }): {
  data: { items: ActivityItem[], nextCursor: string | null },
  fetchMore: () => void,
  isLoading,
  isFetchingMore,
}
```

| Hook | Endpoint | Cursor type |
|------|----------|-------------|
| `useActivityFeed` | `/agent/activity` | opaque base64 of `{file_key, line_offset}` |
| `useInboundLog` | `/tasks/inbound-log` | timestamp + id |
| `useOutboundLog` | `/tasks/outbound-log` | timestamp + id |
| `useSessionList` | `/agent/sessions` | offset |

### Derived hooks

```ts
useAttentionItems(): {
  count: number,
  items: Array<{ id, severity, icon, text, taskId?, action? }>,
}
```

Composed client-side from `useSkillWorkers()` (FAILED jobs last 24h) + `useAgentPool()` (stale heartbeats). Filters out items dismissed in localStorage.

---

## 4. Component contracts

### AttentionStrip

```tsx
type AttentionItem = {
  id: string;            // deterministic hash
  severity: 'critical' | 'warning';
  icon: 'alert-circle' | 'clock' | 'wifi-off';
  text: string;          // plain language
  taskId?: string;       // for chip link
  actionHref?: string;   // "View task →" target
};

type AttentionStripProps = {
  items: AttentionItem[];
  onDismiss: (id: string) => void;
};
```

Renders nothing when `items.length === 0`. Critical items get red border-left.

### GlanceStrip

```tsx
type GlanceStripProps = {
  messagesReceived: number | null;  // null → render '—'
  repliesSent: number | null;
  skillsRun: { ok: number, failed: number };
  tasksScored: number;
  runsToday: number | null;
};
```

### LiveTicker

```tsx
type TickerEvent = {
  time: string;          // 'HH:MM'
  dotColor: 'green' | 'blue' | 'amber' | 'red' | 'grey' | 'purple';
  message: ReactNode;    // already formatted, may include <strong>
  taskId?: string;       // for chip
};

type LiveTickerProps = {
  events: TickerEvent[];
  isLive: boolean;       // SSE connected
  maxVisible?: number;   // default 6
};
```

Internal: subscribes via `useSSE`, maintains ring buffer in `useState`, persists to localStorage on each update.

### ActivityFeed

```tsx
type ActivityItem = {
  timestamp: string;     // ISO
  eventType: string;     // 'task.scored', 'skill.completed', etc.
  message: string;       // plain language from server
  taskId?: string;
  status?: 'done' | 'sent' | 'failed' | 'matched' | 'running' | 'trigger';
  sessionId?: string;
};

type ActivityFeedProps = {
  filter: { from: string, to: string, type: ActivityType };
  groupBy: 'time' | 'session';
  liveAppend: boolean;   // append SSE events for "today"
};
```

Internally uses `useActivityFeed` + optional `useSessionList` for groupings.

### CommsPanel

```tsx
// URL-bound sub-tab via useParams<{ tab: 'inbound' | 'outbound' }>()
type CommsPanelProps = { dateRange: 'today' | '7d' | '30d' };
```

### ScoringPanel

```tsx
type ScoringPanelProps = {};
// Internal state: selectedTaskId (default = top of queue)
// Two columns: <ActionQueueTable onRowClick={setSelected} />
//              <ScoreFactorBreakdown taskId={selected} />
```

### ScoreFactorBreakdown

```tsx
type Factor = {
  name: 'Timeline urgency' | 'Dependency weight' | 'Critical path' |
        'Blocker status' | 'Human override' | 'Resource risk' | 'Constraint pressure';
  weight: number;        // e.g. 0.25
  rawScore: number;      // 0-1
};

type ScoreFactorBreakdownProps = {
  taskId: string;
  // Internally calls useScoringInspector(taskId)
};
```

### WhatIfSimulator

```tsx
type SimulatorState = {
  timelineUrgencyDays: number;     // slider 0-30
  dependencyCount: number;         // slider 0-20
  criticalPath: boolean;
  blocker: boolean;
  humanOverridePriority: 0 | 1 | 2 | 3;
  resourceRisk: number;            // slider 0-1
  constraintPressure: number;      // slider 0-1
};

type WhatIfSimulatorProps = {
  taskId: string;
  baseline: { score: number, factors: Factor[] };
  open: boolean;
  onClose: () => void;
};
```

Posts to `/scoring/simulate` debounced 300ms. Renders score delta.

### DispatchPlanViz

```tsx
type DispatchAgent = {
  agentName: string;
  taskId?: string;
  status: 'running' | 'completed' | 'pending' | 'blocked';
  durationMs?: number;     // for completed
  elapsedMs?: number;      // for running
};

type DispatchPlanVizProps = {
  tiers: Array<{
    label: string;          // "Tier 1 — Parallel"
    parallel: boolean;
    agents: DispatchAgent[];
  }>;
};
```

### HeartbeatTimeline

```tsx
type RunnerHeartbeat = {
  runnerName: string;
  segments: Array<{
    state: 'green' | 'amber' | 'red' | 'empty';
  }>;
  lastHeartbeatLabel: string;  // '12s' | '4m' | 'Idle'
};

type HeartbeatTimelineProps = {
  runners: RunnerHeartbeat[];
  segmentCount: number;   // 30 desktop, 15 mobile
};
```

### ChannelBadge

```tsx
type Channel = 'email' | 'cli' | 'api' | 'web' | string;  // string for unknown

type ChannelBadgeProps = {
  channel: Channel;
  size?: 'sm' | 'md';
};
```

Maps channel → icon + token-based bg/fg colours. Unknown → neutral grey.

### EmptyPanel / PanelSkeleton / PanelError

```tsx
type EmptyPanelProps = {
  icon: LucideIconName;
  title: string;
  subtitle?: string;
  action?: { label: string, onClick: () => void };
};

type PanelSkeletonProps = {
  rows?: number;          // default 5
  withHeader?: boolean;   // default true
};

type PanelErrorProps = {
  error: Error | string;
  onRetry: () => void;
};
```

---

## 5. Library helpers

### `lib/formatEvent.ts`

```ts
export function formatEvent(event: SSEEvent): TickerEvent {
  switch (event.type) {
    case 'task.scored': return {
      time: formatTime(event.timestamp),
      dotColor: 'green',
      message: `Scored ${event.count} tasks — top priority: ${event.topTaskTitle}`,
      taskId: event.topTaskId,
    };
    case 'skill.completed':
      if (event.status === 'failed') {
        return {
          time: formatTime(event.timestamp),
          dotColor: 'red',
          message: `${event.skillName} skill failed — ${formatSkillError(event.error)}`,
          taskId: event.taskId,
        };
      }
      // …
    // …
  }
}
```

**Snapshot test:** `formatEvent.test.ts` runs against `tests/fixtures/event_formatter_cases.json` (mirrored from gateway repo). CI fails if outputs diverge from the gateway formatter.

### `lib/formatSkillError.ts`

```ts
export function formatSkillError(raw: string | { type: string, message: string }): string {
  // pattern matching:
  //   TimeoutError → "timed out after Xs"
  //   ToolNotFound → "skill setup is missing — check Settings"
  //   ValidationError → "input validation failed"
  //   default → first 80 chars of error message
}
```

### `lib/attentionDismiss.ts`

```ts
const KEY = 'gc:attention:dismissed';
const TTL_MS = 24 * 60 * 60 * 1000;

export function isDismissed(id: string): boolean;
export function dismiss(id: string): void;
export function pruneExpired(): void;
```

### `lib/channelBadge.ts`

```ts
export function channelTokens(channel: string): { bg: string, fg: string, icon: LucideIconName };
```

Looks up CSS custom properties from `themes.css`.

---

## 6. Theme tokens added

In `src/styles/themes.css`:

```css
:root {
  /* Channel badges */
  --ch-email-bg: #EFF6FF; --ch-email-fg: #3B82F6;
  --ch-cli-bg:   #F5F3FF; --ch-cli-fg:   #7C3AED;
  --ch-api-bg:   #ECFDF5; --ch-api-fg:   #059669;
  --ch-web-bg:   #FFFBEB; --ch-web-fg:   #D97706;
  --ch-unknown-bg: var(--bg-inset); --ch-unknown-fg: var(--text-secondary);

  /* Heartbeat segments */
  --hb-green: var(--state-progress);
  --hb-amber: var(--state-delayed);
  --hb-red:   var(--state-blocked);
  --hb-empty: var(--bg-inset);

  /* Attention strip */
  --attention-bg-warn:    #FFFBEB;
  --attention-bg-critical: var(--state-blocked-light);
}

[data-theme="dark"] {
  --ch-email-bg: rgba(59,130,246,0.15); --ch-email-fg: #60A5FA;
  --ch-cli-bg:   rgba(124,58,237,0.15); --ch-cli-fg:   #A78BFA;
  --ch-api-bg:   rgba(5,150,105,0.15);  --ch-api-fg:   #34D399;
  --ch-web-bg:   rgba(217,119,6,0.15);  --ch-web-fg:   #FBBF24;
  --attention-bg-warn:    rgba(245,158,11,0.08);
  --attention-bg-critical: rgba(239,68,68,0.10);
}
```

---

## 7. Testing patterns

### Unit tests (vitest, co-located)

Each component test covers:
1. Renders empty state when data empty.
2. Renders populated state with fixture data.
3. Click handlers fire with expected args.
4. Loading skeleton shows while data loading.
5. Error state shows on hook error.

### E2E tests (Playwright)

`e2e/agent-monitor/*.spec.ts`:

| File | Covers |
|------|--------|
| `overview.spec.ts` | KPI cards render, ticker receives SSE events, attention strip shows on failure |
| `activity-filters.spec.ts` | Time + type filters, session toggle, load more, error row drawer |
| `comms-tabs.spec.ts` | URL-bound tab switching, channel badges, display name resolution |
| `scheduling-fire-now.spec.ts` | Fire Now button triggers run; new session appears in ticker |
| `scoring-drilldown.spec.ts` | Row click → factor panel, simulator open → slider drag → debounced score update |

---

## 8. Reuse from existing codebase

| Existing | Reuse for |
|----------|-----------|
| `src/components/common/KpiCard.tsx` | All KPI cards |
| `src/components/common/SparklineBar.tsx` | Worker mini-card sparklines (extract if missing) |
| `src/components/ui/badge.tsx` | All badges |
| `src/components/ui/button.tsx` | All buttons |
| `src/lib/sse.ts` (existing helper) | `useSSE` subscriptions |
| `src/lib/api-client.ts` (openapi-fetch) | All API calls |
| `useAgentData.ts` (Wave 5, moved to `useAgentStatus.ts`) | KPI cards |
| `ScoreExplainer.tsx` (Wave 5, moved to `ScoreFactorBreakdown.tsx`) | Factor breakdown |

---

## 9. What NOT to build

These are intentionally excluded from v2 — see [05-open-risks.md](05-open-risks.md):

- **Generic event log component.** Activity feed and Live ticker share `formatEvent.ts` but the components are distinct — don't unify them prematurely.
- **Custom modal manager.** Use the existing modal primitive in `src/components/ui/`.
- **In-house chart library.** Recharts already in stack; use it for any charts (Phase C).
- **Custom virtualization.** Tables ≤ 100 rows; if >100 needed, add Phase C ticket.
