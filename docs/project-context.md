# GraphClaw Cockpit — Project Context

> Persistent context document for the cockpit wireframe rebuild.
> Last updated: 2026-04-10

## What Is This Project?
GraphClaw Cockpit is the web UI for the GraphClaw task graph management system. It provides a visual interface for managing tasks, monitoring AI agents, editing task graphs, configuring channels/LLM providers, and interacting via chat.

## Why Are We Rebuilding Wireframes?
The v1 wireframes (`wireframes/`) were low-fidelity and looked AI-generated. Specific weaknesses:
1. Only 12 CSS variables — no proper design token system
2. No icons (Lucide not loaded)
3. No shadows or elevation hierarchy
4. Everything uses the same `.pill` class
5. Dashed placeholder borders everywhere
6. Annotation text explains intent instead of showing design
7. Generic data (TSK-001, TSK-002) instead of realistic content
8. No dark mode implementation
9. No responsive mobile layouts
10. No hover, focus, or active states
11. Uniform spacing throughout — no visual rhythm
12. Only 4 pages built out of 113 needed surfaces

## Design Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-21 | Mixed aesthetic direction | Different modules need different UX patterns |
| 2026-03-21 | Notion-like for tasks | Card blocks work best for task review workflows |
| 2026-03-21 | Linear-like for settings | Dense controls need tight, keyboard-first layout |
| 2026-03-21 | Figma-like for canvas | Precision graph editing needs floating toolbar paradigm |
| 2026-03-21 | Canva-like for onboarding | Guided flows need warm, friendly aesthetic |
| 2026-04-10 | 3-agent system | Builder + Evaluator + Tester ensures quality gating |
| 2026-04-10 | Claude Sonnet 4.6 for builder | Fast iteration, strong code generation |
| 2026-04-10 | Claude Opus 4.6 for evaluator | Deeper reasoning for quality assessment |
| 2026-04-10 | 5-phase execution | A (tokens) -> B (tasks) -> C (agent/chat) -> D (canvas/settings) -> E (admin) |
| 2026-04-10 | Self-contained HTML pages | No build step; each page works standalone with shared CSS |
| 2026-04-10 | wireframes-v2/ directory | Keep v1 for comparison; fresh start |

## Tech Constraints (from PRD §10)
- Target stack: React 19 + TypeScript + Vite + shadcn/ui + Tailwind + TanStack Query
- Graph rendering: Cytoscape.js or React Flow
- Code editor: Monaco Editor
- Wireframes are HTML mockups (not React) that demonstrate intended look and behavior
- Must be responsive: mobile (< 768), tablet (768-1024), desktop (> 1024)
- Must support dark + light mode via CSS custom properties
- Accessibility: WCAG 2.1 AA compliance

## PRD Document Map
| File | Content |
|------|---------|
| 00-index.md | Table of contents and navigation |
| 01-overview.md | Product vision, personas, scope |
| 02-graph-cockpit.md | Main cockpit view, 5 view tabs, graph rendering |
| 03-agent-monitor.md | Agent KPIs, queue management, heartbeat, logs |
| 04-canvas-editor.md | Visual graph editor, node/edge operations, skill forms |
| 05-settings-panel.md | Channel, LLM, scoring, briefing, trigger configuration |
| 06-skill-marketplace.md | Skill discovery, install, version management |
| 07-mcp-registry.md | MCP server management, health, protocol config |
| 08-explainability.md | Score breakdown, decision audit trail, factor visualization |
| 09-admin-panel.md | User management, audit logs, system health, quotas |
| 10-technical-spec.md | Architecture, component tree, state management, API layer |
| 11-api-contract.md | REST API endpoints, request/response schemas |
| 12-task-views.md | 5 view modes, filtering, sorting, grouping |
| 13-chat-interface.md | Chat sidebar, full-page chat, message types, attachments |
| 14-config-and-secrets.md | Config management, secrets handling, env variables |

## 113 UI Surface Inventory (Grouped)

