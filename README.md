# GraphClaw Cockpit

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

> Web-based command center for the GraphClaw task graph management system.

**Public Roadmap (Now/Next/Later):** [graphclaw/docs/planning/public-roadmap.md](https://github.com/graphclaw/graphclaw/blob/main/docs/planning/public-roadmap.md)

**Docs Hub:** [docs/README.md](docs/README.md)

**Self-Host Deployment Guide:** [docs/how-to/self-host.md](docs/how-to/self-host.md)

Versioning and deployment guidance for current releases lives in [docs/how-to/self-host.md](docs/how-to/self-host.md).

## Overview

GraphClaw Cockpit is a **React / TypeScript** single-page application that provides a visual interface for managing the GraphClaw property graph, monitoring the orchestrating agent, designing agents and skills, and administering organizations.

It is a **separate project** from the [GraphClaw backend](https://github.com/graphclaw/graphclaw). All data flows through the backend's `/app/v1/` REST API and real-time event streams.

## Product Requirements

The full PRD is in [`docs/prd/`](docs/prd/00-index.md):

| # | Document | Scope |
|---|----------|-------|
| 00 | [Index](docs/prd/00-index.md) | Master table of contents |
| 01 | [Overview](docs/prd/01-overview.md) | Vision, personas, design philosophy |
| 02 | [Graph Cockpit](docs/prd/02-graph-cockpit.md) | Graph visualization, 5 views, direct editing, agent override |
| 03 | [Agent Monitor](docs/prd/03-agent-monitor.md) | Agent dashboard, scoring inspector, log viewer, cost monitor |
| 04 | [Canvas Editor](docs/prd/04-canvas-editor.md) | Agent drag-and-drop canvas, skill form editor |
| 05 | [Settings Panel](docs/prd/05-settings-panel.md) | Channels, orgs, LLM BYOK, scoring weights, triggers |
| 06 | [Skill Marketplace](docs/prd/06-skill-marketplace.md) | Skill library, remote registry, quality feedback |
| 07 | [MCP Registry](docs/prd/07-mcp-registry.md) | MCP servers, trust tiers, GATED approvals |
| 08 | [Explainability](docs/prd/08-explainability.md) | Score explanations, decision audit, resource reliability |
| 09 | [Admin Panel](docs/prd/09-admin-panel.md) | Feature gating, LLM config, guardrails, SSO, GDPR, deployment |
| 10 | [Technical Spec](docs/prd/10-technical-spec.md) | Tech stack, auth, real-time, security constraints |
| 11 | [API Contract](docs/prd/11-api-contract.md) | Complete endpoint inventory consumed by UI |
| 12 | [Task Views](docs/prd/12-task-views.md) | Tabular view, dependency graph view, saved filters |
| 13 | [Chat Interface](docs/prd/13-chat-interface.md) | Web chat (default channel), WebSocket, history |
| 14 | [Config & Secrets](docs/prd/14-config-and-secrets.md) | JSON config, AWS Secrets Manager, channel enablement |

## Backend Dependency

All APIs are served by the GraphClaw backend project. The backend API PRD for cockpit-required endpoints is maintained at:

- **Backend API PRD**: [graphclaw/docs/cockpit-backend-api-prd.md](https://github.com/graphclaw/graphclaw/blob/main/docs/cockpit-backend-api-prd.md)

## Wireframes v2 Reference

Wireframes in `wireframes-v2/` are read-only reference artifacts for cockpit design and implementation alignment.

Baseline and evaluator-history details are archived in [docs/archive/wireframes-v2-baseline.md](docs/archive/wireframes-v2-baseline.md).

## Tech Stack

- **Framework**: React 19+ with TypeScript
- **Graph Visualization**: Cytoscape.js or React Flow
- **Canvas Editor**: React Flow (node-based workflow builder)
- **UI Components**: shadcn/ui (Radix + Tailwind CSS)
- **Data Fetching**: TanStack Query
- **Code/XML Editor**: Monaco Editor
- **Auth**: httpOnly JWT cookies via OAuth 2.0 / OIDC / SAML 2.0
- **Real-Time**: SSE for graph events, WebSocket for chat

## License

Copyright 2026 Abhishek Gupta. Licensed under the [Apache License 2.0](LICENSE).
