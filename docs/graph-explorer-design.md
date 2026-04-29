# Graph Explorer — Design & Requirements

**Document Owner:** GraphClaw Cockpit Team  
**Status:** Implementation In Progress  
**Last Updated:** 2025-01-28  
**Wave:** TBD (follows canvas work)

---

## 1. Overview

Graph Explorer is a full-featured raw property graph viewer and editor for the GraphClaw workspace. It exposes the underlying Apache AGE graph database that the orchestrator manages, letting workspace members visualize all nodes (Tasks, Goals, Resources, Constraints), all edges, and interactively edit properties via a side inspector panel.

### 1.1 Motivation

The `canvas-editor` feature (React Flow) was originally designed as a graph viewer but was repurposed as the Agent Configuration Hub. Graph Explorer restores the original vision: a Cytoscape.js–based canvas that mirrors the real property graph, with filters, property editing, and CRUD operations.

### 1.2 Placement in Navigation

**Section:** WORKSPACE (sidebar)  
**Route:** `/graph-explorer`  
**Position:** After Timeline, before People  
**Icon:** `Network` (Lucide)  
**Command Palette:** "Graph Explorer" → Workspace section

---

## 2. Feature Goals

| # | Goal | Priority |
|---|------|----------|
| G1 | Show all graph nodes from real backend (Tasks, Goals, Resources) | Must Have |
| G2 | Show all edges with type-based styling | Must Have |
| G3 | Multi-tier filter panel for instant client-side graph filtering | Must Have |
| G4 | Node inspector — view & edit all properties | Must Have |
| G5 | Edge inspector — view & edit properties | Must Have |
| G6 | Create and delete nodes via dialog | Must Have |
| G7 | Create and delete edges via dialog | Must Have |
| G8 | Multiple Cytoscape.js layouts (dagre, cose, breadthfirst, concentric) | Must Have |
| G9 | Stats bar: live counts of visible nodes and edges | Should Have |
| G10 | Minimap for large graphs | Should Have |
| G11 | Context menu on right-click (node / edge / canvas) | Should Have |
| G12 | Zoom controls (−, percentage display, +, fit) | Should Have |
| G13 | Select / Pan mode toggle | Should Have |

---

## 3. UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: "Graph Explorer"  [stats bar: 42 nodes · 67 edges · 5↑]    │
├───────────────┬────────────────────────────────┬────────────────────┤
│ FILTER PANEL  │  CANVAS (Cytoscape.js)          │  INSPECTOR         │
│ 260px         │  flex-1                         │  300px             │
│               │                                 │                    │
│ [Presets]     │  [Floating Toolbar]             │  (Node / Edge /    │
│  All          │                                 │   Empty state)     │
│  Active Work  │  Nodes with shapes:             │                    │
│  Blocked      │  ⬦ Goal (diamond/green)         │  Editable fields   │
│  Critical     │  ▭ Task (round-rect/state-clr)  │  Scoring grid      │
│  My Tasks     │  ◯ Resource (ellipse/cyan)      │  Edge lists        │
│  Overdue      │  ⬡ Constraint (hexagon/amber)   │                    │
│               │                                 │  [Delete][Apply]   │
│ [Node Types]  │  Edges color-coded by type      │                    │
│ [Task States] │                                 │                    │
│ [Goal States] │  [Minimap]     [Zoom Controls]  │                    │
│ [Task Filters]│                                 │                    │
│ [Timeline]    │                                 │                    │
│ [Edge Types]  │                                 │                    │
│ [Risk&Health] │                                 │                    │
└───────────────┴────────────────────────────────┴────────────────────┘
```

- **Filter panel**: 260px, collapsible (chevron toggle)  
- **Canvas**: flex-1, dot-grid background, Cytoscape.js mounted  
- **Inspector**: 300px, slides in when node/edge selected, hidden when nothing selected

---

## 4. Node Types & Visual Encoding

| Node Type | Shape | Color Basis | Size |
|-----------|-------|-------------|------|
| Task | round-rectangle | Task state → STATE_COLORS | priority-based (35–60px) |
| Goal | diamond | `var(--state-progress)` | 55px |
| Resource | ellipse | `#06b6d4` (cyan) | 45px |
| Constraint | hexagon | `var(--state-delayed)` (amber) | 45px |

**Task STATE_COLORS mapping:**
```
ACTIVE      → var(--state-active)    // blue
IN_PROGRESS → var(--state-progress)  // green
BLOCKED     → var(--state-blocked)   // red
DELAYED     → var(--state-delayed)   // amber
DONE / COMPLETE → var(--state-complete) // gray
NEEDS_REVIEW / PLANNING → var(--state-review) // purple
BACKLOG / INACTIVE_PENDING → var(--text-tertiary) // muted
SNOOZED     → var(--state-snoozed)   // light
PENDING     → var(--text-tertiary)
CANCELLED   → var(--state-blocked)
```

---

## 5. Edge Types & Visual Encoding