### Group A: Core Graph Views (13 screens) — P1
Goal view, project view, my tasks, resource view, timeline view, task detail panel, task detail full page, node hover card, edge hover card, create task modal, edit task modal, bulk operations bar, graph filter panel

### Group B: Agent Monitor (11 screens) — P2
KPI strip, agent queue table, heartbeat timeline, skill execution log, agent detail panel, cost tracker, error log, retry controls, agent config editor, performance charts, capacity planner

### Group C: Canvas Editor (9 screens) — P2
Canvas workspace, node palette, edge drawing tool, skill attachment form, property inspector, minimap, canvas toolbar, grid/snap settings, canvas zoom controls

### Group D: Settings (7 screens) — P1/P3
Channel settings, LLM provider settings, scoring weight editor, briefing schedule, trigger rules, A2A protocol config, notification preferences

### Group E: Skill Marketplace (5 screens) — P2/P3
Marketplace browse, skill detail, install wizard, version manager, skill config editor

### Group F: MCP Registry (8 screens) — P2/P3
Registry list, server detail, health dashboard, protocol config, connection wizard, capability browser, server logs, transport settings

### Group G: Explainability (5 screens) — P1/P2
Score breakdown panel, factor radar chart, decision audit timeline, comparison view, what-if simulator

### Group H: Approval Flows (4 screens) — P1
Approval queue, approval detail, approval history, delegation settings

### Group I: Admin Panel (17 screens) — P3
User list, user detail, role editor, audit log, system health, quota management, backup status, deployment status, schema migration, API keys, webhook config, rate limits, feature flags, tenant settings, billing overview, usage analytics, compliance report

### Group J: Task Views + Filters (7 screens) — P1/P2
Table view, kanban board, dependency graph, saved filters, sort/group controls, search overlay, column customizer

### Group K: Chat Interface (12 screens) — P1
Chat sidebar, chat full page, message composer, attachment picker, message thread, agent thinking indicator, suggested actions, chat history, search in chat, pinned messages, chat settings, notification badge

### Group L: Config & Secrets (2 screens) — P1
Config editor, secrets vault

### Group M: Navigation/Utilities (9 screens) — P1
Sidebar nav, top bar, command palette, breadcrumbs, view switcher, notifications panel, user menu, help/docs panel, keyboard shortcuts overlay

### Group N: Modals & Dialogs (4 screens) — P1
Confirmation dialog, error dialog, success toast, warning banner

## Backend API Build Status (as of 2026-04-10)

All backend API work is in `graphclaw/src/graphclaw/api/`. The cockpit consumes 144 total endpoints (40 existing, 104 new). Build is organized into 6 waves; Wave 1 is active.

| Wave | Key Files | Endpoints | Cockpit Surfaces | Status |
|------|-----------|-----------|-----------------|--------|
| 1 | `graph.py`, `scoring.py`, `state.py`, `events.py` | 18+SSE | §02 §08 §12 | 🔄 Active |
| 2 | Stub→real: `approvals.py`, `settings.py`, `skill_registry.py`, `mcp_registry.py` | 15 | §07 stub fixes | ⬜ |
| 3 | `chat.py`, `config.py`, `secrets.py` | 12 | §13 §14 | ⬜ |
| 4 | `settings.py` ext, `agent.py` | 14 | §03 §05 | ⬜ |
| 5 | `skill_registry.py` ext, `mcp_registry.py` ext, `agents.py` | 13 | §04 §06 §07 | ⬜ |
| 6 | `admin/` (9 files) | 45 | §09 | ⬜ |

---

## Color System (from PRD §02)
- State colors: Blue (active), Green (in-progress), Red (blocked), Amber (delayed), Grey (complete), Light Grey (snoozed), Purple (needs-review)
- Edge colors: Blue (dependency), Red (blocks), Amber (soft-dep), Grey (reference)
- Trust badges: Green AUTO, Amber GATED, Red BLOCKED
- Channel badges: Green (connected), Yellow (degraded), White (disconnected), Lock (auth expired)
