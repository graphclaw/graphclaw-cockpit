# GraphClaw Cockpit — E2E Test Scenarios

> Playwright E2E test catalog for the deployed cockpit application.
> Tests run against Docker-deployed stack (cockpit:3000 + gateway:8000).

**Version:** 1.0 | **Date:** 2026-04-14

---

## Test Infrastructure

### Environment
- Cockpit: http://localhost:3000 (nginx + React SPA)
- Backend: http://localhost:8000 (FastAPI gateway)
- Auth: `POST /auth/dev-token` for automated login
- Stack: `docker compose up -d --build`
- Run: `docker compose --profile test run --rm e2e`

### Browsers
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- Mobile (iPhone 14)

### Auth Fixture
All tests extend a shared fixture that authenticates via dev-token:
```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
export const test = base.extend({
  page: async ({ page }, use) => {
    const res = await page.request.post('/auth/dev-token');
    const { access_token } = await res.json();
    await page.context().addCookies([{
      name: 'access_token', value: access_token,
      domain: 'localhost', path: '/',
    }]);
    await use(page);
  },
});
```

---

## TS-G01: Global — Authentication Flow

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| G01.1 | Unauthenticated redirect | Visit /goals without token | Redirect to /login |
| G01.2 | OAuth login | Click "Login with Google" | Redirect to IdP, return to /goals |
| G01.3 | Dev token login | POST /auth/dev-token | Cookie set, /goals loads |
| G01.4 | Token refresh | Wait 14min (mock), trigger API call | New token issued transparently |
| G01.5 | Logout | Click avatar → Logout | Cookies cleared, redirect to /login |

**File:** `e2e/global/auth-flow.spec.ts`

---

## TS-G02: Global — Navigation & Theme

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| G02.1 | Sidebar nav | Click each nav item | Correct route loads, active state set |
| G02.2 | Sidebar collapse | Click collapse toggle | Width 240→56px, labels hidden, persisted |
| G02.3 | Theme switch | Select "Midnight Blue" from picker | `data-theme="midnight"` on html, persisted |
| G02.4 | Command palette | Press Ctrl+K, type "settings" | Filtered results, Enter navigates |
| G02.5 | Mobile bottom nav | Resize to 375px | Sidebar hidden, bottom nav visible |
| G02.6 | Breadcrumbs | Navigate to /settings/llm | Breadcrumbs show "Settings > LLM Providers" |

**Files:** `e2e/global/navigation.spec.ts`, `e2e/global/theme-toggle.spec.ts`

---

## TS-01: Goal View

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 01.1 | Load goals | Navigate to / | Cytoscape graph renders with goal nodes |
| 01.2 | View switcher | Click Tree → Flat → Heatmap | Layout changes accordingly |
| 01.3 | Select goal | Click goal node | Detail panel opens on right |
| 01.4 | Create goal | Click "New Goal", fill form, save | Node appears in graph, API 201 |
| 01.5 | Edit goal | Double-click goal → edit title → save | Title updates, API PATCH success |
| 01.6 | Navigate to task | Click task row in goal detail | Task detail panel opens |

**File:** `e2e/graph/goal-view.spec.ts`
**API:** GET/POST/PATCH /app/v1/graph/goals, GET /app/v1/graph/goals/{id}/tree

---

## TS-02: My Tasks

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 02.1 | Load tasks | Navigate to /tasks | Table renders with task rows |
| 02.2 | Filter by status | Click "Blocked" chip | Only blocked tasks shown |
| 02.3 | Sort by score | Click score column header | Rows reorder descending |
| 02.4 | Mark done | Click checkmark on task row | State → DONE, row updates |
| 02.5 | Search | Type "deploy" in search | Filtered to matching tasks |
| 02.6 | Pagination | Scroll past 50 items | Next page loads seamlessly |
| 02.7 | Saved filter | Save "My Blockers" preset | Preset appears in dropdown, reloads correctly |

**File:** `e2e/graph/my-tasks.spec.ts`
**API:** GET /app/v1/graph/tasks, POST /app/v1/tasks/{id}/transition

---

## TS-03: Project View

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 03.1 | Project tabs | Click different project tab | Task cards filter to that project |
| 03.2 | Kanban view | Default view loads | 4 columns with draggable cards |
| 03.3 | Add task | Click "Add Task" → fill → save | Card appears in correct column |
| 03.4 | Table view | Switch to Table view | Dense table renders |

**File:** `e2e/graph/project-view.spec.ts`

---

