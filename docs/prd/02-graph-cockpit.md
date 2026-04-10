# 02 — Graph Cockpit: Visualization & Task Management

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

---

## 2.1 Five Key Views

| View | Description | Entry Point |
|------|-------------|-------------|
| **GOAL VIEW** | Zoom out: all goals as cards with milestone progress bars. Entry point for weekly planning. | Default landing page |
| **PROJECT VIEW** | One goal expanded with full task tree. Critical path highlighted. Sequential chains visually distinct from parallel. | Click a goal |
| **MY TASKS VIEW** | Flat list: tasks assigned to or owned by the user, sorted by `computed_priority`. ScoreExplanation visible on hover/tap. | Sidebar shortcut |
| **RESOURCE VIEW** | Tasks grouped by assignee. Capacity bar per resource (`load_factor`). At-risk resources highlighted. | Top nav tab |
| **TIMELINE VIEW** | Gantt-style: tasks plotted against deadlines. Critical path in distinct color. Constraint nodes shown as boundary markers. | Top nav tab |

---

## 2.2 Visual Language

### Node Encoding

| Property | Visual Mapping |
|----------|---------------|
| **State** | Node color — Active→blue, In Progress→green, Blocked→red, Delayed→amber, Complete→grey, Snoozed→light grey, Needs Review→purple |
| **Priority Score** | Node size — larger = higher `computed_priority` |
| **Task Type** | Node icon — ATOMIC (circle), COMPOSITE (nested squares), DELEGATED (arrow-out), APPROVAL (shield), MILESTONE (flag), DECISION (diamond), RECURRING (cycle) |
| **Organization** | Color tag + emoji overlay from `OrganizationNode.color_tag` / `emoji_tag` |

### Edge Encoding

| Property | Visual Mapping |
|----------|---------------|
| **DEPENDS_ON** | Solid arrow, thickness = gate importance |
| **BLOCKS (HARD)** | Thick red line |
| **BLOCKS (SOFT)** | Thin amber dashed line |
| **PART_OF** | Dotted containment line |
| **FOLLOW_UP_FOR** | Thin grey arrow with clock icon |
| **ASSIGNED_TO** | Thin blue line to resource node |
| **Critical path** | Highlighted in accent color (configurable) |

---

## 2.3 Key Interactions

| Gesture | Action |
|---------|--------|
| **Click node** | Open detail panel → ScoreExplanation, state, timeline, progress, artifacts, autonomy controls |
| **Drag node** | Reassign to different resource (drops on ResourceNode) |
| **Click empty canvas** | Create new task node at that hierarchy level |
| **Inline edit** | Double-click node → edit title, description, deadline, state in-context |
| **Right-click node** | Context menu: edit, delete, lock from agent, override priority, change state |
| **Click edge** | View/edit edge properties: gate_type (AND/OR), strength (HARD/SOFT), sequence_order |
| **Drag from port** | Create new edge: select edge type from dropdown (DEPENDS_ON, BLOCKS, PART_OF, etc.) |
| **Right-click edge** | Delete edge |
| **Approve/Reject** | Pending APPROVAL/DECISION nodes show action buttons directly on the node |
| **Bulk select** | Lasso or Ctrl+click → toolbar: reassign, defer, change state, override priority |
| **Zoom controls** | Scroll to zoom, pinch on mobile, zoom-to-fit button, minimap toggle |
| **Filter controls** | Filter by: goal, state, assignee, org workspace, task type. Critical path toggle. |

---

## 2.4 Direct Graph Editing (Full CRUD)

Users have full control over the property graph. Every node and edge can be created, viewed, edited, and deleted from the cockpit.

### Node Operations

| Operation | Interaction | Backend Call |
|-----------|-------------|-------------|
| **Create node** | Click canvas → select node type (Task, Goal, Constraint, Resource) → fill form → confirm | `POST /app/v1/graph/tasks` or `POST /app/v1/graph/goals` |
| **Read node** | Click node → detail panel | `GET /app/v1/graph/tasks/{task_id}` |
| **Update node** | Double-click or detail panel → edit fields → save | `PATCH /app/v1/graph/tasks/{task_id}` |
| **Delete node** | Right-click → Delete. Cascade confirmation if node has children or dependents. | `DELETE /app/v1/graph/tasks/{task_id}` |

### Edge Operations

| Operation | Interaction | Backend Call |
|-----------|-------------|-------------|
| **Create edge** | Drag from source port to target → select edge type → configure properties | `POST /app/v1/graph/edges` |
| **Read edge** | Click edge → edge detail popover | Included in tree/goal responses |
| **Update edge** | Click edge → edit gate_type, strength, sequence_order | `PATCH /app/v1/graph/edges/{edge_id}` |
| **Delete edge** | Right-click edge → Delete | `DELETE /app/v1/graph/edges/{edge_id}` |

### Supported Node Types for Creation

