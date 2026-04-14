# GraphClaw Cockpit — Design Plan

> Living document. Updated as work progresses.
> Last updated: 2026-04-12

## Agent System

| Agent | Model | Role |
|-------|-------|------|
| cockpit-builder | Claude Sonnet 4.6 | Produce high-fidelity HTML/CSS/JS mockup pages |
| cockpit-evaluator | Claude Opus 4.6 | Score & gate each page (10-dimension rubric) |
| cockpit-tester | Claude Sonnet 4.6 | Screenshot at 3 viewports, report visual issues |

### Workflow
```
Builder creates page
    -> Tester screenshots (desktop/tablet/mobile + dark)
    -> Evaluator scores (10 dimensions, weighted avg)
    -> PASS: move to next page
    -> REVISE: builder fixes, re-test, re-evaluate
    -> REBUILD: start page over
```

## Aesthetic Direction

| Module | Style Reference | Key Traits |
|--------|----------------|------------|
| Task views & blocks | Notion | Clean card blocks, subtle dividers, readable hierarchy |
| Settings & operations | Linear | Dense but elegant, bold labels, tight spacing |
| Canvas editor | Figma | Precise controls, floating toolbars, infinite canvas feel |
| Onboarding & empty states | Canva | Guided flows, friendly illustrations, warm gradients |
| Shell & navigation | Linear + Notion | Icon sidebar, clean top bar, command palette affordance |

## Execution Phases

### Phase A: Design System Foundation ✅ COMPLETE
- [x] `wireframes-v2/assets/tokens.css` (11KB) — light+dark themes, 7 state colors, type/spacing/shadow/radius/z-index/sizing tokens
- [x] `wireframes-v2/assets/components.css` (35KB) — button variants, input, badge, card, table, dropdown, toast, modal styles
- [x] `wireframes-v2/assets/layout.css` (15KB) — grid, sidebar (240px/56px collapsed), topbar, responsive breakpoints
- [x] `wireframes-v2/assets/utilities.css` (14KB) — transitions, helpers, animations, scrollbar, focus-visible
- [x] `wireframes-v2/design-system.html` (80KB) — full visual token showcase + all component states
- [x] `wireframes-v2/index.html` (33KB) — hub page with gradient header, phase progress, page links
- **Status:** COMPLETE (2026-04-10)

#### Phase A Key Decisions (preserved for continuity)
- Brand: `--brand-primary: #0EA5E9` (sky blue)
- State colors: Active=#3B82F6, InProgress=#10B981, Blocked=#EF4444, Delayed=#F59E0B, Complete=#9CA3AF, Snoozed=#E5E7EB, Review=#A855F7
- Font: Inter (Google Fonts), Mono: JetBrains Mono
- Spacing: 4px base (--space-0 thru --space-16)
- Sidebar: `--sidebar-width: 240px`, `--sidebar-collapsed: 56px`, `--topbar-height: 56px`
- Themes: `[data-theme="light"]` / `[data-theme="dark"]` on `<html>`
- All pages link CSS: `../assets/tokens.css`, `../assets/components.css`, `../assets/layout.css`, `../assets/utilities.css`

### Phase B: Core Task Views ✅ COMPLETE (2026-04-10)
- [x] `wireframes-v2/pages/goal-view.html` (38.6KB) — 3-col: collapsible goal tree, goal detail card (KRs/progress), task panel with trust badges
- [x] `wireframes-v2/pages/project-view.html` (37.1KB) — Kanban 4-col, 18 cards, WIP limit warning (orange border), drag-handle, score chips
- [x] `wireframes-v2/pages/my-tasks.html` (31.4KB) — Linear-dense table, Today/This Week/Later groups, color-coded score column, hover actions
- [x] `wireframes-v2/pages/resource-view.html` (35.3KB) — Capacity heatmap, 4 humans + 3 AI agents, cap bars (green/amber/red), cell hover tooltips
- [x] `wireframes-v2/pages/timeline-view.html` (37.4KB) — Gantt, 11 tasks/4 projects, JS day headers, today line (Apr 10 2026), SVG dependency arrows
- [x] `wireframes-v2/pages/task-detail.html` (43.5KB) — Side panel 520px, 4 tabs, 7-factor score bars, AI explainability, GATED approval, blurred background

### Phase C: Agent & Chat ✅ COMPLETE (2026-04-10)
- [x] `wireframes-v2/pages/agent-monitor.html` (59.1KB) — KPI bar, 6 agent cards (CSS sparklines, left-border state), event log table with severity colors
- [x] `wireframes-v2/pages/chat-sidebar.html` (39.2KB) — 400px overlay panel, blurred goal-view background, tool-use `<details>`, task-created confirmation card
- [x] `wireframes-v2/pages/chat-fullpage.html` (54.0KB) — 3-col layout (220px history + flex chat + 280px context panel), thinking dots, code blocks, action loop

