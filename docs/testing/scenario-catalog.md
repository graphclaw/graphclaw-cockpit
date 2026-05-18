# Scenario Catalog — graphclaw-cockpit

> Supersedes `docs/e2e-test-scenarios.md`. Test IDs in `GC-E-*` format. IDs marked `TODO` will be allocated when tests are implemented. Run `node scripts/regen-inventory.mjs` to regenerate from test headers.

---

## Infrastructure

- Cockpit: http://localhost:3000 (nginx + React SPA)
- Backend: http://localhost:8000 (FastAPI gateway)
- Auth: `POST /auth/dev-token` for automated login
- Stack: `docker compose up -d --build`
- Run: `npm run test:e2e` or `docker compose --profile test run --rm e2e`
- Fixtures: `e2e/fixtures/test.ts` (merged base with `page`, `auth`, `db`, `minio`, `api`, `seed`)

---

## Global

### Auth flow

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| GC-E-AUT-W12-001 | Unauthenticated redirect | Visit /goals without token | Redirect to /login | `e2e/specs/auth/auth-flow.spec.ts` |
| GC-E-AUT-W12-002 | Dev token login | POST /auth/dev-token | Cookie set, /goals loads | `e2e/specs/auth/auth-flow.spec.ts` |
| GC-E-AUT-W12-003 | Token refresh | Trigger API call after expiry | New token issued transparently | `e2e/specs/auth/auth-flow.spec.ts` |
| GC-E-AUT-W12-004 | Logout | Click avatar → Logout | Cookies cleared, redirect to /login | `e2e/specs/auth/auth-flow.spec.ts` |
| TODO | OAuth login (Google) | Click "Login with Google" | Redirect to IdP, return to /goals | `e2e/specs/auth/auth-flow.spec.ts` |

### Navigation & theme

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| TODO | Sidebar nav | Click each nav item | Correct route loads, active state set | `e2e/specs/global/navigation.spec.ts` |
| TODO | Sidebar collapse | Click collapse toggle | Width 240→56px, labels hidden, persisted | `e2e/specs/global/navigation.spec.ts` |
| TODO | Theme switch | Select "Midnight Blue" | `data-theme="midnight"` on html, persisted | `e2e/specs/global/theme-toggle.spec.ts` |
| TODO | Command palette | Press Ctrl+K, type "settings" | Filtered results, Enter navigates | `e2e/specs/global/navigation.spec.ts` |

---

## Graph

### Goal view

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| GC-E-GRA-W12-001 | Load goals graph | Navigate to / | Cytoscape graph renders with goal nodes | `e2e/specs/graph/goal-view.spec.ts` |
| GC-E-GRA-W12-002 | View switcher | Click Tree → Flat → Heatmap | Layout changes | `e2e/specs/graph/goal-view.spec.ts` |
| GC-E-GRA-W12-003 | Select goal | Click goal node | Detail panel opens | `e2e/specs/graph/goal-view.spec.ts` |
| GC-E-GRA-W12-004 | Create goal | Click "New Goal", fill, save | Node appears, API 201, DB row created | `e2e/specs/graph/goal-view.spec.ts` |
| GC-E-GRA-W12-005 | Edit goal | Double-click → edit title → save | Title updates, API PATCH 200 | `e2e/specs/graph/goal-view.spec.ts` |

### Tasks

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| GC-E-GRA-W12-010 | Load tasks | Navigate to /tasks | Table renders with task rows | `e2e/specs/graph/my-tasks.spec.ts` |
| GC-E-GRA-W12-011 | Filter by status | Click "Blocked" chip | Only blocked tasks shown | `e2e/specs/graph/my-tasks.spec.ts` |
| GC-E-GRA-W12-012 | Mark done | Click checkmark on task | State → DONE, DB updated | `e2e/specs/graph/my-tasks.spec.ts` |
| TODO | Task detail panel | Click task from list | Side panel slides in, all tabs load | `e2e/specs/graph/task-detail.spec.ts` |
| TODO | Score breakdown | View score section in detail | 7-factor table + NL summary | `e2e/specs/graph/task-detail.spec.ts` |
| TODO | Approve task | Click "Approve" button | State transitions, DB audit row | `e2e/specs/graph/task-detail.spec.ts` |

---