## TS-04: Task Detail

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 04.1 | Open detail | Click task from My Tasks | Side panel slides in |
| 04.2 | Tab navigation | Click Activity → Notes → Linked Tasks | Tab content switches |
| 04.3 | Score breakdown | View score section | 7-factor table renders |
| 04.4 | Approve task | Click "Approve" button | State transitions, toast confirms |
| 04.5 | Add comment | Type comment → Send | Comment appears in activity feed |

**File:** `e2e/graph/task-detail.spec.ts`
**API:** GET /app/v1/tasks/{id}, POST /app/v1/tasks/{id}/transition, POST /app/v1/approvals/{id}/approve

---

## TS-05: Timeline View

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 05.1 | Gantt render | Navigate to /timeline | Bars and milestones render |
| 05.2 | Zoom levels | Click Week → Month → Quarter | Time scale adjusts |
| 05.3 | Dependency arrows | View dependency edges | SVG arrows connect dependent tasks |

**File:** `e2e/graph/timeline-view.spec.ts`

---

## TS-06: Agent Monitor

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 06.1 | KPI strip | Navigate to /agent-monitor | 4 KPI cards with values |
| 06.2 | Agent cards | View agent grid | Cards show status, heartbeat bars |
| 06.3 | Pause agent | Click "Pause" on running agent | Status changes to paused |
| 06.4 | Event log filter | Filter by "ERROR" severity | Only error events shown |
| 06.5 | Fire trigger | Click "Fire Now" on trigger | Success toast, trigger fires |

**File:** `e2e/agent/agent-monitor.spec.ts`
**API:** GET /app/v1/agent/status, POST /app/v1/agent/triggers/{id}/fire

---

## TS-07: Scoring & Explainability

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 07.1 | Score card | Open task → view score | 7-factor table + NL summary |
| 07.2 | History chart | Navigate to score history | Recharts timeline renders |
| 07.3 | Simulator | Adjust "urgency" slider | Score recalculates live |

**File:** `e2e/agent/scoring.spec.ts`
**API:** GET /app/v1/scoring/tasks/{id}, POST /app/v1/scoring/simulate

---

## TS-08: Settings — Channels

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 08.1 | View channels | Navigate to /settings/channels | Channel cards with status |
| 08.2 | Configure email | Click Configure on Email | Wizard opens, IMAP form displayed |
| 08.3 | Save settings | Fill form → Save | Toast confirms, API PATCH 200 |
| 08.4 | Discard changes | Modify → Discard | Form resets to saved values |

**File:** `e2e/settings/channels.spec.ts`

---

## TS-09: Settings — LLM Providers

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 09.1 | Select provider | Choose Anthropic from dropdown | Model list updates |
| 09.2 | API key input | Enter key, toggle visibility | Key masked/unmasked |
| 09.3 | Temperature slider | Drag to 0.7 | Value display updates |

**File:** `e2e/settings/llm-providers.spec.ts`

---

## TS-10: Settings — Scoring Weights

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 10.1 | Adjust W1 | Drag slider up | Other sliders auto-normalize, sum = 1.0 |
| 10.2 | Live preview | Change weights + enter sample task | Score preview recalculates |
| 10.3 | Reset defaults | Click "Reset Defaults" | All 7 sliders return to original |

**File:** `e2e/settings/scoring-weights.spec.ts`

---

## TS-11: Settings — A2A Keys

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.1 | Generate key | Click "Generate API Key" | Key shown once, copy button works |
| 11.2 | Revoke key | Click revoke → confirm | Key removed from list |

**File:** `e2e/settings/a2a-keys.spec.ts`

---

## TS-12: Skill Marketplace

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 12.1 | Installed tab | View installed skills | Table with toggles and actions |
| 12.2 | Browse tab | Switch to Browse | Remote skill cards render |
| 12.3 | Install skill | Click Install → confirm | Skill added to Installed tab |
| 12.4 | Uninstall skill | Click Uninstall → confirm | Skill removed |
| 12.5 | Toggle skill | Click enable/disable toggle | Status changes |

**File:** `e2e/marketplace/skill-marketplace.spec.ts`
**API:** GET /app/v1/skills, POST /app/v1/skills/install, DELETE /app/v1/skills/{id}

---

## TS-13: MCP Registry

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 13.1 | Server list | View MCP servers | Table with trust tier badges |
| 13.2 | Register server | Fill custom form → Register | Server appears in list |
| 13.3 | Change trust | Switch from AUTO to GATED | Badge updates, pending approvals enabled |
| 13.4 | View tools | Click server → tools | Tool list renders |

