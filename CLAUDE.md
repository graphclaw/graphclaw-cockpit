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
- Commit and quality-gate requirements are defined in Phase 5 and `.github/copilot-instructions.md`.

## Key Files
- `docs/planning/build-plan.md` — wave progress tracker (source of truth)
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

## Development Methodology

Follow these phases in order for every development task, without skipping steps.

### Phase 1 — Orient
1. Read CLAUDE.md, docs/planning/build-plan.md, and the relevant PRD section(s) before touching code.
2. Read existing code in the area you will modify — understand what is already there.
3. For UI work: review the relevant wireframe in wireframes-v2/pages/ before designing.

### Phase 2 — Requirements & Planning
4. Document requirements in a .md file; cross-reference existing PRDs and docs/planning/build-plan.md.
5. Validate completeness: identify edge cases, stress scenarios, and failure modes.
6. Identify gaps and ambiguities — clarify key decisions with the user before proceeding. Do not assume.
7. Update docs/planning/build-plan.md with the planned wave/task before writing any code.

### Phase 3 — Implementation
8. Write code sequentially — do not spawn parallel sub-agents (risk of system instability).
9. Write modular code following project conventions (feature-based structure, src/features/{name}/).
10. Align all API calls with the backend OpenAPI spec; no invented or assumed endpoints.
11. No stubs or fake interfaces — always use the real backend, MinIO, and GraphClaw database.

### Phase 4 — Testing & Validation
12. Run co-located unit tests after each requirement is implemented; all must pass before moving on.
13. Run actual application tests against the live Docker stack — not just unit tests.
14. For front-end: verify the UI in a browser against the wireframe; test the golden path and edge cases.
15. Use Playwright E2E tests for cockpit flows; validate data in MinIO and the GraphClaw database directly.
16. Use the CLI interface to test backend APIs directly.
17. Chat with the main orchestrating agent via CLI chat session to verify agent behavior end-to-end.
18. Log in using the Dev auth account for full authentication flow validation.

### Phase 5 — Commit & Close
19. Run the full quality gate: `npm run typecheck && npm run lint && npm run test` — all must pass.
20. Update docs/planning/build-plan.md and relevant docs to mark the wave/requirement complete.
21. Git commit per requirement and per wave using the format: `feat(wave-N): description`.

## Lifecycle Guardrails (Mandatory)

For all subsequent development waves and releases, enforce:

- `.github/copilot-instructions.md` as the operational Do/Do Not policy.
- PR-first delivery only (no direct development commits to `main`).
- Issue-linked PRs with evidence-backed closeout notes.
- Required quality gates and release automation discipline.

When instructions conflict, apply the stricter rule that preserves branch protection intent, CI quality gates, and release traceability.
