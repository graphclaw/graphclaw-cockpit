# 12 — Task Views

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

> **2026-05-02 design extension.** Task detail must surface counterparty conversations linked via CheckinNode separate from owner-discussion (FR-UI-001). Distinguish locally-owned tasks vs `list_external_assignments_for_me` projections; add "Request access" flow for external task full-detail. Briefing renders by entity (canonical name + parenthetical aliases) — FR-BRF-001. References:
> - [graphclaw/docs/architecture/16-cross-user-conversations.md](../../../graphclaw/docs/architecture/16-cross-user-conversations.md)
> - [graphclaw/docs/architecture/17-cross-tenant-task-projection.md](../../../graphclaw/docs/architecture/17-cross-tenant-task-projection.md)
> - [graphclaw/docs/requirements/agent-triad-and-comms-substrate.md](../../../graphclaw/docs/requirements/agent-triad-and-comms-substrate.md) FR-UI-001, FR-XT-002, FR-XT-004, FR-BRF-001

---

## 12.1 View Switcher

A persistent toggle at the top of the cockpit surface lets users switch between views:

| View | Icon | Description |
|------|------|-------------|
| **Graph** | 🔗 | Full interactive property graph (PRD §02) |
| **Table** | 📋 | Tabular task list with sortable columns |
| **Dependencies** | 🌳 | Focused dependency graph for a selected task or goal |

The selected view persists in user config (`config.preferences.default_task_view`).

---

## 12.2 Tabular Task View

A data-dense table showing all tasks accessible to the current user.

### Columns

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| Rank | `ScoreExplanation.computed_priority` rank | ✅ | — |
| ID | `TaskNode.id` (short form: `TSK-xxx`) | ✅ | ✅ (search) |
| Title | `TaskNode.title` | ✅ | ✅ (search) |
| Type | `TaskNode.type` (ACTION_ITEM, FOLLOW_UP, DECISION, etc.) | ✅ | ✅ (multi-select) |
| State | `TaskNode.state` badge (color-coded) | ✅ | ✅ (multi-select) |
| Priority | `TaskNode.priority` (P1/P2/P3) | ✅ | ✅ (multi-select) |
| Score | `ScoreExplanation.computed_priority` (0.000–1.000) | ✅ | ✅ (range slider) |
| Assignee | `ResourceNode.name` via ASSIGNED_TO edge | ✅ | ✅ (multi-select) |
| Deadline | `TaskNode.deadline` (date, relative format) | ✅ | ✅ (date range) |
| Goal | Parent `GoalNode.title` via CHILD_OF edge | ✅ | ✅ (multi-select) |
| Deps (In) | Count of incoming DEPENDS_ON edges | ✅ | ✅ (has deps / no deps) |
| Deps (Out) | Count of outgoing DEPENDS_ON edges | ✅ | — |
| Blockers | Count of BLOCKED_BY edges where blocker is not DONE | ✅ | ✅ (has blockers / no blockers) |
| Updated | `TaskNode.updated_at` | ✅ | ✅ (date range) |

### Inline Actions

| Action | Trigger | Effect |
|--------|---------|--------|
| Quick State Change | Click state badge → dropdown | `POST /app/v1/tasks/{id}/transition` |
| Quick Assign | Click assignee → dropdown | `PATCH /app/v1/graph/tasks/{id}` |
| Set Deadline | Click deadline → date picker | `PATCH /app/v1/graph/tasks/{id}` |
| View Detail | Click row | Opens detail side panel (same as graph detail panel §02) |
| Score Breakdown | Click score cell | Opens ScoreExplanation popover (§08) |

### Batch Operations

- Multi-select via checkboxes
- Batch actions: Change State, Reassign, Change Priority, Delete
- Confirm dialog for destructive operations

### Pagination

- Cursor-based (via `GET /app/v1/graph/tasks?cursor=...&limit=50`)
- Virtual scrolling for large datasets (1000+ tasks)
- Row count displayed: "Showing 1–50 of 342 tasks"

