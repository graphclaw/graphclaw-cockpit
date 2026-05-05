# GraphClaw Cockpit — React Implementation Plan

## Context

The GraphClaw Cockpit has a complete backend API (131 routes, 1451 tests) and 26 wireframe pages (Phase A–G) with a full design token system. This plan converts those wireframes into a production React SPA wired to the backend FastAPI gateway. The user prefers methodical wave-based delivery with tests at each stage and `build-plan.md` as the source of truth.

---

## Software Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | React 19 + TypeScript 5.x strict | PRD §10 requirement |
| **Build** | Vite 6 | Fast HMR, native ESM, TS out-of-box |
| **UI Primitives** | shadcn/ui (Radix UI + Tailwind CSS 4) | Accessible, themeable, composable |
| **Graph Visualization** | Cytoscape.js + cytoscape-dagre | Goal/Project/Dep/Resource/Timeline views — large graph perf, native layout algorithms |
| **Canvas Editor** | React Flow (@xyflow/react) | Drag-and-drop workflow builder with custom node types |
| **API Client** | openapi-fetch + openapi-typescript | Typed fetch from `/openapi.json`, zero codegen runtime |
| **Server State** | TanStack Query v5 | Cache, pagination, optimistic updates, SSE invalidation |
| **Client State** | Zustand v5 | Theme, sidebar, selected entities, undo/redo, filters |
| **Code Editor** | @monaco-editor/react | Profile, memory, skills, guardrails XML, config JSON |
| **Routing** | React Router v7 | Nested layouts, lazy loading, protected routes |
| **Real-Time** | EventSource (SSE) + WebSocket (chat) | SSE at `/app/v1/events`, WS at `/app/v1/chat/ws` |
| **Charts** | Recharts | Bar, line, pie, area charts for Agent Monitor / Admin |
| **Markdown** | react-markdown + remark-gfm | Chat message rendering, briefing display |
| **Forms** | React Hook Form + Zod | Validation for settings, admin config, secrets |
| **Date/Time** | date-fns | Lightweight, tree-shakeable |
| **Icons** | Lucide React | Matches wireframe icon set |
| **Testing** | Vitest + React Testing Library + MSW 2.x | Unit/component tests, API mocking |
| **E2E** | Playwright | Cross-browser integration tests |
| **Lint/Format** | ESLint 9 (flat config) + Prettier | Strict TypeScript rules |

---

## Testing Framework Alignment (2026-05)

This build plan now follows the unified testing harness documented in:
- `TESTING.md`
- `docs/testing/test-strategy.md`
- `docs/testing/contributing-tests.md`
- `../graphclaw/docs/testing/master-strategy.md`

### Required test layers for cockpit work

| Layer | Scope | Location | Gate |
|-------|-------|----------|------|
| **L1 Unit** | Pure logic/helpers | co-located `*.test.ts(x)` | Every PR |
| **L2 Component** | React rendering/interaction | co-located `*.test.tsx` with `renderWithProviders` | Every PR |
| **L3 Contract** | MSW handlers vs OpenAPI | `src/test/contract/handlers.contract.test.ts` | Every PR |
| **L5 E2E** | Browser journeys | `e2e/**/*.spec.ts` (Playwright + Docker) | Every PR |

### Wave-level testing rules

For every requirement-sized implementation (for example `M-F-2`):
1. Add/update tests in the correct layer(s) from the table above.
2. Use frontend test conventions from `docs/testing/test-strategy.md`:
  - `renderWithProviders` for component tests,
  - MSW handler updates when API calls change,
  - Playwright fixtures and accessible locator priority for E2E.
3. Add/maintain test file headers and test IDs for any new tests.
4. Update inventory indexes (`src/test/inventory.md`, `e2e/inventory.md`) after adding tests.
5. Run focused tests during development, then run quality gate before commit.

### Commit quality gate (cockpit)

Required before each requirement commit:
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run test:e2e` (targeted spec(s) for changed flows)

Coverage baseline remains 60% for lines/branches/functions/statements and increases each release.

---

## Project Directory Structure

```
graphclaw-cockpit/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── Dockerfile                    # Multi-stage production build
├── .dockerignore
├── docker-compose.yml            # Cockpit + backend full-stack E2E
├── nginx.conf                    # Production nginx config (SPA routing + API proxy)
├── playwright.config.ts          # Playwright E2E configuration
├── .env.development              # VITE_API_URL=http://localhost:8000
├── .env.production               # VITE_API_URL=/api
├── .env.example                  # Documented env vars for contributors
├── CLAUDE.md                     # Claude Code project context
├── public/
│   └── logo.png
├── src/
│   ├── main.tsx                  # React root + providers
│   ├── app.tsx                   # Router + layout
│   ├── routes.tsx                # Route definitions (lazy)
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (button, input, badge, etc.)
│   │   ├── layout/               # AppShell, Sidebar, Topbar, BottomNav
│   │   ├── common/               # DataTable, KpiCard, CodeEditor, CommandPalette
│   │   └── feedback/             # Toast, Skeleton, EmptyState, ErrorBoundary
│   │
│   ├── features/
│   │   ├── auth/                 # Login redirect, callback, AuthProvider, guards
│   │   ├── graph/                # Goal/Project/Resource/Timeline views, Cytoscape
│   │   ├── tasks/                # MyTasks table, TaskDetail panel, filters
│   │   ├── agent/                # AgentMonitor dashboard, sub-agent pool
│   │   ├── scoring/              # ScoreExplainer, ScoreHistory, Simulator
│   │   ├── canvas/               # Canvas Editor (React Flow), node types
│   │   ├── skills/               # Skill Marketplace, install/uninstall
│   │   ├── mcp/                  # MCP Registry, trust tiers, approvals
│   │   ├── intelligence/         # Intelligence Hub (profile, memory, skills)
│   │   ├── chat/                 # Chat sidebar/fullpage, WebSocket manager
│   │   ├── settings/             # 6 settings sub-pages
│   │   └── admin/                # 9 admin modules
│   │
│   ├── hooks/                    # useSSE, useWebSocket, useTheme, useSidebar, etc.
│   ├── lib/
│   │   ├── api-client.ts         # openapi-fetch instance + auth interceptor
│   │   ├── query-client.ts       # TanStack Query client config
│   │   ├── sse.ts                # SSE manager with TQ cache invalidation
│   │   ├── websocket.ts          # WebSocket manager (chat)
│   │   └── utils.ts              # Shared helpers
│   │
│   ├── stores/
│   │   ├── theme.ts              # Theme + sidebar collapse (persisted)
│   │   ├── auth.ts               # Auth state (tokens, user, role)
│   │   ├── graph.ts              # Selected nodes, undo/redo stack
│   │   └── filters.ts            # Saved filter presets
│   │
│   ├── styles/
│   │   ├── globals.css           # Tailwind directives + CSS custom properties
│   │   └── themes.css            # 6 theme definitions (from wireframe tokens)
│   │
│   └── test/
│       ├── setup.ts              # Vitest global setup
│       ├── handlers.ts           # MSW request handlers
│       ├── server.ts             # MSW server instance
│       └── utils.tsx             # renderWithProviders helper
│
├── e2e/                          # Playwright E2E tests (see §E2E Test Scenarios)
│   ├── global/
│   │   ├── navigation.spec.ts
│   │   ├── theme-toggle.spec.ts
│   │   └── auth-flow.spec.ts
│   ├── graph/
│   │   ├── goal-view.spec.ts
│   │   ├── my-tasks.spec.ts
│   │   ├── project-view.spec.ts
│   │   ├── timeline-view.spec.ts
│   │   ├── task-detail.spec.ts
│   │   └── resource-view.spec.ts
│   ├── agent/
│   │   ├── agent-monitor.spec.ts
│   │   └── scoring.spec.ts
│   ├── chat/
│   │   ├── chat-sidebar.spec.ts
│   │   └── chat-fullpage.spec.ts
│   ├── settings/
│   │   ├── channels.spec.ts
│   │   ├── llm-providers.spec.ts
│   │   ├── scoring-weights.spec.ts
│   │   └── a2a-keys.spec.ts
│   ├── marketplace/
│   │   ├── skill-marketplace.spec.ts
│   │   └── mcp-registry.spec.ts
│   ├── canvas/
│   │   └── canvas-editor.spec.ts
│   ├── intelligence/
│   │   └── intelligence-hub.spec.ts
│   ├── admin/
│   │   └── admin-panel.spec.ts
│   └── fixtures/
│       ├── auth.fixture.ts       # Authenticated page fixture
│       └── seed-data.ts          # API seed helpers for test data
│
├── .claude/
│   ├── agents/
│   │   ├── cockpit-builder.md    # React component builder agent
│   │   ├── cockpit-tester.md     # Playwright E2E test runner
│   │   └── cockpit-reviewer.md   # Code review + wireframe fidelity
│   └── skills/
│       ├── cockpit-react-patterns/SKILL.md    # React/TS patterns for cockpit
│       ├── cockpit-api-integration/SKILL.md   # openapi-fetch + TanStack Query
│       ├── cockpit-playwright-e2e/SKILL.md    # Playwright E2E conventions
│       └── cockpit-docker-deploy/SKILL.md     # Docker build + compose patterns
│
├── docs/
│   ├── prd/                      # Existing PRDs 00-15
│   │   └── 16-react-implementation.md  # NEW: React impl PRD
│   ├── design-plan.md            # Existing (add React build phases)
│   └── e2e-test-scenarios.md     # NEW: Complete Playwright test catalog
│
└── wireframes-v2/                # Existing wireframes (reference only)
```

---

## Wave Delivery Plan

### Wave 1 — Project Scaffold + Design System
**Goal:** Vite project boots, Tailwind configured, shadcn/ui installed, design tokens ported, theme system working.

**Scope:**
- Initialize Vite + React 19 + TypeScript strict
- Configure Tailwind CSS 4 with wireframe design tokens as theme extension
- Port 6 themes from `wireframes-v2/assets/tokens.css` → `src/styles/themes.css` as CSS custom properties
- Install shadcn/ui, configure base components (Button, Input, Badge, Card, Select, Checkbox, Toggle, Tabs)
- Zustand theme store with localStorage persistence
- Theme picker component (6 themes)
- ESLint 9 flat config + Prettier
- Path aliases (`@/` → `src/`)

**Key files:**
- `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- `src/styles/globals.css`, `src/styles/themes.css`
- `src/stores/theme.ts`
- `src/components/ui/` (shadcn primitives)

**Tests:** Vitest setup, theme store unit tests, component smoke tests
**Deliverable:** `npm run dev` serves a page with theme picker cycling all 6 themes