| Node Type | Fields | Pydantic Model |
|-----------|--------|----------------|
| **TaskNode** | title, description, task_type (11 variants), deadline, estimated_effort_hours, assigned_resource | `TaskNode` from `models/nodes.py` |
| **GoalNode** | title, description, priority (P1/P2/P3), state | `GoalNode` |
| **ConstraintNode** | constraint_type, rule (hard_limit, threshold), scope, applies_to node_ids | `ConstraintNode` |
| **ResourceNode** | name, resource_type (HUMAN/AI_AGENT), capacity settings | `ResourceNode` |

### Supported Edge Types

| Edge Type | Source → Target | Key Properties |
|-----------|----------------|----------------|
| DEPENDS_ON | Task → Task | gate_type (AND/OR) |
| BLOCKS | Task → Task | strength (HARD/SOFT) |
| PART_OF | Task → Goal/Milestone | sequence_order |
| FOLLOW_UP_FOR | Task → Task | scheduled_fire_at |
| ASSIGNED_TO | Task → Resource | — |
| OWNED_BY | Goal → User | — |
| APPLIES_TO | Constraint → Task/Goal | — |
| SPAWNED_FROM | Task → Task | — |
| BRANCHED_FROM | Task → Decision | — |
| BATCHED_IN | Task → Checkin | — |
| SCOPED_TO_WS | Task/Goal → Workspace | — |

---

## 2.5 Agent Override Controls

Users can override the orchestrating agent at the node level:

| Control | Location | Effect |
|---------|----------|--------|
| **Lock node** | Node context menu → "Lock from Agent" | Agent skips this node during scoring/modification cycles. Node shows padlock icon. |
| **Priority override** | Detail panel → Override section | Set PRIORITIZE / DEPRIORITIZE / SNOOZE with optional expiry. Overrides agent's computed score. |
| **Manual action list** | My Tasks View → "Manual Priority" mode | User drags tasks into a custom ordered list. Agent respects this ordering until user exits manual mode. |
| **State override** | Detail panel → State dropdown | Manually transition task state (valid transitions enforced by backend state machine guards). |
| **Autonomy toggle** | Detail panel → Autonomy section | Per-node: SUGGEST (agent proposes), AUTONOMOUS (agent acts), REQUIRE_APPROVAL (agent waits). |

---

## 2.6 Task Node Detail Panel

When a user clicks a task node, the side panel shows:

**Header:**
- Task ID, title, state badge, task type icon
- Assigned resource with avatar
- Organization workspace color tag

**Sections (collapsible):**

1. **Score** — `computed_priority` with ScoreExplanation breakdown (W1–W7 factor scores, modifiers, natural language summary)
2. **Timeline** — deadline, started_at, estimated_effort_hours, completed_at, slack remaining
3. **Progress** — percentage bar, confidence level, completion_signal type, last update
4. **Dependencies** — upstream blockers (clickable), downstream dependents, gate_type
5. **State History** — audit trail of all transitions (timestamp, old_state → new_state, changed_by, reason)
6. **Inbound Updates** — last N update log entries (received_at, source, matched_by, confidence)
7. **Artifacts** — attached files with download links, submission metadata
8. **Override Controls** — lock, priority override, autonomy toggle
9. **Type Metadata** — type-specific fields (e.g., approval criteria, cron expression, decision options)

---

## 2.7 Organization Workspace Switcher

- **Top-level selector** in the header to switch between organization workspaces (Personal, Work, Side Project, etc.)
- Each org uses its `color_tag` and `emoji_tag` for visual identity throughout the graph
- **Unified cross-org view** available as a pull-based option (never mixed unprompted)
- Switcher shows: org name, emoji, member count, last activity

---

## 2.8 Undo / Redo

All graph mutations support undo/redo:

- **Undo stack** (Ctrl+Z / Cmd+Z): Reverts the last graph mutation (create, update, delete for nodes and edges)
- **Redo stack** (Ctrl+Shift+Z / Cmd+Shift+Z): Re-applies the last undone mutation
- Stack depth: 50 operations per session
- Undo issues a reverse API call (e.g., undo delete → re-create with same data)
- Visual toast confirmation: "Undone: deleted TSK-JD-0042-ATOMIC" with Redo button

---

## 2.9 Graph Library

The implementation must use one of:

- **Cytoscape.js** (`cytoscape/cytoscape.js`) — mature graph rendering with zoom, pan, layout algorithms, hover/click interaction
- **React Flow** (`xyflow/xyflow`) — React-native node-based UI, better DX for React-idiomatic implementation

Both support required features: node/edge rendering, drag, zoom, pan, selection, custom node components, layout algorithms. The specific choice is a technical decision for the implementation phase.

---

## 2.10 Real-Time Updates

The graph view subscribes to the SSE stream at `/app/v1/events` for live updates:

| Event | Action |
|-------|--------|
| `task.state_changed` | Update node color, badge, and detail panel if open |
| `task.scored` | Update node size (priority), refresh ScoreExplanation if panel is open |
| `briefing.ready` | Show notification badge, optionally pop briefing summary |
| `approval.pending` | Flash approval node, show action buttons |
| `skill.completed` | Update task progress if skill was operating on a visible task |

TanStack Query handles cache invalidation — SSE events trigger targeted query invalidation rather than full refetch.
