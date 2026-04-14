# 16 — React Implementation

**Version:** 1.0 | **Date:** 2026-04-14 | **Status:** Draft

---

## 16.1 Purpose

This PRD defines the implementation specification for converting the GraphClaw Cockpit wireframes (Phase A–G, 26 pages) into a production React single-page application connected to the GraphClaw backend API gateway.

---

## 16.2 Scope

- React 19 + TypeScript strict SPA
- All 26 wireframe pages faithfully implemented
- Full integration with 131 backend API routes under `/app/v1/`
- Docker containerized deployment (nginx + reverse proxy)
- Playwright E2E test suite against deployed stack
- 6-theme support with responsive design at 3 breakpoints

---

## 16.3 Software Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React 19 + TypeScript 5.x strict | PRD §10 requirement |
| Build | Vite 6 | Fast HMR, native ESM |
| UI Primitives | shadcn/ui (Radix UI + Tailwind CSS 4) | Accessible, themeable |
| Graph Visualization | Cytoscape.js + cytoscape-dagre | Large graph perf, native layouts |
| Canvas Editor | React Flow (@xyflow/react) | Drag-and-drop workflow builder |
| API Client | openapi-fetch + openapi-typescript | Typed fetch from OpenAPI spec |
| Server State | TanStack Query v5 | Cache, pagination, SSE invalidation |
| Client State | Zustand v5 | Theme, sidebar, undo/redo, filters |
| Code Editor | @monaco-editor/react | Profile, memory, skills, guardrails |
| Routing | React Router v7 | Nested layouts, lazy loading |
| Real-Time | SSE + WebSocket | Graph events + bidirectional chat |
| Charts | Recharts | Bar, line, pie for Agent Monitor |
| Forms | React Hook Form + Zod | Settings, admin config validation |
| Testing | Vitest + RTL + MSW 2.x + Playwright | Unit, component, E2E |
| Lint | ESLint 9 + Prettier | Strict TypeScript rules |

---

## 16.4 Architecture

### Directory Structure

Feature-based organization under `src/features/` with shared components in `src/components/`, stores in `src/stores/`, and library code in `src/lib/`.

### State Architecture

- **Server state:** TanStack Query v5 manages all API data (cache, background refetch, optimistic updates, SSE-triggered invalidation).
- **Client state:** Zustand v5 stores manage UI-only state (theme, sidebar collapse, selected entities, undo/redo stack, filter presets). Persisted to localStorage where appropriate.
- **API layer:** openapi-fetch with types generated from `/openapi.json`. All API calls flow through a single client instance with Bearer token injection.
- **Real-time:** SSE at `/app/v1/events` triggers targeted TanStack Query cache invalidation. WebSocket at `/app/v1/chat/ws` handles bidirectional chat with auto-reconnect.
- **Auth:** OAuth 2.0 PKCE → RS256 JWT in httpOnly cookies. Auto-refresh via 14-minute timer.

---

## 16.5 Deployment

### Container Architecture

```
┌─────────────────┐     ┌──────────────────┐
│   cockpit:3000  │────▶│  gateway:8000    │
│   (nginx + SPA) │     │  (FastAPI/uvicorn)│
└─────────────────┘     └──────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
              ┌─────┴───┐ ┌──┴──┐ ┌───┴───┐
              │ db:5432  │ │redis│ │ minio │
              │ PG + AGE │ │:6379│ │ :9000 │
              └─────────┘ └─────┘ └───────┘
```

- **Dockerfile:** Multi-stage build (node:22-alpine → nginx:1.27-alpine)
- **nginx:** Reverse-proxies `/app/v1/*` and `/auth/*` to `gateway:8000`. Handles WebSocket upgrade for `/app/v1/chat/ws`. SPA fallback via `try_files`.
- **Docker Compose:** Orchestrates cockpit + gateway + Postgres/AGE + Redis + MinIO + Playwright E2E runner.
- **Health check:** Cockpit at `/health`, Gateway at `/health`.
- **Static assets:** Immutable caching with 1-year expiry on `/assets/`.

---

## 16.6 Testing Strategy

### Unit & Component Tests (per wave)
- **Framework:** Vitest + React Testing Library
- **API Mocking:** MSW 2.x service worker handlers
- **Coverage:** Co-located `*.test.tsx` files next to each component
- **Focus:** Component rendering, hook behavior, store logic, form validation

### End-to-End Tests (Wave 12)
- **Framework:** Playwright
- **Environment:** Docker Compose full stack (cockpit + real backend)
- **Browsers:** Chromium, Firefox, Mobile (iPhone 14)
- **Auth:** Shared fixture using `POST /auth/dev-token`
- **Scenarios:** 18 test files, 100+ scenarios covering all 20 content pages
- **Reports:** HTML reporter, screenshots on failure, traces on first retry

### CI Pipeline
```
npm ci → typecheck → lint → unit tests → build → E2E (Playwright)
```

---

## 16.7 Wave Delivery Plan

12 waves, each independently testable. Full details in `build-plan.md`.

| Wave | Scope | API Routes |
|------|-------|------------|
| 1 | Scaffold + Design System + 6 Themes | 0 |
| 2 | API Client + Auth + MSW | 5 |
| 3 | App Shell + Navigation + Routing | 0 |
| 4 | Graph Views (Cytoscape) + Task Table + Detail | ~15 |
| 5 | Agent Monitor + Scoring + Explainability | ~16 |
| 6 | Settings (6 pages) + Config + Secrets | ~21 |
| 7 | Skill Marketplace + MCP Registry + Approvals | ~21 |
| 8 | Canvas Editor (React Flow) | ~7 |
| 9 | Intelligence Hub (5 sub-panels + Monaco) | ~20 |
| 10 | Chat (WebSocket) + SSE Real-Time | ~5 + WS + SSE |
| 11 | Admin Panel (9 modules) | ~45 |
| 12 | Docker + Playwright E2E + Polish | 0 |

---

## 16.8 Backend Changes Required

| Change | File | Wave |
|--------|------|------|
| Add `CORSMiddleware` (allow cockpit origin) | `graphclaw/src/graphclaw/gateway/app.py` | 2 |
| Add WebSocket endpoint for chat | `graphclaw/src/graphclaw/api/chat.py` | 10 |
| Ensure dev-token works in Docker | `graphclaw/src/graphclaw/auth/routes.py` | 12 |

---

## 16.9 Acceptance Criteria

1. All 26 wireframe pages implemented with visual fidelity matching wireframes
2. All 131 backend API routes integrated and functional
3. 6 themes work correctly across all pages
4. Responsive at 3 breakpoints (mobile <768px, tablet 768-1024px, desktop >1024px)
5. Playwright E2E suite passes against Docker-deployed stack (100+ scenarios)
6. Lighthouse audit: 90+ performance, 100 accessibility
7. Zero TypeScript errors, zero lint warnings
8. Docker Compose `up -d --build` brings up full stack with health checks passing
