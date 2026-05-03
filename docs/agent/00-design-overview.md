# 00 — Design Overview

> **Status:** Approved · **Date:** 2026-05-03

---

## 1. Why this exists

GraphClaw runs a daily-cycle AI agent that scores tasks, talks to the user's contacts, runs skills, delegates to sub-agents, and writes back to the property graph. The user — a **non-technical knowledge worker** managing daily tasks — needs a way to:

- See at a glance whether the agent is healthy and what it's doing right now.
- Audit every message the agent sent on their behalf, and every reply it processed.
- Understand why the agent prioritised one task over another.
- Spot failures (skills that crashed, runners that went silent, follow-ups that didn't get a response) without reading log files.

This is **operational transparency**, not engineering observability. The latter (CloudWatch dashboards, distributed traces, raw NDJSON browsers) is reserved for admin/Phase C.

---

## 2. Two surfaces, two questions

| Surface | Question it answers | Lives at |
|---------|---------------------|----------|
| **Intelligence Hub** | "What does the agent **know**?" | `/intelligence-hub` |
| **Agent Monitor** | "What is the agent **doing**?" | `/agent-monitor` |

The two surfaces share design language (left-nav tabbed layout, KPI cards, clean tables) but never overlap in scope. Memory edits live in Intelligence Hub; runtime activity lives in Agent Monitor.

---

## 3. Information architecture (7 panels)

```
Agent Monitor (left nav)
├── Overview      ← landing page · status, glance, live ticker
├── Activity      ← chronological audit of everything done today / 7d
├── Comms         ← bilateral inbound/outbound message log
├── Scheduling    ← triggers, next run, run history
├── Skills        ← worker pool health + recent jobs
├── ─── Advanced ───
├── Scoring       ← task ranking + 7-factor breakdown + simulator
└── Agents        ← sub-agent pool + dispatch + heartbeats (hidden if pool=0)
```

**Why this split:**
- The first 5 are needed by every user. The last 2 are deeper — surfaced only when the user wants to drill in.
- Each panel answers exactly one question; no panel mixes scopes.
- All panels are URL-routable (`/agent-monitor/:section`) so Slack-pasted links land where you'd expect.

---

## 4. Design principles

### 4.1 Plain language first
Every event in the activity feed is rendered as a sentence a non-technical user can parse, not a JSON blob:

| Raw event | Display |
|-----------|---------|
| `task.scored` | "Scored 14 tasks — top priority: Competitive analysis (Notion vs Linear)" |
| `skill.completed` (failed, timeout) | "Research skill failed — timed out after 60s on 3rd attempt" |
| `outbound.sent` | "Sent follow-up email to Alex: \"Quick update on Q3 budget — can you confirm?\"" |

The translation lives in the **gateway** as a single source of truth (`activity_formatter.py`); the cockpit mirrors it for live SSE events with a snapshot test enforcing parity.

### 4.2 Bilateral comms view
The comms panel shows messages **received** and messages **sent** as a single first-class concept, not two scattered logs. Every entry includes the channel, the human counterparty (display name, not raw email/phone), and the action the agent took.

### 4.3 Drill-down, not depth
Top-level panels stay scannable. Drill-down lives in side panels (factor breakdown), modals (what-if simulator), or task-detail pages — never in expanding accordion trees that hide critical state.

### 4.4 Health by exception
The Attention Strip surfaces only what's wrong: failed skills, stale heartbeats, no-reply follow-ups. When everything is healthy, it disappears entirely.

### 4.5 Live + historical, no special mode
Live SSE events stream into the same view as historical activity loaded from MinIO. There's no "live mode toggle" — the user sees a unified timeline.

---

## 5. Panel-by-panel design rationale

### 5.1 Overview
**Goal:** Answer "is the agent healthy and what did it just do?" in 2 seconds.

| Element | Purpose |
|---------|---------|
| Attention Strip | Failures and stalls demand immediate attention; show only when present. |
| 4 KPI cards | Current state (Running/Idle/Error), most recent run, next scheduled run, count needing attention. |
| Today's Glance Strip | 5 inline stats: messages received/sent, skills run, tasks scored, runs today. Quick recap of the day. |
| Live Activity Ticker | Last ~6 events as plain-language rows, auto-updates via SSE. "View all" → Activity panel. |

### 5.2 Activity
**Goal:** Full audit trail with filtering and session grouping.

The default "Time" view is a chronological flat list. The "Session" toggle groups events by `session_id` so the user can see a single agent run as one collapsible block (45s · 8 tool calls · 1 skill · 1 message sent). Errors get red row backgrounds and inline "Details" links.

### 5.3 Comms
**Goal:** Bilateral audit — every message in, every message out.

Two URL-bound sub-tabs (`/comms/inbound`, `/comms/outbound`). Channel badges (Email, CLI, API, Web) use theme tokens so dark mode works. Recipients show display names, never raw email addresses.

### 5.4 Scheduling
**Goal:** Show the user **when** the agent runs and **why**, with manual override.

Next run card surfaces the most imminent trigger. Trigger list shows scheduled, inbound, follow-up, and on-demand triggers with snooze/resume controls. Run history (Phase B) shows the last 10 actual runs from `agent_session_log`.

### 5.5 Skills
**Goal:** Spot crashed skills before they cause bigger problems.

Worker pool bar shows utilisation (green/amber/red). 4 mini-cards show running / idle / failed workers with sparkline heartbeats. Recent jobs table flags failures with red backgrounds and a plain-language error summary (not stack traces).

### 5.6 Scoring
**Goal:** Make the 7-factor scoring algorithm transparent.

Two-column layout: ranked task table on the left, factor breakdown on the right. Click any task → factor panel updates. The What-if Simulator lets users test "what would the score be if I changed deadline / dependencies / blocker / human override / resource risk / constraint pressure / critical path?" without persisting changes.

### 5.7 Agents
**Goal:** Sub-agent pool visibility, hidden when there's nothing to show.

Only renders when `total_runners > 0`. KPI cards (active, queue depth, avg duration, stale heartbeats), dispatch swim-lanes (Tier 1 → 2 → 3), per-runner heartbeat bars (last 30 min, green/amber/red/empty).

---

## 6. Phase split

| Phase | Scope | Notes |
|-------|-------|-------|
| **A** | M-A foundation, M-B Overview, M-E Scheduling, M-F Skills, M-G Scoring, M-H Agents — using existing endpoints + light backend additions | Ships day one |
| **B** | M-C Activity (full historical), M-D Comms (full inbound/outbound), session log + race fix + triad-wide tool-call wiring | Requires gateway endpoints |
| **C** | Token/cost drill-down, MinIO retention worker, structured log viewer, session trace waterfall, LLM cost monitor | Deferred |

---

## 7. Visual design

The wireframe at [`wireframes-v2/pages/agent-monitor-v2.html`](../../wireframes-v2/pages/agent-monitor-v2.html) is the pixel-level spec. It uses the existing token system in [`wireframes-v2/assets/tokens.css`](../../wireframes-v2/assets/tokens.css) — every colour, spacing, and typography decision must use a CSS custom property, not a hardcoded value, so dark mode and theme switching work for free.

**Component patterns reused:**
- `mon-nav` left rail mirrors `ih-nav` from Intelligence Hub.
- `kpi-card` from existing dashboard work.
- `data-table`, `badge`, `task-chip` from the shared system.

**New patterns introduced:**
- `attention-strip` (alert bar, dismissable)
- `glance-strip` (inline stat chips)
- `ticker-card` + `ticker-row` (live feed)
- `session-row` (collapsible group header)
- `dispatch-lanes` (swim-lane visualisation)
- `hb-row` / `hb-seg` (heartbeat bar)
- `factor-row` (scoring breakdown row)

---

## 8. Non-goals

- **Not a CloudWatch replacement.** Admin / engineering observability stays in CloudWatch / structured log viewer (Phase C).
- **Not a settings page.** Config, secrets, channel setup live in Settings.
- **Not Intelligence Hub.** Memory, skills catalog, agent persona live there.
- **Not a chat interface.** The user talks to the agent in `/chat`.

If a feature request blurs into one of these, it goes to that surface, not here.