**File:** `e2e/marketplace/mcp-registry.spec.ts`
**API:** GET/POST/PATCH /app/v1/mcp-servers, GET /app/v1/mcp-servers/{id}/tools

---

## TS-14: Canvas Editor

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 14.1 | Canvas load | Navigate to /canvas | React Flow canvas with dot grid |
| 14.2 | Drag node | Drag "Task" from palette to canvas | New node appears at drop position |
| 14.3 | Connect edges | Drag from output port to input port | Edge renders between nodes |
| 14.4 | Node config | Click node → edit properties | Right panel shows config form |
| 14.5 | Save graph | Click Save | Toast confirms, API POST success |
| 14.6 | Undo/redo | Add node → Ctrl+Z → Ctrl+Shift+Z | Node removed then restored |
| 14.7 | Zoom controls | Click fit-view | Canvas zooms to show all nodes |

**File:** `e2e/canvas/canvas-editor.spec.ts`
**API:** GET/POST/PATCH/DELETE /app/v1/agents/{id}

---

## TS-15: Intelligence Hub

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 15.1 | Agent selector | Switch agent in dropdown | Content refreshes for selected agent |
| 15.2 | Edit profile | Modify profile → Save | Toast confirms, Monaco content persisted |
| 15.3 | Dirty guard | Edit profile → click Working Memory | Confirm dialog appears |
| 15.4 | Compact memory | Click Compact → fill dialog → submit | Working memory archived to episodic |
| 15.5 | View episodic | Click row → slide-over | Read-only Monaco shows content |
| 15.6 | New topic | Enter slug → validate → Save | New semantic topic created |
| 15.7 | Validate skill | Click Validate on skill | Validation panel: green valid / red invalid |

**File:** `e2e/intelligence/intelligence-hub.spec.ts`
**API:** GET/PUT /app/v1/intelligence/agents/{id}/profile, etc.

---

## TS-16: Chat Interface

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 16.1 | Open sidebar | Click chat icon | 350px panel slides in |
| 16.2 | Send message | Type "hello" → Send | Message appears, agent responds |
| 16.3 | Typing indicator | After send, before response | Animated dots visible |
| 16.4 | Fullpage mode | Click expand | Navigates to /chat with conversation list |
| 16.5 | Code block | Agent returns code | Syntax highlighted, copy button works |
| 16.6 | Inline card | Agent references task | Task Card renders with link |

**Files:** `e2e/chat/chat-sidebar.spec.ts`, `e2e/chat/chat-fullpage.spec.ts`
**API:** POST /app/v1/chat/messages, WS /app/v1/chat/ws

---

## TS-17: Admin Panel

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 17.1 | Role gate | Login as MEMBER → visit /admin | Redirect to / (admin hidden) |
| 17.2 | Invite member | Click Invite → fill email + role → Send | New member row in table |
| 17.3 | Change role | Select new role for existing member | Role badge updates |
| 17.4 | Feature toggle | Toggle "MCP Connectors" | Feature gate updates |
| 17.5 | View audit log | Switch to Audit Log tab | Table with timestamped entries |
| 17.6 | Guardrails editor | Open XML editor → modify → Validate | Validation result displayed |

**File:** `e2e/admin/admin-panel.spec.ts`
**API:** GET/POST/PATCH /app/v1/admin/members, GET/PUT /app/v1/admin/features

---

## TS-18: SSE Real-Time Updates

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 18.1 | SSE connect | Login and navigate to /goals | EventSource opens to /app/v1/events |
| 18.2 | Task update | Backend emits task.state_changed | Graph node color updates without refresh |
| 18.3 | Approval notify | Backend emits approval.pending | Toast notification appears |
| 18.4 | Reconnect | Kill SSE → wait | Auto-reconnects within 5s |

**File:** Integrated into relevant spec files (goal-view, agent-monitor)
**API:** SSE at /app/v1/events

---

## Summary

| Area | Test Files | Scenarios |
|------|-----------|-----------|
| Global (Auth + Nav + Theme) | 3 | 11 |
| Graph Views + Tasks | 5 | 20 |
| Agent + Scoring | 2 | 8 |
| Settings | 4 | 14 |
| Marketplace | 2 | 9 |
| Canvas Editor | 1 | 7 |
| Intelligence Hub | 1 | 7 |
| Chat | 2 | 6 |
| Admin Panel | 1 | 6 |
| SSE Real-Time | — | 4 |
| **Total** | **21** | **92+** |