---

## 12.3 Dependency Graph View

A focused sub-graph showing dependency relationships for a selected task or goal.

### Activation

- Select a task (from table or graph) → click "View Dependencies"
- Or select a goal → "Show Dependency Tree"
- Or filter: "Show all tasks on critical path"

### Layout

- **Directed acyclic graph (DAG)** layout: left-to-right (dependencies flow left → right)
- **Node shapes** follow the graph cockpit visual language (§02)
- **Edge types** color-coded:
  - `DEPENDS_ON` (HARD) — solid red arrow
  - `DEPENDS_ON` (SOFT) — dashed amber arrow
  - `BLOCKED_BY` — thick red arrow
  - `CHILD_OF` — thin grey arrow (hierarchy, shown as background layer)
  - `SEQUENTIAL_NEXT` — blue arrow

### Visual Cues

| Cue | Meaning |
|-----|---------|
| **Red node border** | Task is BLOCKED (has unresolved BLOCKED_BY) |
| **Amber node border** | Task has SOFT dependency not yet met |
| **Green node border** | All dependencies satisfied, task is ready |
| **Bold path** | Critical path (longest dependency chain to a P1 goal) |
| **Faded nodes** | Completed tasks (DONE state) — shown for context but de-emphasized |

### Interactions

| Action | Trigger | Effect |
|--------|---------|--------|
| Expand upstream | Click "←" on a node | Load and show its dependencies |
| Expand downstream | Click "→" on a node | Load and show tasks that depend on it |
| Critical path highlight | Toggle button | Highlight the critical path through the selected node |
| Root cause analysis | Right-click blocked node → "Why blocked?" | Traces BLOCKED_BY chain to root cause, highlights path |
| Downstream impact | Right-click node → "What depends on this?" | Shows all downstream tasks, highlights affected subgraph |
| Collapse | Double-click expanded cluster | Collapse back to single node |

### Root Cause Analysis

When a task is in `BLOCKED` state, the "Why Blocked?" action:

1. Follows `BLOCKED_BY` edges recursively
2. Identifies the root blocking task(s) — the ones that are themselves NOT blocked
3. Highlights the full chain from root blocker → selected task
4. Shows estimated unblock date based on root blocker's deadline + effort

### Downstream Impact

When evaluating whether to delay or reprioritize a task:

1. Follows outgoing `DEPENDS_ON` and `SEQUENTIAL_NEXT` edges recursively
2. Counts total affected tasks
3. Shows the latest deadline among affected tasks (impact deadline)
4. Highlights tasks that would become BLOCKED if current task is delayed

---

## 12.4 Saved Filter Presets

Users can save and name filter+sort combinations:

| Field | Description |
|-------|-------------|
| Name | User-defined name (e.g., "My Open P1s") |
| View | Table / Dependencies / Graph |
| Filters | JSON object of active filter state |
| Sort | Column + direction |
| Scope | User-private or org-shared (owner only) |

**Storage:** Part of user config JSON (`config.preferences.saved_filters[]`)

### Built-in Presets

| Preset | Filters |
|--------|---------|
| My Tasks | assignee = current_user |
| Blocked | state = BLOCKED |
| Due This Week | deadline ∈ [today, today+7] |
| Critical Path | on_critical_path = true |
| Needs Decision | type = DECISION, state = PENDING_DECISION |
| Unassigned | assignee = null |

---

## 12.5 Data Endpoints

| Endpoint | Used By |
|----------|---------|
| `GET /app/v1/graph/tasks` | Table view (with filter/sort params) |
| `GET /app/v1/graph/goals/{id}/tree` | Dependency graph (full tree) |
| `GET /app/v1/graph/edges` | Dependency graph (edge queries) |
| `GET /app/v1/scoring/tasks/{id}` | Score cell expansion |
| `GET /app/v1/tasks/{id}/valid-transitions` | Inline state change dropdown |
| `POST /app/v1/tasks/{id}/transition` | Inline state change action |