### Phase D: Canvas & Settings ✅ COMPLETE (2026-04-10)
- [x] `wireframes-v2/pages/canvas-editor.html` (47.5KB) — Figma-style graph editor, dark dot-grid canvas, 7 nodes with SVG curved edges, mini-map, properties panel
- [x] `wireframes-v2/pages/settings-channels.html` (35.3KB) — Email/Slack/Teams/Webhooks config, polling intervals, inner settings nav
- [x] `wireframes-v2/pages/settings-llm.html` (39.0KB) — Orchestrator/Skill/Embeddings config, masked API keys, credential table with status badges
- [x] `wireframes-v2/pages/settings-scoring.html` (44.2KB) — 7-factor weight sliders, live score preview dial, recalculation trigger
- [x] `wireframes-v2/pages/settings-briefing.html` (47.5KB) — Morning/evening schedules, interrupt alerts, email preview card mock
- [x] `wireframes-v2/pages/settings-triggers.html` (42.0KB) — Trigger table (5 rows), inline condition builder, action list editor
- [x] `wireframes-v2/pages/settings-a2a.html` (48.4KB) — A2A protocol config, trusted agent registry, inbound policy, comms log

### Phase G: Intelligence Hub ✅ COMPLETE (2026-04-12)
- [x] `wireframes-v2/pages/intelligence-hub.html` — Agent Profile editor, Working Memory + Compact dialog, Episodic Memory browser + slide-over viewer, Semantic Memory topic list + editor, Skill Authoring (list + editor + validation panel + fork/import)
- [x] `wireframes-v2/assets/nav.js` — Intelligence Hub nav item added (brain icon, `data-page="intelligence-hub"`)
- [x] `wireframes-v2/index.html` — Phase G section card added, stats updated to 26 pages
- **PRD:** `docs/prd/15-intelligence-hub.md`
- **Eval score:** 4.30 / 5.0 — **✅ PASS**
- **Status:** COMPLETE ✓

#### Phase G Evaluation Results (2026-04-12)

| Page | Weighted Avg | Verdict |
|------|-------------|---------|
| intelligence-hub.html | 4.30 | ✅ PASS |

**Post-eval fixes applied:** tablet ih-nav horizontal collapse, mobile episodic table column drop, semantic memory mobile stack, editor gutter hidden on mobile, dark mode rgba opacity increase, focus trap on all modals/slide-over, `role="table"` on episodic wrapper, duplicate `display:none` removed.

### Phase E: Marketplace, Registry & Admin (P2/P3)
- [x] `wireframes-v2/pages/skill-marketplace.html` — Browse/install skills
- [x] `wireframes-v2/pages/mcp-registry.html` — MCP server registry + health
- [x] `wireframes-v2/pages/admin-panel.html` — User management, audit logs, system health
- **Status:** COMPLETE ✓

### Phase E Evaluation Results (2026-04-10)
Full evaluation by cockpit-evaluator. Reviews: `wireframes-v2/reviews/`

| Page | Weighted Avg | Verdict |
|------|-------------|---------|
| index.html | 4.21 | ✅ PASS |
| goal-view.html | 4.16 | ✅ PASS |
| my-tasks.html | 4.07 | ✅ PASS |
| project-view.html | 3.71 | ✅ PASS |
| timeline-view.html | 3.66 | ✅ PASS |
| resource-view.html | 3.66 | ✅ PASS |
| task-detail.html | 4.25 | ✅ PASS |
| agent-monitor.html | 4.37 | ✅ PASS |
| chat-sidebar.html | 3.91 | ✅ PASS |
| chat-fullpage.html | 4.24 | ✅ PASS |
| canvas-editor.html | 4.09 | ✅ PASS |
| settings-channels.html | 3.88 | ✅ PASS |
| settings-llm.html | 3.88 | ✅ PASS |
| settings-scoring.html | 4.09 | ✅ PASS |
| settings-briefing.html | 3.88 | ✅ PASS |
| settings-triggers.html | 3.96 | ✅ PASS |
| settings-a2a.html | 4.04 | ✅ PASS |
| skill-marketplace.html | 4.28 | ✅ PASS |
| mcp-registry.html | 3.96 | ✅ PASS |
| admin-panel.html | 4.22 | ✅ PASS |
| **Portfolio Average** | **4.03** | **✅ ALL PASS** |

**Top blockers for Phase F:** (1) Toggle `role="switch"` accessibility across all pages, (2) index.html stale stats counter ✅ fixed, (3) Filter input missing `aria-label`, (4) canvas-editor mobile strategy, (5) goal-view 3-col responsive breakpoints.

### Phase E+ — UI Polish & Shared System (2026-04-10) ✅ BASELINE

> **Baseline version** — git tag `v2-baseline`. All 25 pages wired, evaluated, and polished.

