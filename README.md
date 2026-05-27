# GraphClaw Cockpit

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

> Web-based command center for the GraphClaw task graph management system.

## Overview

GraphClaw Cockpit is a **React / TypeScript** single-page application that provides a visual interface for managing the GraphClaw property graph, monitoring the orchestrating agent, designing agents and skills, and administering organizations.

It is a **separate project** from the [GraphClaw backend](https://github.com/graphclaw/graphclaw). All data flows through the backend's `/app/v1/` REST API and real-time event streams.

## Product Requirements

The full PRD is in [`docs/prd/`](../prd/00-index.md):

| # | Document | Scope |
|---|----------|-------|
| 00 | [Index](../prd/00-index.md) | Master table of contents |
| 01 | [Overview](../prd/01-overview.md) | Vision, personas, design philosophy |
| 02 | [Graph Cockpit](../prd/02-graph-cockpit.md) | Graph visualization, 5 views, direct editing, agent override |
| 03 | [Agent Monitor](../prd/03-agent-monitor.md) | Agent dashboard, scoring inspector, log viewer, cost monitor |
| 04 | [Canvas Editor](../prd/04-canvas-editor.md) | Agent drag-and-drop canvas, skill form editor |
| 05 | [Settings Panel](../prd/05-settings-panel.md) | Channels, orgs, LLM BYOK, scoring weights, triggers |
| 06 | [Skill Marketplace](../prd/06-skill-marketplace.md) | Skill library, remote registry, quality feedback |
| 07 | [MCP Registry](../prd/07-mcp-registry.md) | MCP servers, trust tiers, GATED approvals |
| 08 | [Explainability](../prd/08-explainability.md) | Score explanations, decision audit, resource reliability |
| 09 | [Admin Panel](../prd/09-admin-panel.md) | Feature gating, LLM config, guardrails, SSO, GDPR, deployment |
| 10 | [Technical Spec](../prd/10-technical-spec.md) | Tech stack, auth, real-time, security constraints |
| 11 | [API Contract](../prd/11-api-contract.md) | Complete endpoint inventory consumed by UI |
| 12 | [Task Views](../prd/12-task-views.md) | Tabular view, dependency graph view, saved filters |
| 13 | [Chat Interface](../prd/13-chat-interface.md) | Web chat (default channel), WebSocket, history |
| 14 | [Config & Secrets](../prd/14-config-and-secrets.md) | JSON config, AWS Secrets Manager, channel enablement |

## Backend Dependency

All APIs are served by the GraphClaw backend project at `C:/Users/abhis/Projects/graphclaw`. The backend API PRD for cockpit-required endpoints is maintained at:

- **Backend API PRD**: [`graphclaw/docs/cockpit-backend-api-prd.md`](../../../graphclaw/docs/cockpit-backend-api-prd.md)

## Wireframes v2 — Baseline Checkpoint

> **Baseline version** — tagged `v2-baseline` (2026-04-10).
> All 25 pages complete, navigation wired, themes implemented, evaluator PASS.
> Use this tag to restore to the baseline wireframe state.

### What's in the Baseline

| Asset | Description |
|-------|-------------|
| `wireframes-v2/index.html` | Hub page — 25 pages, Phases A–E, 4.03 eval score |
| `wireframes-v2/pages/*.html` | 21 page wireframes (all PASS) |
| `wireframes-v2/assets/tokens.css` | Design tokens (light/dark/solarized/midnight/high-contrast) |
| `wireframes-v2/assets/components.css` | Full component library |
| `wireframes-v2/assets/layout.css` | Shell, sidebar, responsive breakpoints |
| `wireframes-v2/assets/utilities.css` | Helpers, animations, scrollbar |
| `wireframes-v2/assets/nav.js` | Shared sidebar injection (logo, links, settings sub-nav) |
| `wireframes-v2/assets/theme.js` | Theme picker (6 themes) + collapsible sidebar |
| `wireframes-v2/assets/logo.png` | GraphClaw logo (transparent via mix-blend-mode) |
| `wireframes-v2/reviews/` | Evaluator reports (20 pages scored) |

### Shared Navigation System
All pages are wired via `data-page` attribute + `assets/nav.js` injection.
Sidebar: full 220px expanded ↔ 56px icon rail (collapsible, persisted to localStorage).
Theme picker: Light, Dark, Solarized Light, Solarized Dark, Midnight Blue, High Contrast.

## License

Copyright 2026 Abhishek Gupta. Licensed under the [Apache License 2.0](LICENSE).

### Evaluation Summary (Baseline)
- **Overall**: 4.03 / 5.0 — All 20 content pages PASS
- **Top**: Agent Monitor (4.37), Skill Marketplace (4.28), Task Detail (4.25)
- **UI Changes**: Theme picker (3.81), Logo rework (3.81), Sidebar collapse (3.62)
- Full reports in `wireframes-v2/reviews/`

## Tech Stack (Planned)

- **Framework**: React 19+ with TypeScript
- **Graph Visualization**: Cytoscape.js or React Flow
- **Canvas Editor**: React Flow (node-based workflow builder)
- **UI Components**: shadcn/ui (Radix + Tailwind CSS)
- **Data Fetching**: TanStack Query
- **Code/XML Editor**: Monaco Editor
- **Auth**: httpOnly JWT cookies via OAuth 2.0 / OIDC / SAML 2.0
- **Real-Time**: SSE for graph events, WebSocket for chat

## License

Apache 2.0
