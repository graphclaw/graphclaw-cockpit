# GraphClaw Cockpit — PRD Index

> Product Requirements Document for the GraphClaw Cockpit web interface.

**Version:** 1.0
**Date:** 2026-03-21
**Status:** Draft
**Backend Project:** `C:/Users/abhis/Projects/graphclaw`
**Domain:** graphclaw.ai

> **2026-05-02 cross-cutting design extension** — the comms / inbound / outbound triad, multi-channel chat, counterparty conversations, identity/onboarding, cross-tenant task projection, per-user policies, and the No-Delete data-lifecycle principle. Affected PRDs: 02, 03, 05, 09, 11, 12, 13, 15. Banners on each PRD link to the relevant arch + requirements docs.
>
> **Requirements bundle** (in `graphclaw/docs/requirements/`):
> - [agent-triad-and-comms-substrate.md](../../../graphclaw/docs/requirements/agent-triad-and-comms-substrate.md) — actionable spec
> - [build-readiness.md](../../../graphclaw/docs/requirements/build-readiness.md) — **read first before Wave 0** (PR sequence, rollout, verification matrix, API shapes, risks, open questions)
> - [review-the-design-plans-squishy-eagle.md](../../../graphclaw/docs/requirements/review-the-design-plans-squishy-eagle.md) — design-conversation trail (the *why*)
>
> **New architecture docs (graphclaw repo)**: [13-tenancy-model](../../../graphclaw/docs/architecture/13-tenancy-model.md), [14-agent-triad](../../../graphclaw/docs/architecture/14-agent-triad.md), [15-user-identity-and-onboarding](../../../graphclaw/docs/architecture/15-user-identity-and-onboarding.md), [16-cross-user-conversations](../../../graphclaw/docs/architecture/16-cross-user-conversations.md), [17-cross-tenant-task-projection](../../../graphclaw/docs/architecture/17-cross-tenant-task-projection.md), [18-follow-up-cadence](../../../graphclaw/docs/architecture/18-follow-up-cadence.md), [19-data-lifecycle-and-deletion-policy](../../../graphclaw/docs/architecture/19-data-lifecycle-and-deletion-policy.md).

---

## Document Map

| # | Document | Summary |
|---|----------|---------|
| **01** | [Product Overview](01-overview.md) | Vision, three interface surfaces, design philosophy, personas, sync principle, mobile vs desktop |
| **02** | [Graph Cockpit](02-graph-cockpit.md) | Graph visualization (5 views), visual language, direct node/edge CRUD, agent override, undo/redo |
| **03** | [Agent Monitor](03-agent-monitor.md) | Agent activity dashboard, action queue, scoring inspector, trigger schedule, skill worker monitor, structured log viewer, session traces, LLM cost monitor |
| **04** | [Canvas Editor](04-canvas-editor.md) | Agent canvas (drag-and-drop workflow builder), skill form editor, test mode, version control |
| **05** | [Settings Panel](05-settings-panel.md) | Channel activation, org workspace setup, LLM BYOK, briefing schedule, scoring weights, trigger config, A2A key management |
| **06** | [Skill Marketplace](06-skill-marketplace.md) | Installed skills, remote GitHub registry, install/uninstall, version pinning, quality feedback |
| **07** | [MCP Registry](07-mcp-registry.md) | MCP server list, pre-built adapters, official registry search, trust tier config, GATED approval workflow, scope visualization |
| **08** | [Explainability Dashboard](08-explainability.md) | ScoreExplanation panel, score history, decision audit trail, resource reliability, behavioral model transparency |
| **09** | [Admin Panel](09-admin-panel.md) | Feature gating, LLM provider/model config, LLM-as-Judge, XML guardrail rule engine, SSO/OIDC/SAML, channel management, user management, GDPR/compliance, deployment, cluster/scaling, backup, security, observability, migrations, connectors |
| **10** | [Technical Specification](10-technical-spec.md) | React/TS, graph library, shadcn/ui, TanStack Query, Monaco Editor, auth, real-time, security |
| **11** | [API Contract](11-api-contract.md) | Complete inventory of all backend endpoints consumed by the cockpit (100+ endpoints) |
| **12** | [Task Views](12-task-views.md) | Tabular task list, dependency graph view, view switcher, saved filter presets |
| **13** | [Chat Interface](13-chat-interface.md) | Always-active web chat (default channel), WebSocket, agent response rendering, conversation history |
| **14** | [Config & Secrets](14-config-and-secrets.md) | Single JSON config per user, AWS Secrets Manager from UI, channel enablement model |
| **15** | [Intelligence Hub](15-intelligence-hub.md) | Agent profile editor, three-tier memory viewer (working/episodic/semantic), compact operation, skill authoring — Wave G |
| **16** | [React Implementation](16-react-implementation.md) | Software stack, Docker deployment, Playwright E2E testing, 12-wave delivery plan |

---

## Companion Documents

| Document | Location | Purpose |
|----------|----------|---------|
| **Backend API PRD** | `graphclaw/docs/cockpit-backend-api-prd.md` | All new backend endpoints required by the cockpit — the implementation backlog |
| **Existing UI Requirements** | `graphclaw/docs/ui-requirements.md` | Original 470-line UI spec from the backend project (absorbed into this PRD) |
| **Backend PRD** | `graphclaw/docs/task-graph-requirements.md` | Full backend PRD (v1.1, 8500+ lines) — §23 UX, §25 gaps, §31 security, §32 observability |
| **Architecture** | `graphclaw/docs/architecture.md` | Backend plugin architecture (DB, Gateway, LLM, Infra layers) |
| **Build Plan** | `graphclaw/build-plan.md` | 6-phase backend build plan — Phase 4/5 include UI-relevant APIs |