## Intelligence

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| GC-E-INT-W16-001 | Intelligence entries shown | Navigate to intelligence tab | List of entries or empty state | `e2e/specs/intelligence/intelligence.spec.ts` |
| GC-E-INT-W16-002 | Content matches editor display | Click entry | Editor displays correct content | `e2e/specs/intelligence/intelligence.spec.ts` |
| GC-E-INT-W16-003 | Nav tabs navigate correctly | Click each sub-tab | Correct content panel loads | `e2e/specs/intelligence/intelligence.spec.ts` |
| GC-E-INT-W16-004 | Save to MinIO | Edit content → save | Content persists to MinIO bucket | `e2e/specs/intelligence/intelligence.spec.ts` |
| GC-E-INT-W16-005 | Fetch from MinIO via API | Reload page | Content matches stored MinIO content | `e2e/specs/intelligence/intelligence.spec.ts` |

---

## Chat

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| TODO | Start conversation | Navigate to /chat, send first message | Response appears, session ID created | `e2e/specs/chat/chat-session.spec.ts` |
| TODO | Token streaming | Send message | Tokens appear incrementally (SSE) | `e2e/specs/chat/chat-session.spec.ts` |
| TODO | Message persists | Send message, reload | Message history intact from DB | `e2e/specs/chat/chat-session.spec.ts` |

---

## Agent Monitor

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| TODO | KPI strip | Navigate to /agent-monitor | 4 KPI cards with values | `e2e/specs/agent/agent-monitor.spec.ts` |
| TODO | Agent cards | View agent grid | Cards show status, heartbeat bars | `e2e/specs/agent/agent-monitor.spec.ts` |
| TODO | Pause agent | Click "Pause" on running agent | Status changes, API POST confirmed | `e2e/specs/agent/agent-monitor.spec.ts` |

---

## Settings

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| TODO | Configure channel | Click Configure on Email | Wizard opens, form displayed | `e2e/specs/settings/channels.spec.ts` |
| TODO | Save channel settings | Fill form → Save | Toast confirms, API PATCH 200 | `e2e/specs/settings/channels.spec.ts` |
| TODO | Select LLM provider | Choose Anthropic | Model list updates | `e2e/specs/settings/llm-providers.spec.ts` |
| TODO | Scoring weight normalisation | Drag W1 slider | Other sliders auto-normalize, sum = 1.0 | `e2e/specs/settings/scoring-weights.spec.ts` |
| DEFERRED | A2A key management moved out of current Settings scope | See A2A section below | Future implementation only | `docs/planning/a2a-future-release-design-plan.md` |

---

## Marketplace

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| TODO | Installed skills | View installed skills | Table with toggles and actions | `e2e/specs/marketplace/skills.spec.ts` |
| TODO | Install skill | Click Install → confirm | Skill added, DB row created | `e2e/specs/marketplace/skills.spec.ts` |
| TODO | MCP registry browse | Navigate to MCP tab | Remote MCP server cards render | `e2e/specs/marketplace/mcp.spec.ts` |
| TODO | Register MCP server | Fill form → Register | Server entry appears, DB created | `e2e/specs/marketplace/mcp.spec.ts` |

---

## Canvas (React Flow editor)

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| TODO | Load canvas | Navigate to /canvas | React Flow canvas renders | `e2e/specs/canvas/canvas-editor.spec.ts` |
| TODO | Add node | Drag from palette | Node appears on canvas | `e2e/specs/canvas/canvas-editor.spec.ts` |
| TODO | Connect nodes | Drag edge from output to input | Edge renders, saved to backend | `e2e/specs/canvas/canvas-editor.spec.ts` |

---

## Admin

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| TODO | User list | Navigate to /admin/users | All users listed | `e2e/specs/admin/users.spec.ts` |
| TODO | Invite user | Click "Invite" → fill email → send | Invitation row created | `e2e/specs/admin/users.spec.ts` |

---

## A2A

Status: Deferred for current release.

Design source for future implementation:
`docs/planning/a2a-future-release-design-plan.md`

| ID | Scenario | Steps | Expected | File |
|---|---|---|---|---|
| DEFERRED-A2A-01 | A2A key lifecycle (future Integrations UX) | Register agent, rotate key, revoke key | Lifecycle operations succeed with audit events | `e2e/a2a/a2a-keys.spec.ts` |
| DEFERRED-A2A-02 | Orchestrator outbound trigger to external A2A | Delegate from orchestrator to external callback URL | External agent receives callback with correlation metadata | `e2e/a2a/a2a-orchestrator-trigger.spec.ts` |
| DEFERRED-A2A-03 | Real external-agent roundtrip | Trigger external agent then send task-update back | Inbound update accepted and state pipeline completes | `e2e/a2a/a2a-roundtrip.spec.ts` |

---

_Last updated: 2026-05-18. IDs prefixed `TODO` need implementation. Deferred entries are future-release scope. Run `node scripts/regen-inventory.mjs` to sync from implemented test headers._
