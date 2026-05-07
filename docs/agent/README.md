# Agent Monitor v2 — Documentation Index

> **Status:** Design approved, ready to build · **Date:** 2026-05-03
> **Wireframe:** [`wireframes-v2/pages/agent-monitor-v2.html`](../../wireframes-v2/pages/agent-monitor-v2.html)
> **Build wave:** **Wave M** (supersedes Wave 5 in [`docs/planning/build-plan.md`](../planning/build-plan.md))

Agent Monitor is the operational transparency surface — it shows the non-technical primary user everything the agent is **doing** on their behalf (vs Intelligence Hub which shows what it **knows**).

The v2 redesign replaces the original flat technical event log with a **7-panel left-nav layout** built around plain-language summaries, bilateral comms audit, and a clear drill-down hierarchy.

---

## Document map

| Document | Purpose |
|----------|---------|
| [00-design-overview.md](00-design-overview.md) | Philosophy, IA, panel-by-panel design rationale |
| [01-data-sources.md](01-data-sources.md) | Where each piece of data lives (SSE, graph, MinIO, Postgres) |
| [02-wave-plan.md](02-wave-plan.md) | Wave M-A through M-H with sub-requirements |
| [03-component-spec.md](03-component-spec.md) | Cockpit frontend component spec |
| [04-api-contract.md](04-api-contract.md) | Endpoint contracts between cockpit and gateway |
| [05-open-risks.md](05-open-risks.md) | Known risks, mitigations, open decisions |

---

## Cross-repo references

**graphclaw-cockpit (this repo):**
- [`docs/prd/03-agent-monitor.md`](../prd/03-agent-monitor.md) — product requirements (v2-reconciled)
- [`docs/planning/build-plan.md`](../planning/build-plan.md) — execution wave tracker
- [`wireframes-v2/pages/agent-monitor-v2.html`](../../wireframes-v2/pages/agent-monitor-v2.html) — pixel-level reference

**graphclaw (gateway / backend):**
- [`docs/requirements/agent-monitor-v2-backend.md`](../../../graphclaw/docs/requirements/agent-monitor-v2-backend.md) — backend functional requirements
- [`docs/architecture/20-agent-activity-logging.md`](../../../graphclaw/docs/architecture/20-agent-activity-logging.md) — logging pipeline + activity feed
- [`docs/architecture/14-agent-triad.md`](../../../graphclaw/docs/architecture/14-agent-triad.md) — comms / inbound / outbound agents (now log tool calls)

---

## How to use this docset

**Picking up Wave M from a fresh session:**
1. Read `00-design-overview.md` to understand the why.
2. Read `02-wave-plan.md` for the wave you're starting (M-A is the entry point).
3. Cross-reference `03-component-spec.md` for component contracts and `04-api-contract.md` for endpoint shapes.
4. Check `05-open-risks.md` for known gotchas before coding.
5. Run the wave's verification block before marking complete.

**Methodology:** Follow the 5-phase development process in [`CLAUDE.md`](../../CLAUDE.md): Orient → Plan → Implement → Test → Commit. Phase B work crosses repos — coordinate with backend before cockpit consumers ship.

---

## Status legend used throughout

- **Phase A** — Ships with no backend changes (or with minimal changes that block cockpit work).
- **Phase B** — Requires gateway endpoints / log wiring / migrations to land first.
- **Phase C** — Deferred. Tracked here but not in this build.
