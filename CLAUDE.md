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