#### Shared Assets Added
- [x] `assets/nav.js` — Injects complete sidebar into all pages via `data-page` attribute. Logo image, full nav links, settings sub-nav, active state highlighting.
- [x] `assets/theme.js` — Theme picker (6 themes) + collapsible sidebar. JS-driven show/hide bypasses responsive media query. localStorage persistence.
- [x] `wire_nav.py` — Idempotent wiring script: adds `data-page` and script tags to all 25 pages.

#### 5 UI Changes (Evaluator score: 3.73/5.0 — all PASS)
1. **Theme picker dropdown** — replaces dark/light toggle. 6 themes with color swatches, persistent, fully accessible (aria-haspopup, arrow keys, Escape).
2. **Collapsible sidebar** — `≡` hamburger collapses to 56px icon rail. `aria-expanded` updates. State persists to localStorage.
3. **Logo transparency** — `mix-blend-mode:multiply` (light) / `screen` (dark). `isolation:isolate` prevents bleed. No white halo.
4. **Removed "GraphClaw" text** — logo image fills header. *Cockpit* italic label below logo (`aria-hidden`).
5. **Nav badge tokens** — Agent Monitor badge uses `var(--state-progress)`, Skills badge uses `var(--state-delayed)`.

#### Evaluator Builder Instructions Applied
- `aria-expanded` + `aria-label` on sidebar toggle button
- Arrow key navigation inside theme picker menu (`menuitemradio` ARIA pattern)
- `--btn-swatch-border` CSS variable defined per theme block
- `borderColor` sync on picker swatch when theme changes
- `isolation:isolate` on sidebar element
- `setProperty('display', ..., 'important')` in JS beats media query `display:none`

#### Index Hub Updated
- Stats: 25 pages, Phases A–E, 4.03 eval score (was stale "1 Complete / 18 Remaining")

## Page Priority Map

### P1 — Must Have (Core Experience)
1. Design system + shared CSS
2. Goal view (primary graph view)
3. My Tasks (personal dashboard)
4. Task detail (side panel + full page)
5. Chat sidebar
6. Agent monitor
7. Settings: channels, LLM, scoring
8. Shell navigation + header

### P2 — Should Have (Feature Complete)
9. Project view (Kanban)
10. Resource view (workload)
11. Timeline view (Gantt)
12. Canvas editor
13. Chat full page
14. Settings: briefing, triggers, A2A
15. Skill marketplace
16. MCP registry

### P3 — Nice to Have (Admin/Advanced)
17. Admin panel (users, audit, system)
18. Approval flows
19. Onboarding wizard
20. Advanced filter/search overlays

### Phase F: Backend API Implementation (Active)

All API work lives in `c:/Users/abhis/Projects/graphclaw/src/graphclaw/api/`.

| Wave | Files | Endpoints | Status |
|------|-------|-----------|--------|
| **Wave 1** | `deps.py`, `graph.py`, `scoring.py`, `state.py`, `events.py` | 18 + SSE | 🔄 In progress |
| **Wave 2** | `approvals.py`, `settings.py`, `skill_registry.py`, `mcp_registry.py` (stub→real) | 15 | ⬜ Pending |
| **Wave 3** | `chat.py`, `config.py`, `secrets.py` | 12 | ⬜ Pending |
| **Wave 4** | `settings.py` (+8 new), `agent.py` | 14 | ⬜ Pending |
| **Wave 5** | `skill_registry.py` (+4), `mcp_registry.py` (+2), `agents.py` | 13 | ⬜ Pending |
| **Wave 6** | `admin/` (9 files) | 45 | ⬜ Pending |

**Cockpit impact by wave:**
- Wave 1 → Graph Cockpit (§02), Task Views (§12), Explainability (§08), real-time badges across all views
- Wave 2 → Approvals (§07), Settings stub panels functional
- Wave 3 → Chat Interface (§13), Config & Secrets (§14)
- Wave 4 → Full Settings Panel (§05), Agent Monitor (§03)
- Wave 5 → Skill Marketplace (§06), MCP Registry (§07), Canvas Editor (§04)
- Wave 6 → Admin Panel (§09)

---

## Progress Log

| Date | Phase | Page | Action | Verdict |
|------|-------|------|--------|---------|
| 2026-04-10 | F | Backend API Wave 1 | Started build | In progress |
| 2026-04-12 | G | intelligence-hub.html | Built — 5 sub-sections (Profile, Working, Episodic, Semantic, Skill Authoring) | ✅ PASS 4.30/5 |
| 2026-04-12 | G | intelligence-hub.html | Post-eval fixes: mobile layout, dark mode tints, focus traps, role=table | ✅ |
| 2026-04-12 | G | nav.js | Intelligence Hub nav item added | ✅ |
| 2026-04-12 | G | index.html | Phase G card + stats 26 pages | ✅ |