**Checklist:**
- ☐ `npm create vite@latest` with React-TS template
- ☐ TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess: true`)
- ☐ Tailwind CSS 4 + `@tailwindcss/vite`
- ☐ shadcn/ui init + 10 base components
- ☐ Port design tokens (colors, spacing, typography, shadows, radii)
- ☐ Port 6 theme definitions to `themes.css`
- ☐ Zustand theme store (theme + sidebarCollapsed)
- ☐ Theme picker dropdown component
- ☐ ESLint + Prettier config
- ☐ Vitest config + first test passing

---

### Wave 2 — API Client + Auth Flow + MSW
**Goal:** Typed API client connected to backend OpenAPI spec, auth flow working, MSW mocking for all development.

**Scope:**
- Generate TypeScript types from backend `/openapi.json` using `openapi-typescript`
- Configure `openapi-fetch` client with base URL and auth header injection
- TanStack Query client with defaults (staleTime, retry, error handling)
- Auth flow: OAuth redirect → callback → JWT storage → auto-refresh
- Protected route wrapper (`<RequireAuth>`)
- Dev token shortcut (`POST /auth/dev-token` in development)
- MSW 2.x setup with handlers for core endpoints
- RFC 7807 error parser utility
- **Backend change:** Add `CORSMiddleware` to `gateway/app.py`

**Key files:**
- `src/lib/api-client.ts`, `src/lib/query-client.ts`
- `src/features/auth/` (AuthProvider, LoginPage, CallbackPage, guards)
- `src/stores/auth.ts`
- `src/test/handlers.ts`, `src/test/server.ts`

**Backend dependency:** CORS middleware must be added
**Tests:** Auth flow unit tests, API client tests with MSW, error handling tests
**Deliverable:** User can click "Login" → redirect to OAuth → callback → see authenticated state. Dev mode: auto-login via dev-token.

**Checklist:**
- ☐ `npx openapi-typescript http://localhost:8000/openapi.json -o src/lib/api-types.ts`
- ☐ openapi-fetch client with Bearer token injection
- ☐ TanStack QueryClient config (staleTime: 30s, retry: 2)
- ☐ Zustand auth store (user, role, isAuthenticated)
- ☐ AuthProvider with auto-refresh (14 min timer)
- ☐ `<RequireAuth>` route guard
- ☐ Login page with provider buttons (Google, GitHub, Microsoft)
- ☐ OAuth callback handler
- ☐ MSW handlers for /auth/* + 5 sample endpoints
- ☐ RFC 7807 error parser + toast integration
- ☐ **Backend:** Add CORSMiddleware (allow cockpit origin, credentials: true)

---

### Wave 3 — App Shell + Navigation + Routing
**Goal:** Full app layout with collapsible sidebar, topbar, responsive shell, all routes stubbed.

**Scope:**
- AppShell component (sidebar + main area)
- Sidebar: collapsible (240px ↔ 56px), 3 sections (Workspace, Intelligence, Admin), icon rail, active state tracking, Zustand persistence
- Topbar: breadcrumbs, search input, notifications bell, theme picker, avatar
- Bottom nav for mobile (<768px)
- React Router v7 with all routes defined (lazy-loaded)
- Route-level code splitting (`React.lazy` + `Suspense`)
- Error boundary at route level
- Command palette (Cmd+K) for quick navigation
- Skeleton page placeholders for all unbuilt routes

**Key files:**
- `src/app.tsx`, `src/routes.tsx`
- `src/components/layout/` (AppShell, Sidebar, Topbar, BottomNav)
- `src/components/common/CommandPalette.tsx`
- `src/hooks/useSidebar.ts`

**Tests:** Sidebar collapse toggle, route rendering, responsive breakpoint behavior, keyboard navigation
**Deliverable:** Full navigation shell — click any nav item → loads skeleton page, sidebar collapses, theme switches, responsive at all breakpoints.

**Checklist:**
- ☐ AppShell flex layout (sidebar + main-layout)
- ☐ Sidebar with nav sections, icons (Lucide), active state from route
- ☐ Sidebar collapse animation + localStorage persistence
- ☐ Topbar with breadcrumb auto-generation from route
- ☐ Bottom nav (mobile) with 5 primary destinations
- ☐ React Router v7 route tree (all 22+ routes, lazy loaded)
- ☐ Settings sub-navigation (nested layout)
- ☐ Intelligence Hub sub-navigation (nested layout)
- ☐ Admin panel sub-navigation (nested layout)
- ☐ Command palette (Cmd+K / Ctrl+K)
- ☐ Route-level ErrorBoundary + Suspense fallback
- ☐ Responsive tests at 3 breakpoints

---

### Wave 4 — Graph Views + Task Management
**Goal:** Core graph visualization with Cytoscape.js, all 5 graph views, task table with virtual scroll, task detail panel.

**Scope:**
- Cytoscape.js integration with React wrapper
- Goal View (default landing): hierarchical DAG layout (dagre)
- Project View: expanded goal tree with edge types
- Dependency Graph View: left-to-right DAG, color-coded edges, blocked chain highlight
- Resource View: group-by-assignee layout
- Timeline View: horizontal time axis (Gantt-style using Cytoscape or Recharts)
- View switcher (Graph / Table / Dependencies)
- Custom Cytoscape node renderers: color = state, size = priority score, icon = type
- Custom edge styles: relationship type → dash pattern/color
- Node interactions: click select, double-click edit, right-click context menu, lasso multi-select
- Minimap component
- Task Table view: virtual scrolling (TanStack Virtual), 14 columns, multi-sort, cursor pagination
- Task Detail side panel: 9 collapsible sections
- Saved filter presets (Zustand + localStorage)

**Key files:**
- `src/features/graph/` (GoalView, ProjectView, DependencyView, ResourceView, TimelineView)
- `src/features/graph/components/` (CytoscapeGraph, NodeRenderer, EdgeRenderer, Minimap)
- `src/features/tasks/` (TaskTable, TaskDetail, FilterBar, SavedFilters)
- `src/stores/graph.ts`, `src/stores/filters.ts`

**API integrations:** ~15 endpoints (graph goals, tasks CRUD, edges, resources, scoring, state transitions)
**Tests:** Cytoscape render tests, view switching, task CRUD operations, filter/sort logic, virtual scroll
**Deliverable:** User sees full graph visualizations, can switch views, browse/filter tasks in table, open task detail, perform state transitions.

**Checklist:**
- ☐ Cytoscape.js + cytoscape-dagre + React wrapper component
- ☐ Goal View (hierarchical DAG, default landing)
- ☐ Project View (expanded tree)
- ☐ Dependency Graph View (LTR flow, blocked chain highlighting)
- ☐ Resource View (group by assignee)
- ☐ Timeline View — Hierarchical Gantt (wireframe: `wireframes-v2/pages/timeline-gantt.html`, full spec in Wave 4b)
- ☐ View switcher (segmented control)
- ☐ Custom node rendering (state color, priority size, type icon)
- ☐ Custom edge rendering (type-based styling)
- ☐ Click, double-click, right-click, lasso multi-select
- ☐ Minimap
- ☐ Task Table with TanStack Virtual (1000+ row scrolling)
- ☐ 14 sortable/filterable columns
- ☐ Cursor-based pagination integration
- ☐ Task Detail side panel (9 sections)
- ☐ State transition buttons with valid-transition check
- ☐ Saved filter presets (6 built-in + custom)
- ☐ Zustand graph store (selected nodes, undo stack)

---

### Wave 4b — Timeline Hierarchical Gantt View

**Wireframe:** `wireframes-v2/pages/timeline-gantt.html`
**Route:** `/workspace/timeline`
**Goal:** Replace the stub TimelinePage with a fully interactive hierarchical Gantt chart showing Goals → Composite Tasks → Atomic Tasks on a time axis, with synchronized scroll, zoom, filters, dependency arrows, and full 6-theme support.

---

#### Design Requirements

**DR-1 — Left Panel (Hierarchy Tree)**
- Fixed 320px width; scrolls vertically only (no horizontal scroll)
- Three-level hierarchy: Goal → Composite Task → Atomic Task
- Row heights: Goal = 40px (bold, `var(--bg-surface-alt)` background); Task = 44px
- Indentation: `depth × 20px` left padding
- Each row: chevron expand/collapse toggle, status dot (state color), emoji type icon, task title, assignee avatar
- Undated tasks: `opacity: 0.55`, no Gantt bar rendered (row still appears in left panel)
- Collapse state persisted in Zustand (`expandedIds: Set<string>`)

**DR-2 — Gantt Area (Time Axis)**
- Sticky 68px header: top row 30px (month labels), bottom row 38px (day numbers)
- Day column widths by zoom level: Week = 56px, Month = 28px, Quarter = 8px
- Vertical grid lines at each day; heavier line at month boundaries
- Today line: 2px solid `var(--brand-primary)`, full height, labeled "Today"
- Weekend columns: `var(--bg-inset)` background tint
- Horizontal scroll independent from left panel; vertical scroll synchronized with left panel
- Minimum visible range: 90 days; extends dynamically to cover all task dates + 14-day padding

**DR-3 — Task Bars**
- Height: 24px; border-radius: `var(--radius-md)`
- State-based colors (all via CSS custom properties):
  - `ACTIVE` → `var(--brand-primary)` gradient
  - `IN_PROGRESS` → `var(--status-success)` gradient
  - `BLOCKED` → `var(--status-error)` gradient
  - `DELAYED` → `var(--status-warning)` gradient
  - `IN_REVIEW` → `var(--status-info)` gradient
  - `DONE` / `COMPLETE` → `var(--text-tertiary)` at 60% opacity
  - `PENDING` / `NOT_STARTED` → `var(--bg-muted)` at 50% opacity
- Progress fill: darker inner fill proportional to `progress` field (0–100)
- Hover: tooltip appears above bar (see DR-9)

**DR-4 — Goal and Composite Bracket Bars**
- Goal bracket: 8px tall, `var(--brand-primary)` at 25% opacity, full-width spanning all child task dates, with angled end-caps
- Composite task bracket: 6px tall, `var(--text-tertiary)` at 35% opacity, spanning child task dates, with end-caps
- Both bars sit centered in their row's gantt cell

**DR-5 — Milestones**
- Tasks with `type === 'MILESTONE'` or zero duration: render as 14px diamond (rotated square)
- Hover: scale to 1.3× with tooltip
- Color follows state rules (DR-3)

**DR-6 — Dependency Arrows**
- Rendered as SVG overlay on the Gantt area
- Dashed curved path from predecessor bar end to successor bar start
- Color: `var(--status-error)` for BLOCKED dependencies; `var(--border-default)` for all others
- Arrows only visible when both tasks are currently expanded/visible

**DR-7 — Toolbar**
- Zoom controls: `Week` / `Month` / `Quarter` segmented buttons; active = `var(--brand-primary)` fill
- Date navigation: `←` / `→` buttons to shift view by one zoom-period
- Filter chips (4): `All` / `Active` / `Blocked` / `Delayed` — toggleable, multi-select
- `Collapse All` / `Expand All` buttons
- `⛶ Fullscreen` toggle
- Today button to re-center view on current date

**DR-8 — Legend**
- Horizontal strip at bottom of the page (outside scroll area)
- Shows state color swatches: Active, In Progress, Blocked, Delayed, In Review, Done, Pending
- Shows bracket icons for Goal / Composite
- Shows milestone diamond icon

**DR-9 — Tooltips**
- Appear above the hovered bar, min-width 220px
- Contents: task title, state badge, dates (start → end), progress %, assignee, priority score
- Z-index above SVG arrows; dismiss on mouse-leave

**DR-10 — Synchronized Vertical Scroll**
- Left panel and Gantt area share vertical scroll position
- Implemented via `onScroll` refs with a `syncing` boolean guard to prevent scroll event loops
- Both containers have `overflow-y: auto`; outer wrapper `overflow: hidden`

**DR-11 — Date Resolution**
- Start date: `started_at` → fallback to `created_at`
- End date: `deadline` → fallback to `started_at + estimated_effort_days` → fallback to `started_at + 7 days`
- Tasks with no resolvable start date: rendered greyed in left panel, no bar in Gantt

**DR-12 — Theme Safety**
- Zero hardcoded hex or RGB values in component styles
- All colors via `var(--*)` CSS custom properties
- Must pass visual inspection on all 6 themes: `light`, `dark`, `solarized-light`, `solarized-dark`, `midnight`, `high-contrast`
- Do NOT use any third-party Gantt library (all use hardcoded colors)

---

#### Architecture Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| AD-1 | Custom CSS Grid + SVG rendering (no library) | Only approach compatible with `var(--*)` 6-theme system |
| AD-2 | `date-fns` for date math (`npm install date-fns`) | Tree-shakeable; already in `package.json` planned deps |
| AD-3 | New Zustand store `src/stores/timeline.ts` | Isolates Gantt state (zoom, range, expansion) from graph store |
| AD-4 | New `useGoalTree(goalId, depth?)` hook | Fetches `GET /app/v1/graph/goals/{id}/tree?depth=5` per goal |
| AD-5 | `src/features/graph/timeline/` subdirectory | Isolates Gantt sub-components from other graph views |

---

#### Implementation Phases

**Phase 1 — Foundation (data layer)**

New files:
- `src/features/graph/timeline/types.ts` — `TimelineRow`, `GanttBar`, `DependencyEdge`, `ZoomLevel`, `ActiveFilter` TypeScript interfaces
- `src/features/graph/timeline/date-utils.ts` — `resolveTaskDates()`, `computeViewRange()`, `dayOffset()`, `formatDayHeader()`, `formatMonthHeader()`, `isWeekend()` using `date-fns`
- `src/stores/timeline.ts` — Zustand store: `zoom: ZoomLevel`, `viewStart: Date`, `viewEnd: Date`, `expandedIds: Set<string>`, `selectedRowId: string | null`, `activeFilters: ActiveFilter[]`; actions: `setZoom`, `shiftView`, `toggleExpand`, `expandAll`, `collapseAll`, `setFilters`

Modified files:
- `src/lib/api-hooks.ts` — Add `GoalTreeResponse` interface and `useGoalTree(goalId: string, depth?: number)` hook calling `GET /app/v1/graph/goals/{goalId}/tree?depth={depth}`
- `src/features/graph/timeline/useTimelineData.ts` — Composes `useGoals()` + multiple `useGoalTree()` calls; flattens into `TimelineRow[]`; resolves dates via `date-utils`; handles expand/collapse visibility

**Phase 2 — Components**

New files:
- `src/features/graph/timeline/TimelineToolbar.tsx` — Zoom buttons, date nav arrows, filter chips, collapse/expand all, today button
- `src/features/graph/timeline/TimelineLeftPanel.tsx` — Virtualized list of rows; indent, chevron, status dot, emoji icon, title, avatar; synced scroll ref
- `src/features/graph/timeline/TimelineGanttArea.tsx` — Sticky header (month + day labels, today marker, weekend tint); row cells with bar positioning via CSS `left` + `width` from `dayOffset()`; synced scroll ref
- `src/features/graph/timeline/TimelineBarTooltip.tsx` — Floating tooltip with Radix Tooltip or custom portal
- `src/features/graph/timeline/TimelineDependencyArrows.tsx` — SVG overlay; computes bezier paths from visible bars
- `src/features/graph/timeline/TimelineLegend.tsx` — Bottom strip with state swatches, bracket icons, diamond icon

**Phase 3 — Page Assembly**

Modified file:
- `src/features/graph/TimelinePage.tsx` — Rewrite: mount `TimelineToolbar`, horizontal flex container with `TimelineLeftPanel` + `TimelineGanttArea` + SVG overlay, `TimelineLegend`; wire scroll sync via `useRef` callbacks; loading skeleton (left panel shimmer + gantt bar shimmer); empty state (no goals with dates); error boundary

**Phase 4 — E2E Tests (Playwright)**

New file: `e2e/graph/timeline-view.spec.ts`
Test cases: see TS-05 table below

**Phase 5 — Unit Tests (Vitest)**

New files:
- `src/features/graph/timeline/date-utils.test.ts` — Known-answer tests for `resolveTaskDates()`, `dayOffset()`, `computeViewRange()`
- `src/features/graph/timeline/useTimelineData.test.ts` — MSW-mocked hook test
- `src/stores/timeline.test.ts` — Zustand store action tests

---

#### New Files Summary

| File | Type | Description |
|------|------|-------------|
| `src/features/graph/timeline/types.ts` | NEW | TypeScript interfaces for all timeline data |
| `src/features/graph/timeline/date-utils.ts` | NEW | date-fns wrappers for Gantt date math |
| `src/features/graph/timeline/useTimelineData.ts` | NEW | Composite data hook |
| `src/features/graph/timeline/TimelineToolbar.tsx` | NEW | Zoom / filter / nav toolbar |
| `src/features/graph/timeline/TimelineLeftPanel.tsx` | NEW | Hierarchy tree left panel |
| `src/features/graph/timeline/TimelineGanttArea.tsx` | NEW | Time axis + bars area |
| `src/features/graph/timeline/TimelineBarTooltip.tsx` | NEW | Hover tooltip |
| `src/features/graph/timeline/TimelineDependencyArrows.tsx` | NEW | SVG dependency arrows |
| `src/features/graph/timeline/TimelineLegend.tsx` | NEW | Legend strip |
| `src/stores/timeline.ts` | NEW | Zustand store for timeline view state |
| `src/features/graph/timeline/date-utils.test.ts` | NEW | Unit tests for date-utils |
| `src/features/graph/timeline/useTimelineData.test.ts` | NEW | Unit tests for data hook |
| `src/stores/timeline.test.ts` | NEW | Unit tests for store |
| `e2e/graph/timeline-view.spec.ts` | NEW | Playwright E2E spec |
| `src/features/graph/TimelinePage.tsx` | MODIFY | Rewrite as hierarchical Gantt |
| `src/lib/api-hooks.ts` | MODIFY | Add `GoalTreeResponse` + `useGoalTree` |
| `package.json` | MODIFY | Verify `date-fns ^4.1.0` is installed |

---

#### Checklist

- ☐ Install / verify `date-fns` (`npm install date-fns`)
- ☐ `src/features/graph/timeline/types.ts` — TimelineRow, GanttBar, DependencyEdge, ZoomLevel interfaces
- ☐ `src/features/graph/timeline/date-utils.ts` — resolveTaskDates, dayOffset, computeViewRange, isWeekend
- ☐ `src/lib/api-hooks.ts` — GoalTreeResponse interface + useGoalTree hook
- ☐ `src/stores/timeline.ts` — zoom, viewStart/End, expandedIds, activeFilters, all actions
- ☐ `src/features/graph/timeline/useTimelineData.ts` — composited hook returning TimelineRow[]
- ☐ `src/features/graph/timeline/TimelineToolbar.tsx` — zoom, date nav, filter chips, today, collapse all
- ☐ `src/features/graph/timeline/TimelineLeftPanel.tsx` — hierarchy rows, status dot, avatar, scroll ref
- ☐ `src/features/graph/timeline/TimelineGanttArea.tsx` — sticky header, day/month labels, today line, weekend tint, bars
- ☐ `src/features/graph/timeline/TimelineBarTooltip.tsx` — hover tooltip (title, state, dates, progress, assignee)
- ☐ `src/features/graph/timeline/TimelineDependencyArrows.tsx` — SVG bezier arrows (blocked=red, normal=grey)
- ☐ `src/features/graph/timeline/TimelineLegend.tsx` — state swatches, bracket icons, diamond
- ☐ `src/features/graph/TimelinePage.tsx` — rewired with scroll sync, loading/empty/error states
- ☐ Goal bracket bars (8px, brand-primary 25%)
- ☐ Composite bracket bars (6px, text-tertiary 35%)
- ☐ Task bars (24px, state-color gradient, progress fill)
- ☐ Milestone diamond rendering (14px, hover scale)
- ☐ Zoom levels: Week (56px/day), Month (28px/day), Quarter (8px/day)
- ☐ Today line at correct date offset
- ☐ Undated tasks: greyed left panel row, no Gantt bar
- ☐ Vertical scroll sync (left panel ↔ gantt area, syncing-flag guard)
- ☐ DR-12: zero hardcoded colors — all `var(--*)`
- ☐ `e2e/graph/timeline-view.spec.ts` — 9 Playwright test cases
- ☐ `src/features/graph/timeline/date-utils.test.ts` — unit tests
- ☐ `src/stores/timeline.test.ts` — store action tests

---

### Wave 5 — Agent Monitor + Scoring + Explainability  *(SUPERSEDED by Wave M — see below)*

> **Status: Superseded 2026-05-03.** This wave shipped a stub
> (`src/features/agent/AgentMonitorPage.tsx`, `src/features/scoring/ScoreExplainer.tsx`).
> Full Agent Monitor v2 is delivered by **Wave M**, which retires Wave 5 stubs
> in M-A-0 and replaces them with a 7-panel design under
> `src/features/agent-monitor/`. Reusable bits (`useAgentData`, `ScoreExplainer`)
> are migrated, not deleted.
>
> Reference docs: [`docs/agent/`](docs/agent/README.md),
> [`docs/prd/03-agent-monitor.md`](docs/prd/03-agent-monitor.md),
> [`wireframes-v2/pages/agent-monitor-v2.html`](wireframes-v2/pages/agent-monitor-v2.html).

~~**Goal:** Agent monitoring dashboard, scoring inspector, and explainability views.~~

~~**Scope:**~~
- ~~Agent Monitor dashboard: KPI strip (4 cards), agent cards grid, event log table~~
- ~~Agent status badges with pulse animations~~
- ~~Sparkline heartbeat bars per agent~~
- ~~Action queue inspector: ranked table with score details~~
- ~~Trigger schedule view: upcoming triggers table + "Fire Now"~~
- ~~Sub-agent pool monitor: runner pool utilization, delegations, dispatch plan swim lanes~~
- ~~Score explanation panel: 7-factor breakdown table, NL summary~~
- ~~Score history timeline chart (Recharts) with annotations~~
- ~~Score simulator ("what if" parameter sliders)~~
- ~~Recharts integration for all chart types (bar, line, area, pie)~~

~~**Key files:**~~
- ~~`src/features/agent/` (AgentDashboard, AgentCard, ActionQueue, TriggerSchedule, SubAgentPool)~~
- ~~`src/features/scoring/` (ScoreExplainer, ScoreHistory, ScoreSimulator)~~
- ~~`src/components/common/KpiCard.tsx`, `src/components/common/SparklineBar.tsx`~~

---

### Wave M — Agent Monitor v2 (Cockpit + Gateway)
**Status:** M-F-2 complete; M-E-2 blocked (missing resume endpoint); M-G-1 next (2026-05-05)
**Goal:** 7-panel tabbed Agent Monitor matching `wireframes-v2/pages/agent-monitor-v2.html`, built around plain-language summaries for the non-technical primary user.

**Scope:** see [`docs/agent/02-wave-plan.md`](docs/agent/02-wave-plan.md) for full sub-requirement detail.

**Phase A (cockpit + minimal backend):**
- M-A: Foundation, Wave 5 retirement, navigation shell (7-panel left-nav, URL routing, sidebar badge, attention strip, shared empty/loading/error states, responsive guards)
- M-B: Overview panel (4 KPI cards, today's glance strip, live SSE ticker with localStorage bridge)
- M-E: Scheduling panel (next run card, trigger list, Run Now)
- M-F: Skills panel (worker pool bar + mini-cards + recent jobs with friendly errors)
- M-G: Scoring panel (task table + 7-factor breakdown + What-if Simulator)
- M-H: Agents panel (pool KPIs + dispatch swim-lanes + heartbeat timeline; hidden when pool=0)

**Phase B (requires gateway changes):**
- M-C: Activity panel (full historical via `/agent/activity`, session grouping)
- M-D: Comms panel (bilateral inbound/outbound via `/tasks/inbound-log` + `/tasks/outbound-log`)
- Gateway B-1: Extend `AgentToolCallEvent` + wire across 5 agent files
- Gateway B-2: `agent_session_log` Postgres table
- Gateway B-3: `GET /agent/activity` (MinIO NDJSON reader + plain-language formatter)
- Gateway B-4: `GET /agent/sessions`
- Gateway B-5: `GET /comms/summary`
- Gateway B-6: `GET /tasks/inbound-log` + `GET /tasks/outbound-log`
- Gateway B-7: Fix MinIO write race (per-process file suffix)
- Gateway B-8: Verify or add `POST /scoring/simulate`
- Gateway B-9: Verify or add `GET /agents/delegations`

**Phase C (deferred):** token/cost drill-down, MinIO retention, structured log viewer, session trace waterfall, LLM Cost Monitor.

**Key files (cockpit):**
- `src/features/agent-monitor/` (new — page, hooks, components, lib)
- `src/app/routes.tsx` (add `/agent-monitor/:section` and `/agent-monitor/comms/:tab`)
- `src/components/layout/Sidebar.tsx` (active state + badge)
- `src/styles/themes.css` (channel badge tokens, heartbeat segment tokens)
- `docs/prd/03-agent-monitor.md` (reconciled to v2)

**Key files (gateway — graphclaw repo):**
- `src/graphclaw/infra/logging/events.py` (extend `AgentToolCallEvent`)
- `src/graphclaw/infra/logging/handlers/object_storage.py` (race fix)
- `src/graphclaw/agent/{main_orchestrator,sub_agent_runner,comms_agent,inbound_agent,outbound_agent}.py` (tool call logging)
- `src/graphclaw/agent/loop.py` (session log writer)
- `src/graphclaw/agent/activity_formatter.py` (new — plain-language event formatter)
- `src/graphclaw/api/{agent_activity,comms,tasks}.py` (new endpoints)
- `migrations/<next>_agent_session_log.sql` (new table)

**API integrations:** ~20 endpoints total (16 existing + 4 new).
**Tests:** unit/component (Vitest + RTL), contract (MSW vs OpenAPI), and E2E (Playwright) per panel, with inventory + header maintenance per `TESTING.md`.

**Checklist:**
- [x] M-A-0: Wave 5 retirement (move `useAgentData`, `ScoreExplainer`, delete old files)
- [x] M-A-1: Route + page shell with URL-driven section + comms sub-tab
- [x] M-A-2: Sidebar integration (active state + attention badge)
- [x] M-A-3: Attention Strip with localStorage dismiss
- [x] M-A-4: Shared EmptyPanel / PanelSkeleton / PanelError
- [x] M-A-5: Responsive breakpoints for KPI grid + Scoring 2-col + heartbeat
- [x] M-B-1: 4 KPI cards (Agent Status, Last Run, Next Run, Needs Attention)
- [x] M-B-2: Today's Glance Strip (5 chips)
- [x] M-B-3: Live Activity Ticker with SSE + localStorage bridge
- [x] M-C-1: Activity table with filters + load more
- [x] M-C-2: Session grouping toggle
- [x] M-C-3: SSE + poll hybrid for "today" range
- [x] M-D-1: Comms banner with date-range filter
- [x] M-D-2: Inbound tab (URL-bound)
- [x] M-D-3: Outbound tab (URL-bound)
- [x] M-D-4: ChannelBadge component + theme tokens
- [x] M-E-1: Next run card + Run Now
- ☐ M-E-2: Trigger list table with snooze/resume
- ☐ M-E-3: Run history (Phase B)
- [x] M-F-1: Worker pool bar + 4 mini-cards + sparklines
- [x] M-F-2: Recent jobs table with friendly errors
- ☐ M-G-1: Task score table with row click
- ☐ M-G-2: ScoreFactorBreakdown side panel (7 factors)
- ☐ M-G-3: What-if Simulator modal (7 sliders)
- ☐ M-H-1: Pool KPI cards
- ☐ M-H-2: DispatchPlanViz swim-lanes
- ☐ M-H-3: HeartbeatTimeline (30 segments desktop / 15 mobile)
- ☐ M-H-4: Active delegations table
- ☐ Gateway B-0: Migration numbering check
- ☐ Gateway B-1: AgentToolCallEvent extended + wired in 5 agent files
- ☐ Gateway B-2: agent_session_log migration + writer
- [x] Gateway B-3: /agent/activity endpoint
- ☐ Gateway B-4: /agent/sessions endpoint
- ☐ Gateway B-5: /comms/summary endpoint
- ☐ Gateway B-6: /tasks/inbound-log + /tasks/outbound-log
- ☐ Gateway B-7: MinIO write race fix
- ☐ Gateway B-8: /scoring/simulate (verify or add)
- ☐ Gateway B-9: /agents/delegations (verify or add)
- ☐ PRD `docs/prd/03-agent-monitor.md` reconciled to v2
- ☐ OpenAPI typegen run after each backend endpoint ships

---

### Wave 6 — Settings Panel + Config + Secrets
**Goal:** All 6 settings sub-pages wired to backend.

**Scope:**
- Settings layout with sub-navigation (6 items + Danger Zone)
- Channels: activation wizard for WhatsApp/Telegram/Email with status badges
- LLM Providers: provider/model selection, BYOK key management (masked inputs)
- Scoring Weights: 7 sliders with auto-normalization + live preview
- Briefing Schedule: per-org time/channel/style configuration
- Triggers: follow-up days, interrupt threshold configuration
- A2A Keys: generate (shown once), rotate, revoke
- Config JSON viewer (read/write via PATCH)
- Secrets management: masked input, test/validate, status indicators
- React Hook Form + Zod for all forms

**Key files:**
- `src/features/settings/` (ChannelsPage, LlmPage, ScoringPage, BriefingPage, TriggersPage, A2aPage)
- `src/features/settings/components/` (WeightSlider, MaskedInput, ChannelWizard)

**API integrations:** ~21 endpoints (settings, config, secrets)
**Tests:** Form validation, slider normalization, masked input behavior, secret test flow
**Deliverable:** All settings pages functional — user can configure channels, LLM keys, scoring weights, triggers.

**Checklist:**
- ☐ Settings nested layout with sub-nav
- ☐ Channels page (WhatsApp/Telegram/Email activation wizards)
- ☐ LLM Providers page (provider cards, BYOK modal with masked input)
- ☐ Scoring Weights page (7 sliders, auto-normalize to 1.0, live task preview)
- ☐ Briefing Schedule page (time picker, channel select, style dropdown)
- ☐ Triggers page (follow-up config, threshold sliders)
- ☐ A2A Keys page (generate/rotate/revoke, one-time display)
- ☐ Config JSON viewer/editor
- ☐ Secrets status page (category list, test buttons)
- ☐ Form validation with Zod schemas

---

### Wave 7 — Skill Marketplace + MCP Registry + Approvals
**Goal:** Skill browsing/install, MCP server management, approval workflow.

**Scope:**
- Skill library table: installed skills with toggle, edit, fork, uninstall
- Remote registry browsing: source management, search, SKILL.md preview
- Install/uninstall/version pin workflow
- Per-skill configuration (LLM override, output type, approval toggle)
- Quality feedback (thumbs up/down)
- MCP server list: trust tier badges, edit/delete/view tools
- Pre-built adapter templates gallery (7 templates)
- Custom server registration form
- Trust tier configuration (AUTO/GATED/BLOCKED)
- Tool listing per server
- Approval cards: pending approvals with JSON preview, approve/reject

**Key files:**
- `src/features/skills/` (SkillLibrary, SkillDetail, RemoteRegistry, SkillConfig)
- `src/features/mcp/` (McpServerList, McpServerDetail, McpTemplates, TrustTierBadge)
- `src/features/mcp/Approvals.tsx`

**API integrations:** ~21 endpoints (skills, MCP, approvals)
**Tests:** Install/uninstall flows, trust tier changes, approval accept/reject
**Deliverable:** Browse/install skills, manage MCP servers with trust tiers, handle approvals.

**Checklist:**
- ☐ Skill library table (toggle, edit, fork, uninstall actions)
- ☐ Remote registry browser with search + SKILL.md preview
- ☐ Install dialog with version pin
- ☐ Per-skill config form
- ☐ Feedback submission (thumbs up/down + comment)
- ☐ MCP server list with trust tier badges
- ☐ Template gallery (7 pre-built adapters)
- ☐ Custom server registration form
- ☐ Trust tier switcher (AUTO/GATED/BLOCKED)
- ☐ Tool listing drill-down per server
- ☐ Approval cards with JSON preview + approve/reject

---

### Wave 8 — Canvas Editor (React Flow)
**Goal:** Visual drag-and-drop workflow builder for agent definitions.

**Scope:**
- React Flow canvas with custom background (dot grid)
- 9 custom node types: LLM Call, Tool Call, Condition, Input, Output, Loop, Human Approval Gate, Sub-Agent, Transform
- Node palette sidebar (draggable)
- Custom edge components for data flow wires
- Per-node configuration panel (right sidebar): Monaco for prompts, dropdowns, sliders, key-value editors
- Minimap
- Zoom controls (in/out/fit)
- Floating toolbar (select, pan, add node, add edge, comment)
- Undo/redo (Zustand stack)
- Agent version listing + compare (visual diff)
- Test mode: dry-run, step-through with intermediate inspection
- Export/import JSON
- SKILL.md editor with live preview

**Key files:**
- `src/features/canvas/` (CanvasEditor, NodePalette, PropertyInspector)
- `src/features/canvas/nodes/` (LlmCallNode, ToolCallNode, ConditionNode, etc.)
- `src/features/canvas/edges/` (DataFlowEdge)

**API integrations:** ~7 endpoints (agents CRUD, versions, test)
**Tests:** Node drag-drop, edge creation, property editing, undo/redo, export/import
**Deliverable:** Full canvas editor — drag nodes from palette, wire them, configure properties, test, save versions.

**Checklist:**
- ☐ React Flow canvas with dot-grid background
- ☐ 9 custom node components
- ☐ Draggable node palette (left sidebar)
- ☐ Property inspector panel (right sidebar)
- ☐ Monaco Editor for system prompts / task templates
- ☐ Custom DataFlowEdge component
- ☐ Floating toolbar (tool mode switching)
- ☐ Minimap + zoom controls
- ☐ Undo/redo stack (50 operations)
- ☐ Agent version list + side-by-side compare
- ☐ Test mode (dry-run + step-through)
- ☐ Export/Import JSON
- ☐ SKILL.md editor with YAML frontmatter preview

---

### Wave 9 — Intelligence Hub
**Goal:** Agent profile, memory (working/episodic/semantic), and skill authoring editors.

**Scope:**
- Intelligence Hub shell: secondary nav (5 sections) + content panels
- Agent selector dropdown (persisted to localStorage)
- Agent Profile editor: Monaco (Markdown mode), save/discard, dirty-state tracking
- Working Memory editor: Monaco, size warning at 8000+ chars, Compact dialog (archive to episodic)
- Episodic Memory browser: table + slide-over reader (read-only Monaco), delete with confirmation
- Semantic Memory editor: three-panel (topic list + Monaco editor + toolbar), new topic slug creation, delete
- Skill Authoring: list table, Monaco editor for SKILL.md, validation panel, fork, import file upload
- Unsaved-changes guard on section navigation
- Skeleton loading states

**Key files:**
- `src/features/intelligence/` (IntelligenceLayout, AgentProfile, WorkingMemory, EpisodicMemory, SemanticMemory, SkillAuthoring)
- `src/features/intelligence/components/` (CodeEditor, CompactDialog, ValidationPanel)

**API integrations:** ~20 endpoints (intelligence/*)
**Tests:** Dirty-state tracking, compact flow, topic slug validation, SKILL.md validation, section navigation guards
**Deliverable:** Full Intelligence Hub — edit agent profile, view/compact memory, browse episodic entries, manage semantic topics, author skills.

**Checklist:**
- ☐ Intelligence Hub layout (secondary nav + content)
- ☐ Agent selector dropdown (localStorage persistence)
- ☐ Agent Profile editor (Monaco Markdown mode)
- ☐ Working Memory editor + size warning banner
- ☐ Compact dialog (session label + summary → archive)
- ☐ Episodic Memory table + slide-over viewer
- ☐ Delete confirmation modals
- ☐ Semantic Memory three-panel layout
- ☐ New topic creation with slug validation
- ☐ Skill Authoring list + editor
- ☐ SKILL.md validation panel (YAML parse + required fields)
- ☐ Fork skill workflow
- ☐ Import SKILL.md file upload
- ☐ Dirty-state tracking with navigation guard

**FR-POL-002 — Policies Editor** ✅ COMPLETE (commit c885807)
- `src/features/intelligence/PoliciesPanel.tsx` — 4-policy card list (delegation, escalation, counterparty_etiquette, reply_tone)
- `src/features/intelligence/PolicyEditor.tsx` — side-by-side structured form (frontmatter) + Markdown body editor + preview toggle
- Added `Policies` tab to `IntelligenceLayout.tsx` (ShieldCheck icon, `policies` path)
- Hooks: `usePolicy`, `useSavePolicy` in `src/lib/api-hooks.ts`
- Route: `intelligence/policies` in `src/routes.tsx`
- Tests: `PoliciesPanel.test.tsx` (4 passing)

**FR-UI-001 — CounterpartyConversations** ✅ COMPLETE (commit a3342ad)
- `src/features/tasks/components/CounterpartyConversations.tsx` — accordion list of counterparties → threads → messages
- Integrated into `TaskDetail.tsx` as a section below task actions
- Hooks: `useConversations`, `useConversationThreads`, `useConversationMessages` in `src/lib/api-hooks.ts`
- Backend prerequisite: `GET /app/v1/conversations[/{cp}/{channel}/{thread}]` (graphclaw commit 954e317)
- Tests: `CounterpartyConversations.test.tsx` (4 passing)

**FR-UI-002 — OrgSwitcher** ✅ COMPLETE (commit 94e3647)
- `src/features/auth/OrgSwitcher.tsx` — dropdown in Topbar for multi-org context switching
- `activeOrgId` + `setActiveOrgId` added to `src/stores/auth.ts` (persisted via Zustand)
- Injected into `src/components/layout/Topbar.tsx`
- Hook: `useUserOrgs` in `src/lib/api-hooks.ts`
- Backend prerequisite: `GET /app/v1/user/orgs` (graphclaw commit 954e317)
- Tests: `OrgSwitcher.test.tsx` (3 passing)

---

### Wave 10 — Chat Interface + Real-Time
**Goal:** Bidirectional chat with WebSocket, SSE event stream for graph cache invalidation.

**Scope:**
- **Backend change:** Add WebSocket endpoint `GET /app/v1/chat/ws`
- WebSocket manager: auto-reconnect with exponential backoff, heartbeat (30s ping)
- Chat sidebar mode (350px sliding panel, toggleable from any page)
- Chat fullpage mode (`/chat` route)
- Rich message rendering: Markdown, inline cards (Task, Score, Approval, Briefing, Error)
- Suggested action pills (clickable → API call or navigation)
- Typing indicator animation
- Conversation history: session grouping, session list, infinite scroll, search
- SSE event stream manager: connect to `/app/v1/events`, parse events, invalidate TanStack Query cache keys
- Browser notification permission + badge count on chat icon
- Toast notifications for SSE events (approval pending, briefing ready)

**Key files:**
- `src/features/chat/` (ChatSidebar, ChatFullpage, MessageList, MessageBubble, InlineCard)
- `src/lib/websocket.ts` (WebSocket manager)
- `src/lib/sse.ts` (SSE manager + TQ cache invalidation)
- `src/hooks/useSSE.ts`, `src/hooks/useWebSocket.ts`

**Backend dependency:** WebSocket endpoint must be added to backend
**API integrations:** ~5 endpoints (chat messages, history) + WS + SSE
**Tests:** WS reconnection logic, message rendering, SSE cache invalidation, chat history pagination
**Deliverable:** Working chat (sidebar + fullpage), real-time graph updates via SSE, browser notifications.

**Checklist:**
- ☐ **Backend:** WebSocket endpoint at /app/v1/chat/ws
- ☐ WebSocket manager (connect, reconnect, heartbeat, auth)
- ☐ Chat sidebar (350px slide panel, toggle from any page)
- ☐ Chat fullpage (/chat route)
- ☐ Message rendering (Markdown + inline cards)
- ☐ 5 inline card types (Task, Score, Approval, Briefing, Error)
- ☐ Suggested action pills
- ☐ Typing indicator
- ☐ Session grouping (30-min timeout)
- ☐ Infinite scroll for history
- ☐ SSE manager (connect to /app/v1/events)
- ☐ SSE → TanStack Query cache invalidation mapping
- ☐ Browser notifications + badge count
- ☐ Toast notifications for key events

---

### Wave 11 — Admin Panel
**Goal:** Full admin panel with all 9 modules.

**Scope:**
- Admin layout with sub-navigation (hidden from non-admin users)
- Members: invite, role change, suspend/reactivate, remove
- Feature Gating: 8 feature gates with toggles/multi-selects
- LLM Config: provider/model allowlist, org-level keys, budget limits
- LLM-as-Judge: config form, results dashboard (histogram, trend, per-skill breakdown)
- Guardrails: visual form builder + Monaco XML editor, validate, dry-run, metrics
- SSO: OIDC and SAML config forms, test connection, certificate upload (drag-and-drop PEM)
- Audit Log: filterable table with export
- Infrastructure: deployment status, cluster health, backups, security, alarms, migrations
- Connectors: list, health badges, manual sync, credentials

**Key files:**
- `src/features/admin/` (AdminLayout, MembersPage, FeaturesPage, LlmConfigPage, JudgePage, GuardrailsPage, SsoPage, AuditPage, InfraPage, ConnectorsPage)

**API integrations:** ~45 endpoints (admin/*)
**Tests:** Role-based visibility, member management flows, guardrail validation, SSO test connection
**Deliverable:** Complete admin panel — manage members, features, LLM providers, guardrails, SSO, with full audit trail.

**Checklist:**
- ☐ Admin layout + sub-nav (hidden for non-admin)
- ☐ Members page (invite modal, role dropdown, suspend/remove)
- ☐ Feature Gating page (8 toggles/multi-selects)
- ☐ LLM Config page (provider cards, budget form)
- ☐ LLM-as-Judge page (config + results dashboard with Recharts)
- ☐ Guardrails page (form builder + Monaco XML editor + dry-run)
- ☐ SSO page (OIDC + SAML forms, certificate upload, test button)
- ☐ Audit Log page (filterable table + export)
- ☐ Infrastructure page (deployment, cluster, backups, security, alarms)
- ☐ Connectors page (list, health, sync, credentials)
- ☐ Migrations panel (list + apply)

---

### Wave 12 — Polish, Accessibility, E2E, Performance
**Goal:** Production-ready polish — accessibility audit, Playwright E2E suite, performance optimization.

**Scope:**
- Accessibility audit: ARIA roles on all interactive components, keyboard navigation, focus traps on modals/dialogs, screen reader testing
- High-contrast theme final validation
- Undo/redo stack for graph operations (reverse API calls)
- Optimistic updates for common mutations (state transitions, settings saves)
- Bundle analysis + code splitting optimization
- Image/asset optimization
- Playwright E2E test suite: auth flow, graph navigation, task CRUD, settings, admin
- Performance profiling: React DevTools, Lighthouse
- Error boundary coverage at feature level
- Loading skeleton coverage audit
- Mobile responsiveness final pass
- PWA manifest (optional)

**Key files:**
- `e2e/` (Playwright test files)
- Accessibility fixes across `src/components/`

**Tests:** Full Playwright E2E suite (10+ flows), Lighthouse performance audit
**Deliverable:** Production-ready app — accessible, performant, tested end-to-end.

**Checklist:**
- ☐ Accessibility audit (axe-core automated scan)
- ☐ Keyboard navigation for all interactive elements
- ☐ Focus traps on modals, slide-overs, command palette
- ☐ ARIA labels and roles audit
- ☐ Undo/redo integration for graph operations
- ☐ Optimistic updates for state transitions + settings
- ☐ Bundle analysis (vite-bundle-visualizer)
- ☐ Code splitting verification (route-level lazy)
- ☐ Playwright E2E: auth flow
- ☐ Playwright E2E: graph views + task management
- ☐ Playwright E2E: settings + admin
- ☐ Playwright E2E: chat + real-time
- ☐ Lighthouse audit (target: 90+ performance, 100 accessibility)
- ☐ Mobile responsiveness final pass

---

## Key Dependencies (npm)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "@tanstack/react-query": "^5.60.0",
    "@tanstack/react-virtual": "^3.10.0",
    "zustand": "^5.0.0",
    "openapi-fetch": "^0.12.0",
    "openapi-typescript": "^7.4.0",
    "cytoscape": "^3.30.0",
    "cytoscape-dagre": "^2.5.0",
    "@xyflow/react": "^12.0.0",
    "@monaco-editor/react": "^4.6.0",
    "recharts": "^2.13.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.460.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "tailwindcss": "^4.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react-swc": "^4.0.0",
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "msw": "^2.6.0",
    "@playwright/test": "^1.48.0",
    "eslint": "^9.13.0",
    "@eslint/js": "^9.13.0",
    "typescript-eslint": "^8.10.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0"
  }
}
```

---

## Development Workflow

### Dev Server + Proxy
```ts
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/app/v1': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
      '/openapi.json': 'http://localhost:8000',
    }
  }
})
```

### API Type Generation
```bash
# Run once, then re-run when backend changes
npx openapi-typescript http://localhost:8000/openapi.json -o src/lib/api-types.ts
```

### MSW for Development
MSW intercepts API calls in the browser service worker, allowing frontend development when the backend is unavailable. Each wave includes MSW handlers for its endpoints.

### CI/CD Pipeline
```yaml
# Suggested CI steps
- npm ci
- npm run typecheck        # tsc --noEmit
- npm run lint             # eslint
- npm run test             # vitest run
- npm run build            # vite build
- npx playwright test      # E2E (Wave 12+)
```

---

## Backend Changes Required

| Wave | Change | File |
|------|--------|------|
| 2 | Add `CORSMiddleware` allowing cockpit origin (localhost:3000 dev, cockpit:3000 Docker) | `graphclaw/src/graphclaw/gateway/app.py` |
| 10 | Add WebSocket endpoint for chat (`/app/v1/chat/ws`) | `graphclaw/src/graphclaw/api/chat.py` |
| 12 | Ensure `/auth/dev-token` works in Docker (ENVIRONMENT=development) | `graphclaw/src/graphclaw/auth/routes.py` |

---

## Verification

After each wave:
1. `npm run typecheck` — zero errors
2. `npm run lint` — zero warnings
3. `npm run test` — all passing
4. `npm run build` — successful production build
5. Manual walkthrough of the wave's deliverable against the corresponding wireframe page(s)

---

## Docker Deployment

### Cockpit Dockerfile (Multi-stage production build)

**File:** `Dockerfile`

```dockerfile
# Stage 1 — Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2 — Build the React SPA
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 3 — Serve with nginx
FROM nginx:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf (SPA routing + API reverse proxy)

**File:** `nginx.conf`

```nginx
server {
    listen 3000;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 '{"status":"ok"}';
        add_header Content-Type application/json;
    }

    # Proxy API requests to backend gateway
    location /app/v1/ {
        proxy_pass http://gateway:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    # Proxy auth requests to backend
    location /auth/ {
        proxy_pass http://gateway:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy WebSocket (chat)
    location /app/v1/chat/ws {
        proxy_pass http://gateway:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }

    # SPA fallback — serve index.html for all client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### .dockerignore

**File:** `.dockerignore`

```
node_modules
dist
.git
wireframes-v2
docs
e2e
*.md
.env*
.claude
```

### Docker Compose — Full-Stack E2E (cockpit + backend + infra)

**File:** `docker-compose.yml`

This compose file extends the backend's existing stack and adds the cockpit frontend as an additional service. It references the backend repo via relative path.

```yaml
services:
  # ─── Backend Infrastructure (mirrored from graphclaw/docker/docker-compose.yml) ───
  db:
    build:
      context: ../graphclaw
      dockerfile: docker/Dockerfile.db
    environment:
      POSTGRES_DB: graphclaw
      POSTGRES_USER: graphclaw
      POSTGRES_PASSWORD: ${DB_PASSWORD:-graphclaw_dev}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql
    networks:
      default:
        aliases:
          - graph-db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U graphclaw -d graphclaw"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
    environment:
      MINIO_ROOT_USER: graphclaw
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD:-graphclaw_dev}
    volumes:
      - miniodata:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio-init:
    image: minio/mc:latest
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
        mc alias set local http://minio:9000 graphclaw ${MINIO_PASSWORD:-graphclaw_dev} &&
        mc mb --ignore-existing local/graphclaw &&
        echo 'MinIO bucket ready'
      "
    restart: "no"

  # ─── Backend API Gateway ───
  gateway:
    build:
      context: ../graphclaw
      dockerfile: docker/Dockerfile.gateway
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
      minio-init:
        condition: service_completed_successfully
    ports:
      - "8000:8000"
    environment:
      ENVIRONMENT: development
      DATABASE_URL: postgresql://graphclaw:${DB_PASSWORD:-graphclaw_dev}@db:5432/graphclaw
      SECRETS_BACKEND: env_file
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
      REDIS_URL: redis://redis:6379
      STORAGE_ENDPOINT_URL: http://minio:9000
      STORAGE_BUCKET: graphclaw
      AWS_ACCESS_KEY_ID: graphclaw
      AWS_SECRET_ACCESS_KEY: ${MINIO_PASSWORD:-graphclaw_dev}
      GRAPHCLAW_USER_ID: ${GRAPHCLAW_USER_ID:-test-user}
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Cockpit Frontend ───
  cockpit:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ""  # Empty = same-origin; nginx proxies /app/v1/ → gateway:8000
    depends_on:
      gateway:
        condition: service_healthy
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      timeout: 3s
      retries: 3

  # ─── Playwright E2E Runner (on-demand) ───
  e2e:
    image: mcr.microsoft.com/playwright:v1.48.0-noble
    profiles:
      - test
    depends_on:
      cockpit:
        condition: service_healthy
      gateway:
        condition: service_healthy
    working_dir: /app
    volumes:
      - .:/app
    environment:
      BASE_URL: http://cockpit:3000
      API_URL: http://gateway:8000
      CI: "true"
    command: ["npx", "playwright", "test", "--reporter=html"]

volumes:
  pgdata:
  miniodata:
```

### Running E2E Tests

```bash
# Start the full stack
docker compose up -d --build

# Wait for health checks, then run Playwright
docker compose --profile test run --rm e2e

# View test report
npx playwright show-report

# Tear down
docker compose down -v
```

---

## Playwright E2E Test Scenarios

**File to create:** `docs/e2e-test-scenarios.md`

The Playwright E2E suite tests the deployed cockpit against the real backend APIs. Tests are organized by feature area. Each test file uses a shared `auth.fixture.ts` that authenticates via `POST /auth/dev-token` and injects the session cookie.

### Playwright Config

**File:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
});
```

### Test Scenarios Catalog

#### TS-G01: Global — Authentication Flow
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| G01.1 | Unauthenticated redirect | Visit /goals without token | Redirect to /login |
| G01.2 | OAuth login | Click "Login with Google" | Redirect to IdP, return to /goals |
| G01.3 | Dev token login | POST /auth/dev-token | Cookie set, /goals loads |
| G01.4 | Token refresh | Wait 14min (mock), trigger API call | New token issued transparently |
| G01.5 | Logout | Click avatar → Logout | Cookies cleared, redirect to /login |

#### TS-G02: Global — Navigation & Theme
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| G02.1 | Sidebar nav | Click each nav item | Correct route loads, active state set |
| G02.2 | Sidebar collapse | Click collapse toggle | Width 240→56px, labels hidden, persisted |
| G02.3 | Theme switch | Select "Midnight Blue" from picker | `data-theme="midnight"` on html, persisted |
| G02.4 | Command palette | Press Ctrl+K, type "settings" | Filtered results, Enter navigates |
| G02.5 | Mobile bottom nav | Resize to 375px | Sidebar hidden, bottom nav visible |
| G02.6 | Breadcrumbs | Navigate to /settings/llm | Breadcrumbs show "Settings > LLM Providers" |

#### TS-01: Goal View
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 01.1 | Load goals | Navigate to / | Cytoscape graph renders with goal nodes |
| 01.2 | View switcher | Click Tree → Flat → Heatmap | Layout changes accordingly |
| 01.3 | Select goal | Click goal node | Detail panel opens on right |
| 01.4 | Create goal | Click "New Goal", fill form, save | Node appears in graph, API 201 |
| 01.5 | Edit goal | Double-click goal → edit title → save | Title updates, API PATCH success |
| 01.6 | Navigate to task | Click task row in goal detail | Task detail panel opens |

#### TS-02: My Tasks
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 02.1 | Load tasks | Navigate to /tasks | Table renders with task rows |
| 02.2 | Filter by status | Click "Blocked" chip | Only blocked tasks shown |
| 02.3 | Sort by score | Click score column header | Rows reorder descending |
| 02.4 | Mark done | Click checkmark on task row | State → DONE, row updates |
| 02.5 | Search | Type "deploy" in search | Filtered to matching tasks |
| 02.6 | Pagination | Scroll past 50 items | Next page loads seamlessly |
| 02.7 | Saved filter | Save "My Blockers" preset | Preset appears in dropdown, reloads correctly |

#### TS-03: Project View
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 03.1 | Project tabs | Click different project tab | Task cards filter to that project |
| 03.2 | Kanban view | Default view loads | 4 columns with draggable cards |
| 03.3 | Add task | Click "Add Task" → fill → save | Card appears in correct column |
| 03.4 | Table view | Switch to Table view | Dense table renders |

#### TS-04: Task Detail
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 04.1 | Open detail | Click task from My Tasks | Side panel slides in |
| 04.2 | Tab navigation | Click Activity → Notes → Linked Tasks | Tab content switches |
| 04.3 | Score breakdown | View score section | 7-factor table renders |
| 04.4 | Approve task | Click "Approve" button | State transitions, toast confirms |
| 04.5 | Add comment | Type comment → Send | Comment appears in activity feed |

#### TS-05: Timeline View — Hierarchical Gantt
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 05.1 | Gantt container renders | Navigate to /workspace/timeline | Left panel (`.tl-left`) and Gantt area (`.tl-right`) both present |
| 05.2 | Goal hierarchy tree | Wait for data load | Goal rows visible with expand chevrons; child composite/atomic rows indented |
| 05.3 | Expand / collapse | Click chevron on a Goal row | Child rows toggle hidden/visible; chevron rotates |
| 05.4 | Zoom — Week view | Click "Week" zoom button | Button shows active state; day columns 56px wide |
| 05.5 | Zoom — Month view | Click "Month" zoom button | Button shows active state; day columns 28px wide |
| 05.6 | Zoom — Quarter view | Click "Quarter" zoom button | Button shows active state; day columns 8px wide |
| 05.7 | Today line visible | Load page with today in range | `.gantt-today-line` element present and positioned within visible area |
| 05.8 | Filter chips toggle | Click "Blocked" chip | Chip gains active state; non-blocked task rows hidden |
| 05.9 | Undated tasks greyed | View a task with no dates | Row appears in left panel with reduced opacity; no bar in Gantt area |

#### TS-06: Agent Monitor
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 06.1 | KPI strip | Navigate to /agent-monitor | 4 KPI cards with values |
| 06.2 | Agent cards | View agent grid | Cards show status, heartbeat bars |
| 06.3 | Pause agent | Click "Pause" on running agent | Status changes to paused |
| 06.4 | Event log filter | Filter by "ERROR" severity | Only error events shown |
| 06.5 | Fire trigger | Click "Fire Now" on trigger | Success toast, trigger fires |

#### TS-07: Scoring & Explainability
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 07.1 | Score card | Open task → view score | 7-factor table + NL summary |
| 07.2 | History chart | Navigate to score history | Recharts timeline renders |
| 07.3 | Simulator | Adjust "urgency" slider | Score recalculates live |

#### TS-08: Settings — Channels
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 08.1 | View channels | Navigate to /settings/channels | Channel cards with status |
| 08.2 | Configure email | Click Configure on Email | Wizard opens, IMAP form displayed |
| 08.3 | Save settings | Fill form → Save | Toast confirms, API PATCH 200 |
| 08.4 | Discard changes | Modify → Discard | Form resets to saved values |

#### TS-09: Settings — LLM Providers
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 09.1 | Select provider | Choose Anthropic from dropdown | Model list updates |
| 09.2 | API key input | Enter key, toggle visibility | Key masked/unmasked |
| 09.3 | Temperature slider | Drag to 0.7 | Value display updates |

#### TS-10: Settings — Scoring Weights
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 10.1 | Adjust W1 | Drag slider up | Other sliders auto-normalize, sum = 1.0 |
| 10.2 | Live preview | Change weights + enter sample task | Score preview recalculates |
| 10.3 | Reset defaults | Click "Reset Defaults" | All 7 sliders return to original |

#### TS-11: Settings — A2A Keys
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.1 | Generate key | Click "Generate API Key" | Key shown once, copy button works |
| 11.2 | Revoke key | Click revoke → confirm | Key removed from list |

#### TS-12: Skill Marketplace
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 12.1 | Installed tab | View installed skills | Table with toggles and actions |
| 12.2 | Browse tab | Switch to Browse | Remote skill cards render |
| 12.3 | Install skill | Click Install → confirm | Skill added to Installed tab |
| 12.4 | Uninstall skill | Click Uninstall → confirm | Skill removed |
| 12.5 | Toggle skill | Click enable/disable toggle | Status changes |

#### TS-13: MCP Registry
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 13.1 | Server list | View MCP servers | Table with trust tier badges |
| 13.2 | Register server | Fill custom form → Register | Server appears in list |
| 13.3 | Change trust | Switch from AUTO to GATED | Badge updates, pending approvals enabled |
| 13.4 | View tools | Click server → tools | Tool list renders |

#### TS-14: Canvas Editor
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 14.1 | Canvas load | Navigate to /canvas | React Flow canvas with dot grid |
| 14.2 | Drag node | Drag "Task" from palette to canvas | New node appears at drop position |
| 14.3 | Connect edges | Drag from output port to input port | Edge renders between nodes |
| 14.4 | Node config | Click node → edit properties | Right panel shows config form |
| 14.5 | Save graph | Click Save | Toast confirms, API POST success |
| 14.6 | Undo/redo | Add node → Ctrl+Z → Ctrl+Shift+Z | Node removed then restored |
| 14.7 | Zoom controls | Click fit-view | Canvas zooms to show all nodes |

#### TS-15: Intelligence Hub
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 15.1 | Agent selector | Switch agent in dropdown | Content refreshes for selected agent |
| 15.2 | Edit profile | Modify profile → Save | Toast confirms, Monaco content persisted |
| 15.3 | Dirty guard | Edit profile → click Working Memory | Confirm dialog appears |
| 15.4 | Compact memory | Click Compact → fill dialog → submit | Working memory archived to episodic |
| 15.5 | View episodic | Click row → slide-over | Read-only Monaco shows content |
| 15.6 | New topic | Enter slug → validate → Save | New semantic topic created |
| 15.7 | Validate skill | Click Validate on skill | Validation panel: green valid / red invalid |

#### TS-16: Chat Interface
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 16.1 | Open sidebar | Click chat icon | 350px panel slides in |
| 16.2 | Send message | Type "hello" → Send | Message appears, agent responds |
| 16.3 | Typing indicator | After send, before response | Animated dots visible |
| 16.4 | Fullpage mode | Click expand | Navigates to /chat with conversation list |
| 16.5 | Code block | Agent returns code | Syntax highlighted, copy button works |
| 16.6 | Inline card | Agent references task | Task Card renders with link |

#### TS-17: Admin Panel
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 17.1 | Role gate | Login as MEMBER → visit /admin | Redirect to / (admin hidden) |
| 17.2 | Invite member | Click Invite → fill email + role → Send | New member row in table |
| 17.3 | Change role | Select new role for existing member | Role badge updates |
| 17.4 | Feature toggle | Toggle "MCP Connectors" | Feature gate updates |
| 17.5 | View audit log | Switch to Audit Log tab | Table with timestamped entries |
| 17.6 | Guardrails editor | Open XML editor → modify → Validate | Validation result displayed |

#### TS-18: SSE Real-Time Updates
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 18.1 | SSE connect | Login and navigate to /goals | EventSource opens to /app/v1/events |
| 18.2 | Task update | Backend emits task.state_changed | Graph node color updates without refresh |
| 18.3 | Approval notify | Backend emits approval.pending | Toast notification appears |
| 18.4 | Reconnect | Kill SSE → wait | Auto-reconnects within 5s |

---

## Git Commit Strategy

Each wave produces a series of commits following this pattern:

```
feat(wave-N): <scope description>
```

### Commit Cadence
- **One commit per logical unit** within a wave (e.g., component, route, test suite)
- **Wave completion commit** marks the wave as done in `build-plan.md`
- Before every commit: run `npm run typecheck && npm run lint && npm run test`
- Tag each completed wave: `git tag wave-N-complete`

### Commit Examples per Wave
```
feat(wave-1): scaffold Vite + React 19 + TypeScript strict
feat(wave-1): port design tokens + 6 themes from wireframes
feat(wave-1): add shadcn/ui base components
feat(wave-1): configure ESLint 9 + Prettier + Vitest
chore(wave-1): mark Wave 1 complete in build-plan.md

feat(wave-2): configure openapi-fetch + type generation
feat(wave-2): implement OAuth auth flow + dev-token shortcut
feat(wave-2): set up TanStack Query + MSW handlers
feat(wave-2): add RFC 7807 error parser + toast integration

feat(wave-3): build AppShell, Sidebar, Topbar components
feat(wave-3): configure React Router v7 with lazy routes
feat(wave-3): add Command Palette + mobile BottomNav

...

feat(wave-12): add Playwright E2E suite (18 test files)
feat(wave-12): Dockerfile + docker-compose for deployment
feat(wave-12): accessibility audit + Lighthouse polish

docs: add PRD 16 — React Implementation
docs: add e2e-test-scenarios.md
chore: add CLAUDE.md + agents + skills
```

### Branch Strategy
- All work on `master` (single developer workflow, matching current pattern)
- Waves are tracked via tags, not branches
- `build-plan.md` checklist items updated as work completes

---

## Documents to Create

### 1. PRD 16 — React Implementation (`docs/prd/16-react-implementation.md`)

```markdown
# 16 — React Implementation

**Version:** 1.0 | **Date:** 2026-04-14 | **Status:** Draft

---

## 16.1 Purpose

This PRD defines the implementation specification for converting the
GraphClaw Cockpit wireframes (Phase A–G, 26 pages) into a production
React single-page application connected to the GraphClaw backend API
gateway.

---

## 16.2 Scope

- React 19 + TypeScript strict SPA
- All 26 wireframe pages faithfully implemented
- Full integration with 131 backend API routes
- Docker containerized deployment
- E2E test suite against deployed stack

---

## 16.3 Software Stack

[Reference: build-plan.md § Software Stack]

---

## 16.4 Architecture

- Feature-based directory structure (`src/features/`)
- Server state: TanStack Query v5 (cache, pagination, SSE invalidation)
- Client state: Zustand v5 (theme, sidebar, filters, undo/redo)
- API: openapi-fetch with types from /openapi.json
- Real-time: SSE (graph events) + WebSocket (chat)
- Auth: OAuth 2.0 PKCE → RS256 JWT httpOnly cookies

---

## 16.5 Deployment

- Multi-stage Dockerfile (node build → nginx serve)
- nginx reverse-proxies /app/v1/* and /auth/* to backend gateway
- Docker Compose orchestrates: cockpit (port 3000) + gateway (8000)
  + Postgres/AGE + Redis + MinIO
- Frontend healthcheck at /health
- Static assets cached with immutable headers

---

## 16.6 Testing Strategy

- Unit/component: Vitest + React Testing Library + MSW
- E2E: Playwright against Docker-deployed stack
- 18 test files, 100+ scenarios covering all 20 pages
- Cross-browser: Chromium, Firefox, Mobile (iPhone 14)
- CI: typecheck → lint → unit tests → build → E2E

---

## 16.7 Wave Delivery Plan

12 waves, each independently testable.
[Reference: build-plan.md § Wave Delivery Plan]

---

## 16.8 Backend Changes Required

| Change | File | Wave |
|--------|------|------|
| CORSMiddleware | graphclaw/src/graphclaw/gateway/app.py | 2 |
| WebSocket chat | graphclaw/src/graphclaw/api/chat.py | 10 |

---

## 16.9 Acceptance Criteria

1. All 26 wireframe pages match fidelity of wireframes
2. All 131 API routes integrated and functional
3. 6 themes work across all pages
4. Responsive at 3 breakpoints (mobile, tablet, desktop)
5. E2E Playwright suite passes on Docker stack
6. Lighthouse: 90+ performance, 100 accessibility
7. Zero TypeScript errors, zero lint warnings
```

### 2. CLAUDE.md (Project context for Claude Code)

**File:** `CLAUDE.md` (cockpit repo root)

```markdown
# GraphClaw Cockpit — Claude Code Context

## Project
React 19 + TypeScript SPA for the GraphClaw task graph management system.
Consumes the FastAPI backend at ../graphclaw via /app/v1/ REST + SSE + WebSocket.

## Tech Stack
- React 19, TypeScript strict, Vite 6
- shadcn/ui (Radix + Tailwind CSS 4)
- Cytoscape.js (graph views) + React Flow (canvas editor)
- openapi-fetch + TanStack Query v5 + Zustand v5
- Monaco Editor, Recharts, React Hook Form + Zod
- React Router v7

## Commands
- `npm run dev` — dev server on :3000 (proxies /app/v1 → :8000)
- `npm run build` — production build to dist/
- `npm run typecheck` — tsc --noEmit
- `npm run lint` — eslint
- `npm run test` — vitest run
- `npm run test:e2e` — playwright test (requires Docker stack)
- `docker compose up -d --build` — full stack (cockpit + backend)
- `docker compose --profile test run --rm e2e` — run E2E in Docker

## Conventions
- Feature-based structure: `src/features/{name}/`
- All API calls via `src/lib/api-client.ts` (openapi-fetch)
- Server state: TanStack Query hooks in feature dirs
- Client state: Zustand stores in `src/stores/`
- Tests co-located: `Component.test.tsx` next to `Component.tsx`
- E2E tests: `e2e/{feature}/*.spec.ts`
- Commit format: `feat(wave-N): description`
- Before commit: `npm run typecheck && npm run lint && npm run test`

## Key Files
- `build-plan.md` — wave progress tracker (source of truth)
- `src/lib/api-client.ts` — openapi-fetch instance + auth
- `src/lib/sse.ts` — SSE manager for /app/v1/events
- `src/stores/theme.ts` — 6 themes + sidebar state
- `src/styles/themes.css` — CSS custom properties for all themes
- `docker-compose.yml` — full-stack deployment
- `docs/prd/` — product requirements (00-16)

## Backend
- Repo: ../graphclaw
- Gateway: FastAPI on :8000 (131 routes under /app/v1/)
- Auth: RS256 JWT via OAuth 2.0 (Google/GitHub/Microsoft)
- Real-time: SSE at /app/v1/events, WebSocket at /app/v1/chat/ws
- OpenAPI spec: http://localhost:8000/openapi.json

## Wireframes
- Reference: wireframes-v2/pages/*.html (26 pages)
- Design tokens: wireframes-v2/assets/tokens.css
- Do NOT modify wireframe files — they are read-only reference
```

### 3. Claude Agents

**File:** `.claude/agents/cockpit-builder.md`

```markdown
# Cockpit Builder Agent

Build React components for the GraphClaw Cockpit following the project's
established patterns.

## Model
Claude Sonnet 4.6

## Instructions
- Use shadcn/ui primitives from `src/components/ui/`
- Follow feature-based structure: `src/features/{name}/`
- Use openapi-fetch for API calls via `src/lib/api-client.ts`
- Use TanStack Query for server state, Zustand for client state
- Match wireframe designs in `wireframes-v2/pages/`
- Include co-located tests (*.test.tsx) with each component
- Use MSW handlers from `src/test/handlers.ts` for API mocking
- Reference design tokens from `src/styles/themes.css`
```

**File:** `.claude/agents/cockpit-tester.md`

```markdown
# Cockpit Tester Agent

Write and run Playwright E2E tests for the GraphClaw Cockpit.

## Model
Claude Sonnet 4.6

## Instructions
- Tests go in `e2e/{feature}/*.spec.ts`
- Use the authenticated fixture from `e2e/fixtures/auth.fixture.ts`
- Test against `BASE_URL` (default http://localhost:3000)
- Follow test scenario catalog in `docs/e2e-test-scenarios.md`
- Test all 3 viewports: Desktop Chrome, Desktop Firefox, iPhone 14
- Use page object pattern for complex pages
- Assert API responses when testing data mutations
- Take screenshots on failure (playwright.config.ts handles this)
```

**File:** `.claude/agents/cockpit-reviewer.md`

```markdown
# Cockpit Reviewer Agent

Review React code for quality, wireframe fidelity, and correctness.

## Model
Claude Opus 4.6

## Instructions
- Compare built components against wireframe HTML in `wireframes-v2/pages/`
- Check design token usage (CSS custom properties, not hardcoded colors)
- Verify accessibility: ARIA roles, keyboard nav, focus management
- Review TypeScript strictness: no `any`, proper null checks
- Verify API integration: correct endpoint, proper error handling
- Check responsive behavior at 3 breakpoints
- Verify theme support across all 6 themes
- Ensure tests cover happy path + error states
```

### 4. Claude Skills

**File:** `.claude/skills/cockpit-react-patterns/SKILL.md`

```markdown
---
name: cockpit-react-patterns
description: React/TypeScript patterns for GraphClaw Cockpit — component structure, hooks, stores, and shadcn/ui usage. Use when building or reviewing React components.
---

# Cockpit React Patterns

## Component File Structure
- One component per file, named export matching filename
- Props interface defined inline above component
- Co-located test file: `Component.test.tsx`

## Feature Module Pattern
```
src/features/{name}/
├── index.ts          # Public exports
├── {Name}Page.tsx    # Route-level page component
├── components/       # Feature-specific components
├── hooks/            # Feature-specific hooks (useXxxQuery, useXxxMutation)
└── types.ts          # Feature-specific types
```

## TanStack Query Conventions
- Query keys: `['{feature}', '{resource}', params]`
- Queries: `useQuery({ queryKey, queryFn: () => client.GET(...) })`
- Mutations: `useMutation` + `onSuccess: invalidateQueries`
- Optimistic: `onMutate` → update cache → `onError` → rollback

## Zustand Store Pattern
```typescript
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'gc-theme' }
  )
);
```

## shadcn/ui Usage
- Import from `@/components/ui/{component}`
- Extend with `className` prop (Tailwind classes)
- Use `cva` for variant-driven component styling
- Use `cn()` helper (`clsx` + `tailwind-merge`) for class composition
```

**File:** `.claude/skills/cockpit-api-integration/SKILL.md`

```markdown
---
name: cockpit-api-integration
description: openapi-fetch + TanStack Query patterns for GraphClaw Cockpit API integration. Use when creating API hooks or debugging API calls.
---

# Cockpit API Integration

## API Client Setup
```typescript
import createClient from 'openapi-fetch';
import type { paths } from './api-types';

export const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL || '',
});
```

## Query Hook Pattern
```typescript
export function useGoals(cursor?: string) {
  return useQuery({
    queryKey: ['graph', 'goals', { cursor }],
    queryFn: async () => {
      const { data, error } = await client.GET('/app/v1/graph/goals', {
        params: { query: { cursor, limit: 50 } },
      });
      if (error) throw error;
      return data;
    },
  });
}
```

## Pagination Pattern
- Backend uses cursor-based: `{ items, next_cursor, total? }`
- Use TanStack Query `useInfiniteQuery` for infinite scroll
- Pass `next_cursor` as `pageParam`

## Error Handling
- Backend returns RFC 7807: `{ type, title, status, detail, instance }`
- Parse with `parseApiError()` from `src/lib/utils.ts`
- Display via toast notification

## SSE Cache Invalidation
- SSE events map to TanStack Query key invalidation
- `task.state_changed` → invalidate `['graph', 'tasks']`
- `task.scored` → invalidate `['scoring']`
- `approval.pending` → invalidate `['approvals']`
```

**File:** `.claude/skills/cockpit-playwright-e2e/SKILL.md`

```markdown
---
name: cockpit-playwright-e2e
description: Playwright E2E test conventions for GraphClaw Cockpit. Use when writing or reviewing E2E tests.
---

# Cockpit Playwright E2E Conventions

## Auth Fixture
All tests use the authenticated fixture:
```typescript
import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Get dev token from backend
    const res = await page.request.post('/auth/dev-token');
    const { access_token } = await res.json();
    // Set cookie
    await page.context().addCookies([{
      name: 'access_token', value: access_token,
      domain: 'localhost', path: '/',
    }]);
    await use(page);
  },
});
```

## Test Structure
```typescript
test.describe('Goal View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="goal-graph"]');
  });

  test('renders goal nodes', async ({ page }) => {
    const nodes = page.locator('[data-testid="graph-node"]');
    await expect(nodes).toHaveCount.greaterThan(0);
  });
});
```

## Selectors
- Prefer `data-testid` attributes over CSS selectors
- Use `getByRole()` for accessible elements
- Use `getByText()` for visible text

## API Assertions
For mutation tests, intercept the API call:
```typescript
const [response] = await Promise.all([
  page.waitForResponse('**/app/v1/graph/tasks/**'),
  page.click('[data-testid="approve-btn"]'),
]);
expect(response.status()).toBe(200);
```
```

**File:** `.claude/skills/cockpit-docker-deploy/SKILL.md`

```markdown
---
name: cockpit-docker-deploy
description: Docker build and deployment patterns for GraphClaw Cockpit. Use when building, debugging, or modifying Docker config.
---

# Cockpit Docker Deploy

## Architecture
- Cockpit: nginx serving React SPA on port 3000
- nginx proxies /app/v1/* and /auth/* to gateway:8000
- Backend gateway: FastAPI/uvicorn on port 8000
- Infra: Postgres+AGE (:5432), Redis (:6379), MinIO (:9000)

## Build
```bash
docker compose build cockpit    # Build frontend only
docker compose up -d            # Start full stack
docker compose logs cockpit -f  # Watch frontend logs
```

## E2E Testing
```bash
docker compose --profile test run --rm e2e
```

## Debugging
- Cockpit health: http://localhost:3000/health
- Backend health: http://localhost:8000/health
- Backend API docs: http://localhost:8000/docs
- MinIO console: http://localhost:9001

## Environment
- `VITE_API_URL`: empty string for Docker (nginx proxies)
- `VITE_API_URL=http://localhost:8000` for local dev
```

### 5. Updates to Existing Files

**`docs/prd/00-index.md`** — add row:
```markdown
| 16 | [React Implementation](16-react-implementation.md) | Software stack, deployment, testing, wave delivery |
```

**`docs/design-plan.md`** — add Phase H section:
```markdown
### Phase H: React Implementation 🔲 NOT STARTED
12-wave React build converting wireframes to production SPA.
See `build-plan.md` for detailed wave plan and checklists.
- [ ] Wave 1: Scaffold + Design System
- [ ] Wave 2: API Client + Auth + MSW
- [ ] Wave 3: App Shell + Navigation
- [ ] Wave 4: Graph Views + Tasks
- [ ] ~~Wave 5: Agent Monitor + Scoring~~ *(superseded by Wave M)*
- [ ] Wave M: Agent Monitor v2 (Cockpit + Gateway) — see `docs/agent/`
- [ ] Wave 6: Settings + Config
- [ ] Wave 7: Skills + MCP + Approvals
- [ ] Wave 8: Canvas Editor
- [ ] Wave 9: Intelligence Hub
- [ ] Wave 10: Chat + Real-Time
- [ ] Wave 11: Admin Panel
- [ ] Wave 12: Docker + E2E + Polish
```

---

## Wave 12 — Updated (Docker + E2E + Polish)

Wave 12 is expanded to include Docker deployment and the full Playwright E2E suite:

**Additional checklist items for Wave 12:**
- ☐ Create `Dockerfile` (multi-stage: node build → nginx)
- ☐ Create `nginx.conf` (SPA routing + API proxy + WS upgrade)
- ☐ Create `.dockerignore`
- ☐ Create `docker-compose.yml` (cockpit + gateway + db + redis + minio)
- ☐ Create `playwright.config.ts`
- ☐ Create `e2e/fixtures/auth.fixture.ts` (dev-token auth)
- ☐ Create `e2e/fixtures/seed-data.ts` (API seed helpers)
- ☐ Write 18 Playwright spec files (100+ scenarios)
- ☐ `docker compose up -d --build` → all services healthy
- ☐ `docker compose --profile test run --rm e2e` → all tests pass
- ☐ Create `docs/prd/16-react-implementation.md`
- ☐ Create `docs/e2e-test-scenarios.md`
- ☐ Create `CLAUDE.md`
- ☐ Create `.claude/agents/` (3 agent files)
- ☐ Create `.claude/skills/` (4 skill directories)
- ☐ Update `docs/prd/00-index.md` (add PRD 16 row)
- ☐ Update `docs/design-plan.md` (add Phase H section)
- ☐ Tag `wave-12-complete`
- ☐ Final commit: `chore: mark React implementation build-plan complete`