| Edge Type | Color | Style |
|-----------|-------|-------|
| DEPENDS_ON | `#ef4444` (red) | dashed |
| BLOCKS | `#f97316` (orange) | solid, thick |
| PART_OF | `#3b82f6` (blue) | solid |
| FOLLOW_UP_FOR | `#8b5cf6` (purple) | dotted |
| SPAWNED_FROM | `#10b981` (green) | solid |
| ASSIGNED_TO | `#06b6d4` (cyan) | solid |
| OWNED_BY | `#0ea5e9` (brand) | solid |
| APPLIES_TO | `#f59e0b` (amber) | dashed |
| INFORMS | `#94a3b8` (neutral) | dotted |
| BRANCHED_FROM | `#a855f7` (violet) | solid |
| BATCHED_IN | `#14b8a6` (teal) | solid |
| REFERRED_BY | `#64748b` (slate) | dotted |

---

## 6. Filter Panel — 5 Tiers

### Tier 0: Presets (chips, top of panel)
- All, Active Work, Blocked, Critical Path, My Tasks, Overdue

### Tier 1: Node Types (toggles)
- Tasks ✓, Goals ✓, Resources ✓, Constraints ✓

### Tier 2: Task States (chips)
10 state chips: ACTIVE, IN_PROGRESS, BLOCKED, DELAYED, PENDING, COMPLETE, CANCELLED, SNOOZED, NEEDS_REVIEW, INACTIVE_PENDING

### Tier 3: Goal States (chips)
4 chips: ACTIVE, IN_PROGRESS, COMPLETE, ARCHIVED

### Tier 4: Task Filters (collapsible)
- Priority: CRITICAL, HIGH, MEDIUM, LOW
- Task Types: GOAL, MILESTONE, ACTION, DELEGATED, FOLLOWUP, CHECKIN, BRIEFING, DECISION, REVIEW, SYNC, HANDOFF

### Tier 5: Timeline (collapsible)
- Due This Week, Due This Month, Overdue, No Deadline

### Tier 6: Edge Types (collapsible)
- Toggle each of the 12 edge types

### Tier 7: Risk & Health (collapsible)
- On Critical Path, Has Blocking Dependency, Score ≥ 0.7, Score < 0.3

All filtering is **client-side** via Cytoscape `ele.hide()` / `ele.show()` — no re-fetch on filter change.

---

## 7. Inspector Panel

### 7.1 Node Inspector (Task)
- ID (read-only, copy-able)
- Title (editable text input)
- State (select dropdown)
- Priority (select dropdown)
- Task Type (read-only)
- Deadline (date input)
- Description (textarea)
- 7-factor scoring grid (read-only): timeline_urgency, dependency_weight, critical_path, blocker, human_override, resource_risk, constraint_pressure → computed_priority
- Outgoing edges list (edge_type → target title)
- Incoming edges list (source title → edge_type)
- [Open Full Detail] link
- [Delete Task] button (destructive, confirmation required)
- [Apply Changes] button (PATCH)

### 7.2 Node Inspector (Goal)
- ID, Title, State, Priority, Description
- Timeline
- [Apply Changes], [Delete Goal]

### 7.3 Node Inspector (Resource)
- ID, Name, Resource Type, Reliability score
- Assigned Tasks (from edges)

### 7.4 Edge Inspector
- Edge ID (read-only)
- Edge Type (read-only)
- Source → Target (read-only, with node titles)
- Properties: gate_type (if DEPENDS_ON), strength (if BLOCKS), sequence_order (if PART_OF)
- Created By, Note
- [Delete Edge] button

---

## 8. Add Node Dialog

Stepped dialog:
1. Select node type: Task | Goal | Resource
2. Type-specific fields form (React Hook Form + Zod)
3. POST to `/app/v1/graph/tasks` (or `/goals`, `/resources`)
4. On success: node appears in canvas, inspector opens

### Add Task Fields
- Title* (text)
- Task Type* (select: ACTION, MILESTONE, DELEGATED, DECISION, etc.)
- Priority (select: CRITICAL, HIGH, MEDIUM, LOW)
- Description (textarea)
- Deadline (date)
- Tags (comma-separated)

### Add Goal Fields  
- Title*, Description, State*, Priority*

---

## 9. Add Edge Dialog

- Source Node (searchable select)
- Target Node (searchable select)
- Edge Type* (select: 12 options)
- Conditional properties: gate_type (if DEPENDS_ON), strength (if BLOCKS)
- POST to `/app/v1/graph/edges`

---

## 10. API Endpoints Used

| Operation | Method | URL |
|-----------|--------|-----|
| Fetch tasks | GET | `/app/v1/graph/tasks?limit=200` |
| Fetch goals | GET | `/app/v1/graph/goals?limit=200` |
| Fetch resources | GET | `/app/v1/graph/resources?limit=200` |
| Fetch all edges | GET | `/app/v1/graph/edges?limit=500` |
| Create task | POST | `/app/v1/graph/tasks` |
| Update task | PATCH | `/app/v1/graph/tasks/{id}` |
| Delete task | DELETE | `/app/v1/graph/tasks/{id}` |
| Create edge | POST | `/app/v1/graph/edges` |
| Delete edge | DELETE | `/app/v1/graph/edges/{id}` |

