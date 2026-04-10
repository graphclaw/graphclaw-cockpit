# 10 — Technical Specification

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

---

## 10.1 Framework

- **React 19+** (latest stable) — single-page application
- **TypeScript** — all UI code must be typed (strict mode)
- Separate GitHub repository from the `graphclaw` Python backend
- Build tool: Vite

---

## 10.2 Graph Visualization

Choose one:

| Library | Strengths |
|---------|-----------|
| **Cytoscape.js** (`cytoscape/cytoscape.js`) | Mature graph rendering, extensive layout algorithms (dagre, cose, breadthfirst), zoom/pan/hover, large graph performance |
| **React Flow** (`xyflow/xyflow`) | React-native nodes/edges, customizable node components, built-in minimap/controls, better DX for React-idiomatic development |

The specific choice is a technical decision for the implementation phase. Both support all required interactions (node/edge rendering, drag, zoom, pan, selection, custom nodes, layout algorithms).

---

## 10.3 Canvas Editor

- **React Flow** (`xyflow/xyflow`) — for the node-based agent workflow builder
- Custom node types for each canvas node (LLM Call, Tool Call, Condition, etc.)
- Custom edge components for data flow wires
- Minimap for canvas overview
- Node palette (draggable sidebar)

---

## 10.4 UI Component Library

- **shadcn/ui** — Radix UI primitives + Tailwind CSS
- All non-graph UI: settings panels, modals, forms, tables, cards, toasts, dropdowns, tabs
- Theme: light/dark mode toggle, CSS variables for theming

---

## 10.5 Data Fetching

- **TanStack Query** (`@tanstack/react-query`) — server state management
- All API calls go through TanStack Query for:
  - Caching (stale-while-revalidate)
  - Background refetch
  - Optimistic updates (for inline edits)
  - Error/retry handling
- SSE events trigger targeted query invalidation (not full refetch)

---

## 10.6 Code & XML Editor

- **Monaco Editor** (`@monaco-editor/react`) — for:
  - SKILL.md system prompt editing
  - Agent definition JSON viewing
  - XML guardrail rule editing (with XML syntax highlighting and validation)
  - Raw JSON/YAML config inspection

---

## 10.7 Authentication

- Platform JWT (RS256, 15-minute expiry) issued after authentication
- JWT delivered as `httpOnly`, `Secure`, `SameSite=Strict` cookie — never accessible via JavaScript
- Refresh token (opaque, 256-bit random) in a separate `httpOnly` cookie
- Auto-refresh: when access token expires, frontend transparently calls `/auth/refresh`
- Supported identity providers:
  - **OAuth 2.0**: Google Workspace, Microsoft Entra ID, GitHub
  - **OIDC**: Okta, Auth0, OneLogin, PingIdentity, custom OIDC
  - **SAML 2.0**: Enterprise IdPs via admin SSO configuration

### Auth Flow

```
1. User visits cockpit (unauthenticated)
2. Redirect to /auth/login?provider={provider}
3. Backend redirects to IdP authorization endpoint (with PKCE)
4. User authenticates with IdP
5. IdP redirects to /auth/callback with code + state
6. Backend validates state, exchanges code for tokens, fetches userinfo
7. Backend provisions UserNode if new user (idempotent)
8. Backend issues platform JWT → httpOnly Secure SameSite=Strict cookie
9. Backend issues refresh token → separate httpOnly cookie
10. Redirect to cockpit with cookies set
```

---

## 10.8 Real-Time Communication

| Channel | Protocol | Purpose |
|---------|----------|---------|
| Graph events | **SSE** (`/app/v1/events`) | `task.state_changed`, `task.scored`, `briefing.ready`, `approval.pending`, `skill.completed` |
| Chat | **WebSocket** (`/app/v1/chat/ws`) | Bidirectional real-time conversation with the agent |
| Settings/Registry | **TanStack Query** polling | Lower-frequency views (background refetch every 30s) |

---

## 10.9 Security Constraints

| Rule | Reason |
|------|--------|
| No secrets in `localStorage` or `sessionStorage` | Prevent XSS exfiltration |
| API keys shown only at generation time, never again | One-time disclosure pattern |
| All mutating requests include CSRF protection | `SameSite=Strict` cookies + optional `X-CSRF-Token` header |
| Credential inputs are masked (`type="password"`) | Prevent shoulder-surfing |
| Secret reference IDs only — never plaintext in UI | Config JSON stores refs, not values |
| Content Security Policy (CSP) headers | Prevent script injection |
| Subresource Integrity (SRI) for CDN assets | Prevent supply chain attacks |

---

## 10.10 Responsive Design

| Breakpoint | Layout |
|-----------|--------|
| < 768px (mobile) | Single-column, tab navigation, simplified graph (MY TASKS VIEW default) |
| 768px – 1024px (tablet) | Split views, collapsible side panels |
| > 1024px (desktop) | Full graph workspace, persistent side panels, admin panel access |

---

## 10.11 Accessibility

- WAI-ARIA roles on all interactive elements
- Keyboard navigation for graph nodes (Tab, Enter to select, Arrow keys to navigate)
- Screen reader support for task lists and detail panels
- High-contrast mode support
- Focus management for modals and side panels

---

## 10.12 Internationalization (Future)

- All user-facing strings in a translation file (i18n-ready)
- Date/time formatting using user's locale and timezone
- RTL layout support (future consideration)

---

## 10.13 Testing Strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Unit tests | Vitest | Component logic, hooks, utilities |
| Component tests | React Testing Library | UI rendering, interaction |
| Integration tests | Playwright | Full user flows (auth → graph → edit → save) |
| Visual regression | Chromatic / Percy | Graph layout, component styling |
| API mocking | MSW (Mock Service Worker) | Backend simulation for dev/test |
