# 01 — Product Overview

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

---

## 1.1 Product Vision

GraphClaw Cockpit is the **web-based command center** for the GraphClaw task graph management system. It gives users a visual window into the property graph that the orchestrating agent manages on their behalf — providing graph visualization, task management, agent monitoring, agent and skill design, and organization administration.

The cockpit is a **separate React / TypeScript project** with its own repository, independent of the `graphclaw` Python backend. All data flows through the backend's `/app/v1/` REST API and real-time event streams.

---

## 1.2 Three Interface Surfaces

GraphClaw has three distinct interaction surfaces. The cockpit covers Surfaces 2 and 3.

```
Surface 1: Conversational Channel  (primary, daily use)
  WhatsApp / Telegram / Email / Web Chat
  → Daily briefings, quick decisions, task creation, status updates
  → No app required — agent comes to the user
  → Design principle: the agent must be fully useful
    WITHOUT the user ever opening a visual interface

Surface 2: Visual Graph Interface  (power use, weekly)
  Web / Mobile app  ← COCKPIT
  → Review and edit graph structure
  → Planning sessions and project decomposition
  → Dependency visualization
  → Skill agent and settings management
  → Complement to the channel, not a requirement

Surface 3: Settings & Admin Panel  (one-time + occasional)
  Web app  ← COCKPIT
  → Channel configuration and verification
  → Organization workspace setup
  → Skill agent library and MCP registry management
  → LLM provider configuration
  → Scoring weight adjustment (power users)
  → Admin: feature gating, guardrails, SSO, compliance
```

### Web Chat — The Default Channel

The cockpit includes a built-in **web chat interface** that serves as the default and always-active channel. Unlike WhatsApp, Telegram, and Email — which require explicit enablement from the Settings panel — the web chat is available immediately upon login with zero configuration.

---

## 1.3 Design Philosophy

1. **Agent-first**: The orchestrating agent is the primary user interface. The cockpit is a power-user complement, never a gatekeeper. Every action possible in the cockpit is also achievable through conversational channels.
2. **Transparency by default**: The agent can always answer "why is this ranked here?" — explainability is embedded in every view, not hidden behind an advanced mode.
3. **Edit anything**: Users can add, edit, and delete any node or edge in the graph. They can override agent scoring, lock nodes from agent modification, and manually define action item lists. The graph is the user's data — the agent assists, it does not gatekeep.
4. **Real-time sync**: All actions on any surface immediately reflect in the graph. The conversational agent always has current state regardless of where the last action happened.
5. **Admin as policy layer**: Org admins set guardrails and feature policies. Users operate within those boundaries. The admin panel is invisible to non-admin users.

---

## 1.4 User Personas

| Persona | Role | Primary Surface | Key Activities |
|---------|------|-----------------|----------------|
| **Task Owner** | Individual contributor | Chat + My Tasks View | Daily briefings, task updates, approve/reject, score explanations |
| **Project Lead** | Manager | Graph Cockpit (Goal/Project View) | Planning sessions, dependency analysis, resource allocation, timeline reviews |
| **Power User** | Technical user | Canvas Editor + Settings | Design custom agents, configure skills, tune scoring weights, manage MCP servers |
| **Org Admin** | Organization OWNER/ADMIN | Admin Panel | Feature gating, LLM config, guardrails, SSO setup, user management, compliance |

---

## 1.5 Sync Principle

All actions on any surface (chat, graph UI, settings panel, API) immediately mutate the underlying property graph. Every connected surface receives the update in real-time:

- **SSE stream** (`/app/v1/events`): Pushes `task.state_changed`, `task.scored`, `briefing.ready`, `approval.pending`, `skill.completed` events to the graph UI
- **WebSocket** (`/app/v1/chat/ws`): Bidirectional real-time channel for the web chat interface
- **TanStack Query**: Automatic background refetch for lower-frequency views (settings, skill registry)

---

## 1.6 Mobile vs Desktop

| Platform | Primary Use | Features |
|----------|-------------|----------|
| **Mobile** | Quick decisions, daily use | MY TASKS VIEW optimized, quick approve/snooze/delegate gestures, chat, voice notes (future) |
| **Desktop** | Planning and power use | Full graph visualization with zoom/pan, bulk operations, canvas editor, side-by-side graph+chat, admin panel |

**Responsive breakpoints:**
- Mobile: < 768px — single-column, tab-based navigation, simplified graph
- Tablet: 768px – 1024px — split views, collapsible side panels
- Desktop: > 1024px — full graph workspace, persistent side panels, admin access

---

## 1.7 Relationship to Backend

The cockpit has **zero direct database access**. All operations flow through the GraphClaw backend:

```
┌─────────────────────┐     HTTPS / WSS     ┌─────────────────────────────┐
│  GraphClaw Cockpit  │ ──────────────────→  │  GraphClaw Backend          │
│  (React SPA)        │                      │  (FastAPI gateway)          │
│                     │  /app/v1/*   REST    │  ├── /app/v1/graph/*        │
│  - Graph views      │  /app/v1/events SSE  │  ├── /app/v1/settings/*     │
│  - Chat interface   │  /app/v1/chat/ws WS  │  ├── /app/v1/admin/*       │
│  - Canvas editor    │                      │  ├── /app/v1/chat/*        │
│  - Settings panel   │                      │  ├── /app/v1/skills/*      │
│  - Admin panel      │                      │  ├── /app/v1/mcp-servers/* │
│                     │                      │  └── /auth/*               │
└─────────────────────┘                      └─────────────────────────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │  Postgres + AGE │
                                              │  S3 / MinIO     │
                                              │  Redis          │
                                              │  Secrets Manager│
                                              └─────────────────┘
```
