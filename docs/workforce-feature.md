# Workforce Feature — Design & Build Plan

**Reference wireframe:** `wireframes-v2/pages/workforce-view.html`
**Route:** `/workforce` (replaces `/people` with redirect)
**Feature dir:** `src/features/workforce/`
**Wave:** 4 (Graph Views)

---

## 1. Problem Statement

The existing "People" page (`/people`) is a plain member directory pulling from
`GET /admin/members`. It shows workspace users with roles and join dates — a
duplicate of the Admin Panel > Members page.

The original PRD intent (§02 Graph Cockpit — Resource View) is fundamentally
different: **task workload visibility per assignee**, showing both human users
AND AI agents who have been assigned tasks, their current capacity utilisation,
and the breakdown of tasks by state.

---

## 2. Design Goals

| Goal | Description |
|------|-------------|
| **Clarity** | Users see at a glance who (human or agent) has how many tasks and whether they are overloaded |
| **Separation** | Humans and AI Agents have distinct characteristics — separate tabs prevent cognitive overload |
| **Progressive disclosure** | Summary card + expandable task list — detail on demand |
| **Parity with wireframe** | KPI summary bar, capacity bars (green/amber/red), task status pills, expand/collapse |
| **Backend-ready** | Uses existing `GET /graph/resources` + `GET /graph/tasks` — no new endpoints needed for v1 |

---

## 3. UI Structure (from wireframe)

```
WorkforcePage
├── Page heading: "Workforce" + subtitle
├── Tab bar: [ Humans (N) ] [ AI Agents (N) ]
└── Tab panel (per tab)
    ├── KPI cards (5): Active count · Avg Utilisation · Over Capacity · Active Tasks · Completed
    ├── Filter row: search input · "Over capacity" chip · sort dropdown
    └── Resource grid (auto-fill 360px cards)
        └── WorkforceCard (per resource)
            ├── Card header (clickable toggle): avatar · name · role-line · type badge · chevron
            ├── CapacityBar: gradient bar (green/amber/red) + percentage
            ├── TaskStatusPills: coloured count badges per state
            └── ResourceTaskList (expanded only):
                ├── Column headers: Task · State · Priority · Due
                ├── Task rows (max 10, truncated)
                └── "View all N tasks →" footer link
```

### Capacity colour thresholds (from wireframe)

| Load factor | Colour | Meaning |
|-------------|--------|---------|
| < 80% | `#34D399 → #10B981` (green) | Healthy |
| 80–100% | `#FBBF24 → #F59E0B` (amber) | Near limit |
| > 100% | `#F87171 → #EF4444` (red) | Over capacity |

Over-capacity cards receive a `border-l-[3px] border-[var(--state-blocked)]` accent.

### Task state → display category mapping

| Backend state | Display (human) | Display (agent) | Pill colour |
|---|---|---|---|
| PENDING, SNOOZED, SCHEDULED | Pending | Queued | `--state-active` (blue) |
| ACTIVE, IN_PROGRESS, DELEGATED | In Progress | Processing | `--state-progress` (green) |
| REVIEW, UNDER_REVIEW | Review | Review | `--state-review` (purple) |
| BLOCKED, STALLED, FAILED | Blocked | Stalled | `--state-blocked` (red) |
| COMPLETE, DONE, COMPLETED, CLOSED | Done | Done | `--state-complete` (grey) |

---

## 4. Data Flow

### API calls

| Call | Purpose |
|------|---------|
| `GET /app/v1/graph/resources` | List all ResourceNodes (HUMAN + AI_AGENT) |
| `GET /app/v1/graph/tasks?limit=500` | Batch-fetch all tasks for client-side grouping |

### Client-side aggregation (`useWorkforceData`)

1. Fetch resources → `ResourceItem[]`
2. Fetch all tasks → `TaskItem[]`
3. Group tasks by `task.assignee` (= resource id)
4. For each resource compute `TaskCounts` (pending/in_progress/review/blocked/done)
5. Compute `load_factor = (in_progress + review + blocked) / (resource.capacity ?? 10)`
6. Return `WorkforceResource[]` — resource enriched with `task_counts`, `load_factor`, `tasks[]`

### Types added

```typescript
// src/features/workforce/hooks/useWorkforceData.ts
export interface TaskCounts {
  pending: number; in_progress: number; review: number; blocked: number; done: number; total: number;
}
export interface WorkforceResource extends ResourceItem {
  type: 'HUMAN' | 'AI_AGENT';
  task_counts: TaskCounts;
  load_factor: number;   // 0 – 1.5+
  tasks: TaskItem[];
}
```

---

## 5. Component Inventory

| File | Type | Responsibility |
|------|------|---------------|
| `WorkforcePage.tsx` | Page | Tab state, KPI computation, filter/sort, grid layout |
| `components/WorkforceCard.tsx` | Component | Single resource card, expand/collapse |
| `components/CapacityBar.tsx` | Component | Gradient bar + percentage label |
| `components/TaskStatusPills.tsx` | Component | Coloured task count pills per state |
| `hooks/useWorkforceData.ts` | Hook | Data fetch + client-side aggregation |

---

## 6. Navigation Changes

| File | Change |
|------|--------|
| `src/routes.tsx` | Add `WorkforcePage` lazy import; add `/workforce` route; replace `/people` with `<Navigate to="/workforce" replace />` |
| `src/components/layout/Sidebar.tsx` | Rename `People` → `Workforce`, path `/people` → `/workforce` |
| `src/components/layout/Topbar.tsx` | Add `'/workforce': 'Workforce'` to `ROUTE_LABELS`; remove `/people` |
| `src/components/common/CommandPalette.tsx` | Update label `People` → `Workforce`, path → `/workforce` |
| `src/features/graph/PeoplePage.tsx` | Kept as-is (still importable); replaced at route level |

---

## 7. Tests

**Puppeteer E2E** (`e2e-puppeteer/specs/graph/workforce.spec.ts`):

1. GET /graph/resources — page renders heading and tab bar
2. Humans tab is active by default; KPI labels present
3. Switching to AI Agents tab updates KPI labels
4. `/people` redirects to `/workforce`
5. Resource card expand/collapse toggles `aria-expanded` attribute
6. Over-capacity filter chip toggles filter state

---

## 8. Implementation Phases

### Phase 0 (complete)
- [x] Wireframe created: `wireframes-v2/pages/workforce-view.html`
- [x] Brainstorm + design decisions documented in session notes

### Phase 1 — Core implementation
- [ ] `hooks/useWorkforceData.ts`
- [ ] `components/CapacityBar.tsx`
- [ ] `components/TaskStatusPills.tsx`
- [ ] `components/WorkforceCard.tsx`
- [ ] `WorkforcePage.tsx`
- [ ] Route + nav updates

### Phase 2 — Tests & polish
- [ ] `e2e-puppeteer/specs/graph/workforce.spec.ts`
- [ ] `npm run typecheck && npm run lint`
- [ ] Git commit `feat(wave-4): add Workforce view replacing People page`

### Phase 3 — Future enhancements (out of scope for v1)
- Weekly capacity heatmap tab (restoring wireframe v1 intent)
- Drag-and-drop task reassignment between resources
- Real-time SSE updates (task state changes reflected live)
- Backend aggregation endpoint (`GET /graph/resources/workload`) for scale
- Historical utilisation trend charts (Recharts)