All calls use Bearer token from `localStorage.getItem('gc-access-token')`.

---

## 11. File Structure

```
src/features/graph-explorer/
├── types.ts                          # ExplorerNode, ExplorerEdge, filters, configs
├── GraphExplorerPage.tsx             # Main three-panel page
├── components/
│   ├── GraphExplorerCanvas.tsx       # Extended Cytoscape wrapper
│   ├── GraphExplorerToolbar.tsx      # Floating toolbar (mode, add, layout)
│   ├── ZoomControls.tsx              # Zoom in/out/fit/percentage
│   ├── GraphContextMenu.tsx          # Right-click context menu
│   ├── GraphFilterPanel.tsx          # 5-tier collapsible filter panel
│   ├── NodeInspector.tsx             # Node detail + edit form
│   ├── EdgeInspector.tsx             # Edge detail + edit
│   ├── AddNodeDialog.tsx             # Create node dialog
│   └── AddEdgeDialog.tsx             # Create edge dialog
├── hooks/
│   ├── useGraphExplorerStore.ts      # Zustand store (filters, selection, layout)
│   ├── useGraphExplorerData.ts       # TanStack Query: parallel fetch all data
│   └── useGraphMutations.ts          # TanStack: CRUD mutations
└── __tests__/
    ├── GraphFilterPanel.test.tsx
    ├── NodeInspector.test.tsx
    └── useGraphExplorerStore.test.ts

e2e-puppeteer/specs/
└── graph-explorer.spec.ts            # Full E2E with DB verification
```

---

## 12. Implementation Progress

| File | Status | Notes |
|------|--------|-------|
| `wireframes-v2/pages/graph-explorer.html` | ✅ Done | Static wireframe reference |
| `wireframes-v2/assets/nav.js` | ✅ Done | Nav entry added |
| `docs/graph-explorer-design.md` | ✅ Done | This file |
| `src/features/graph-explorer/types.ts` | ✅ Done | |
| `src/features/graph-explorer/hooks/useGraphExplorerStore.ts` | ✅ Done | |
| `src/features/graph-explorer/hooks/useGraphExplorerData.ts` | ✅ Done | |
| `src/features/graph-explorer/hooks/useGraphMutations.ts` | ✅ Done | |
| `src/features/graph-explorer/components/GraphExplorerCanvas.tsx` | ✅ Done | |
| `src/features/graph-explorer/components/GraphExplorerToolbar.tsx` | ✅ Done | |
| `src/features/graph-explorer/components/ZoomControls.tsx` | ✅ Done | |
| `src/features/graph-explorer/components/GraphContextMenu.tsx` | ✅ Done | |
| `src/features/graph-explorer/components/GraphFilterPanel.tsx` | ✅ Done | |
| `src/features/graph-explorer/components/NodeInspector.tsx` | ✅ Done | |
| `src/features/graph-explorer/components/EdgeInspector.tsx` | ✅ Done | |
| `src/features/graph-explorer/components/AddNodeDialog.tsx` | ✅ Done | |
| `src/features/graph-explorer/components/AddEdgeDialog.tsx` | ✅ Done | |
| `src/features/graph-explorer/GraphExplorerPage.tsx` | ✅ Done | |
| `src/routes.tsx` | ✅ Done | |
| `src/components/layout/Sidebar.tsx` | ✅ Done | |
| `src/components/common/CommandPalette.tsx` | ✅ Done | |
| `e2e-puppeteer/specs/graph-explorer.spec.ts` | ✅ Done | |

---

## 13. Testing Strategy

### Unit Tests (Vitest + Testing Library)
- `GraphFilterPanel` — preset click hides/shows nodes, filter count badge updates
- `NodeInspector` — form renders with task data, apply button fires mutation
- `useGraphExplorerStore` — preset selection updates all filter slices

### E2E Tests (Puppeteer)
Four-phase pattern matching existing `task-crud.spec.ts`:
1. **Seed**: POST test nodes + edges via API
2. **UI**: Navigate to `/graph-explorer`, verify canvas renders, node count matches API
3. **Interact**: Filter panel toggles hide/show nodes, select node opens inspector, edit field + apply → PATCH → verify in DB
4. **CRUD**: Create node via dialog → appears in canvas → DB vertex present; delete node → absent
5. **Teardown**: DELETE all seeded data

---

## 14. Key Constraints

1. **No stubs or fake data** — all API calls are real
2. **CSS tokens only** — no hardcoded hex colors in React components
3. **Cytoscape destroyed on unmount** — prevent memory leaks
4. **Client-side filtering** — `ele.hide()` / `ele.show()` for instant UX without refetch
5. **Auth via `localStorage.getItem('gc-access-token')`** — same pattern as existing hooks
6. **Query key: `['graph-explorer', ...]`** — separate namespace from existing graph queries
