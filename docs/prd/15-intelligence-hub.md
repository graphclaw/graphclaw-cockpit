# 15 — Intelligence Hub

**Version:** 1.0 | **Date:** 2026-04-12 | **Status:** Complete | **Wave:** G

---

## 15.0 Overview

> The Intelligence Hub is the transparency and authoring layer of the cockpit. It lets users read, edit, and understand everything the agent "knows" — its persona, its memory, and its skills — directly from the browser.

The Intelligence Hub is a new top-level navigation section. It replaces the mental model of "the agent is a black box" with full read/write access to the agent's cognitive state:

| Subsection | What the user can do |
|------------|----------------------|
| **Agent Profile** | Define the agent's name, persona, goals, and working style |
| **Working Memory** | Read and manually correct the agent's current-session scratchpad |
| **Episodic Memory** | Browse the archive of past session summaries; delete stale entries |
| **Semantic Memory** | Author and edit long-term topic knowledge files |
| **Compact** | Condense an oversized working context into a summary and archive the original |
| **Skill Authoring** | Write, edit, fork, validate, and import `SKILL.md` skill definitions |

**Multi-tenant isolation:** all data lives under `{user_id}/` in MinIO/S3. The UI never constructs paths — it uses the API exclusively. The backend enforces isolation via `StoragePaths`.

---

## 15.1 Layout & Navigation

### 15.1.1 Top-level Navigation Entry

Add **Intelligence** as a primary sidebar item between the existing **Skills** and **Settings** entries.

Icon: brain or sparkle (consistent with the design system).

### 15.1.2 Intelligence Hub Layout

Two-panel layout:

```
┌─────────────────────────────────────────────────────────────┐
│  Intelligence Hub                              [Agent: main ▾]│
├────────────────┬────────────────────────────────────────────┤
│  Left nav      │  Content panel                              │
│                │                                             │
│  Agent Profile │                                             │
│  ─────────     │                                             │
│  Memory        │                                             │
│    Working     │                                             │
│    Episodic    │                                             │
│    Semantic    │                                             │
│  ─────────     │                                             │
│  Skill Author  │                                             │
└────────────────┴────────────────────────────────────────────┘
```

**Agent selector** (top-right): dropdown of known agent IDs. Defaults to `main`. Switching agent updates all panels.

The left nav is a simple vertical list of items — no collapsing. Active item is highlighted.

---

## 15.2 Agent Profile Editor

### 15.2.1 Purpose

The agent profile is a Markdown document that defines the agent's persona, goals, domain expertise, and working style. The agent loop reads this on each invocation to shape its behavior.

### 15.2.2 View

- Full-width Monaco Editor (Markdown mode) showing the current `profile.md` content.
- Toolbar: **Save** button (PUT `/app/v1/intelligence/agents/{agent_id}/profile`), **Discard** button (reload from API).
- If no profile exists yet, the editor pre-fills with a starter template:

```markdown
# Agent: main

## Persona
You are a focused research assistant.

## Goals
- Summarise and synthesise information accurately.
- Prioritise actionable output.

## Domain Expertise
- [Add topic areas here]

## Working Style
- Be concise.
- Cite sources when available.
```

- Save triggers a success toast: "Profile saved."
- Unsaved changes indicator: dot in the tab title or save button turns primary color when dirty.

### 15.2.3 API Endpoints

| Action | Endpoint |
|--------|----------|
| Load profile | `GET /app/v1/intelligence/agents/{agent_id}/profile` |
| Save profile | `PUT /app/v1/intelligence/agents/{agent_id}/profile` |

---

## 15.3 Working Memory Viewer

### 15.3.1 Purpose

The working context is the agent's live scratchpad — written and overwritten by the agent loop on each cycle. It captures in-progress observations, partial outputs, and task state. Users can inspect and manually correct it.

### 15.3.2 View

- Monaco Editor (Markdown mode) showing `context.md` content.
- Toolbar:
  - **Save** — PUT working context.
  - **Discard** — reload from API.
  - **Compact…** — opens the Compact dialog (§15.5).
- If the working context is empty, show an empty editor with placeholder text: *"No working context yet — the agent will populate this on its next run."*
- A warning banner appears when content exceeds **8 000 characters**: *"Working context is large. Consider compacting."* with a **Compact…** shortcut button.

### 15.3.3 API Endpoints

| Action | Endpoint |
|--------|----------|
| Load context | `GET /app/v1/intelligence/agents/{agent_id}/memory/working` |
| Save context | `PUT /app/v1/intelligence/agents/{agent_id}/memory/working` |
| Compact | `POST /app/v1/intelligence/agents/{agent_id}/memory/compact` |

---

## 15.4 Episodic Memory Browser

### 15.4.1 Purpose

Episodic memory is an append-only archive of past session summaries. Entries are created automatically by the Compact operation. Users can browse the archive and delete stale entries.

### 15.4.2 List View

- Table with columns:

  | Column | Source |
  |--------|--------|
  | Date | Parsed from entry name (e.g. `2026-04-11-compact-abc123.md`) |
  | Session Label | Suffix of entry name |
  | Entry Name | Full file name |
  | Actions | **View**, **Delete** |

- Entries ordered newest first.
- Empty state: *"No episodic memory entries yet."*

### 15.4.3 Entry Viewer

Clicking **View** opens a right slide-over panel (or expands a row) showing the full Markdown content rendered in read-only Monaco Editor.

Entry content is read-only — episodic memory is an archive.

### 15.4.4 Delete

- **Delete** button on each row → confirmation dialog: *"Delete this episodic entry? This cannot be undone."*
- On confirm: `DELETE /app/v1/intelligence/agents/{agent_id}/memory/episodic/{entry_name}`
- Row removed from table on success.

### 15.4.5 API Endpoints

| Action | Endpoint |
|--------|----------|
| List entries | `GET /app/v1/intelligence/agents/{agent_id}/memory/episodic` |
| Read entry | `GET /app/v1/intelligence/agents/{agent_id}/memory/episodic/{entry_name}` |
| Delete entry | `DELETE /app/v1/intelligence/agents/{agent_id}/memory/episodic/{entry_name}` |

---

## 15.5 Compact Dialog

### 15.5.1 Purpose

The Compact operation is the primary tool for managing memory growth. It:
1. Archives the current working context to episodic memory (timestamped entry).
2. Replaces the working context with a user-supplied summary.

This preserves the full original before discarding it.

### 15.5.2 UI Flow

Trigger: **Compact…** button in the Working Memory toolbar (§15.3.2) or the warning banner shortcut.

Opens a modal dialog:

```
┌─────────────────────────────────────────────────────────┐
│  Compact Working Memory                               ✕  │
├─────────────────────────────────────────────────────────┤
│  The current working context will be archived to        │
│  episodic memory. Replace it with a compact summary.    │
│                                                         │
│  Session label (optional)                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ e.g. research-phase-1                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Compact summary *                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  (Markdown editor, min 3 rows, max 20 rows)      │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Cancel]                        [Compact & Archive]    │
└─────────────────────────────────────────────────────────┘
```

- **Session label**: optional free-text (alphanumeric + hyphens). Auto-generated server-side if omitted.
- **Compact summary**: required Markdown textarea. Min length: 10 characters.
- **Compact & Archive**: disabled until summary has content.
- On success:
  - Dialog closes.
  - Working Memory editor reloads with the new summary.
  - Toast: *"Compacted. Archived as `{archived_as}`."*

### 15.5.3 API Endpoint

`POST /app/v1/intelligence/agents/{agent_id}/memory/compact`

Request body:
```json
{
  "summary": "...",
  "session_label": "research-phase-1"
}
```

---

## 15.6 Semantic Memory Editor

### 15.6.1 Purpose

Semantic memory is organized long-term knowledge: topic files authored by the user or written by the agent. Each topic is a slug-named Markdown file (e.g. `users.md`, `patterns.md`).

Users can author new topics, edit existing ones, and delete obsolete knowledge.

### 15.6.2 Topic List + Editor Layout

Three-panel layout within the Semantic Memory view:

```
┌──────────────────┬──────────────────────────────────────────┐
│  Topics          │  Editor: users                           │
│                  │  ─────────────────────────────────────── │
│  users       ●   │  # Users                                 │
│  patterns        │                                          │
│  projects        │  Key contacts and preferences...         │
│  + New Topic     │                                          │
│                  │  [Save]  [Discard]  [Delete Topic]       │
└──────────────────┴──────────────────────────────────────────┘
```

- **Topic list**: left column. Clicking a topic loads its content into the Monaco Editor on the right.
- Active topic highlighted (●).
- **+ New Topic**: opens inline input for topic slug (lowercase letters, hyphens only). Pressing Enter creates an empty topic file and opens it in the editor.
- **Save** / **Discard** / **Delete Topic** in the editor toolbar.

### 15.6.3 New Topic Validation

Topic slug must match `^[a-z][a-z0-9-]*$`. Show inline error if invalid.

### 15.6.4 Delete Topic

- **Delete Topic** button → confirmation dialog: *"Delete topic `{topic}`? This cannot be undone."*
- On confirm: `DELETE /app/v1/intelligence/agents/{agent_id}/memory/semantic/{topic}`
- Topic removed from list.

### 15.6.5 API Endpoints

| Action | Endpoint |
|--------|----------|
| List topics | `GET /app/v1/intelligence/agents/{agent_id}/memory/semantic` |
| Read topic | `GET /app/v1/intelligence/agents/{agent_id}/memory/semantic/{topic}` |
| Write topic | `PUT /app/v1/intelligence/agents/{agent_id}/memory/semantic/{topic}` |
| Delete topic | `DELETE /app/v1/intelligence/agents/{agent_id}/memory/semantic/{topic}` |

---

## 15.7 Skill Authoring

### 15.7.1 Purpose

Users can write their own `SKILL.md` skill definitions from the browser. Authored skills are stored in object storage under the user's tenant prefix and can be installed via the Skill Marketplace (§06).

### 15.7.2 Skill List View

Table of authored skills:

| Column | Source |
|--------|--------|
| Skill ID | `skill_id` from `AuthoredSkillEntry` |
| Storage Path | `path` from `AuthoredSkillEntry` |
| Actions | **Edit**, **Fork**, **Delete** |

Actions above the table:
- **+ New Skill** — open blank skill editor.
- **Import SKILL.md** — file upload dialog (§15.7.5).

Empty state: *"No authored skills yet. Create one to get started."*

### 15.7.3 Skill Editor

Full-page Monaco Editor (Markdown mode) for the `SKILL.md` content.

**SKILL.md template** (pre-filled on new skill):

```markdown
---
name: my-skill
description: What this skill does.
version: 0.1.0
model: claude-sonnet-4-6
tags: [ON_DEMAND]
timeout_seconds: 120
max_tokens: 4096
---

## System Prompt

You are a specialized assistant for...

## Instructions

1. Step one.
2. Step two.

## Output Format

Respond in Markdown.
```

Toolbar:
- **Skill ID** — editable text field (shown in a compact header bar above the editor). Required. Validates `^[a-z][a-z0-9-]+$`.
- **Validate** — `POST /app/v1/intelligence/skills/validate`. Shows a validation result panel below the editor (§15.7.4).
- **Save** — create (`POST`) or update (`PUT`) the authored skill.
- **Discard** — reload from API (edit mode) or clear editor (new mode).
- **Fork** — only visible in edit mode. `POST /app/v1/intelligence/skills/authored/{skill_id}/fork`. Opens the new fork in the editor.

### 15.7.4 Validation Panel

Appears below the editor after **Validate** is clicked:

- **Valid** state: green banner. Shows parsed fields in a read-only key-value table:
  ```
  name:             my-skill
  description:      What this skill does.
  version:          0.1.0
  model:            claude-sonnet-4-6
  tags:             [ON_DEMAND]
  timeout_seconds:  120
  max_tokens:       4096
  ```
- **Invalid** state: red banner. Shows error list:
  ```
  ✗ Missing required field: name
  ✗ Invalid tag value: UNKNOWN
  ```

Validation is non-blocking — users can save without validating, but a warning toast is shown if saved content has not been validated.

### 15.7.5 Import SKILL.md

Clicking **Import SKILL.md** opens a file picker accepting `.md` files only.

On file selection:
1. Upload via `POST /app/v1/intelligence/skills/import` (multipart form).
2. On success (201): navigate to the editor loaded with the imported skill.
3. On 422 (invalid SKILL.md): show error dialog with the validation error message from the response.

### 15.7.6 Fork Workflow

**Fork** button in edit mode:
1. Calls `POST /app/v1/intelligence/skills/authored/{skill_id}/fork`.
2. Opens the fork in the skill editor.
3. Toast: *"Forked as `{forked_skill_id}`."*

### 15.7.7 Delete Skill

**Delete** in the skill list table:
- Confirmation dialog: *"Delete `{skill_id}`? This cannot be undone."*
- On confirm: `DELETE /app/v1/intelligence/skills/authored/{skill_id}`
- Row removed on success.

### 15.7.8 API Endpoints

| Action | Endpoint |
|--------|----------|
| List authored skills | `GET /app/v1/intelligence/skills/authored` |
| Create skill | `POST /app/v1/intelligence/skills/authored` |
| Get skill | `GET /app/v1/intelligence/skills/authored/{skill_id}` |
| Update skill | `PUT /app/v1/intelligence/skills/authored/{skill_id}` |
| Delete skill | `DELETE /app/v1/intelligence/skills/authored/{skill_id}` |
| Fork skill | `POST /app/v1/intelligence/skills/authored/{skill_id}/fork` |
| Validate content | `POST /app/v1/intelligence/skills/validate` |
| Import file | `POST /app/v1/intelligence/skills/import` |

---

## 15.8 UX Details & Shared Patterns

### 15.8.1 Monaco Editor Configuration

All Markdown editors in the Intelligence Hub use Monaco Editor (already used in Canvas Editor §04):

| Setting | Value |
|---------|-------|
| Language | `markdown` |
| Theme | Match cockpit design system theme (light/dark) |
| Word wrap | `on` |
| Line numbers | `on` |
| Minimap | `off` |
| Font size | 13px |
| Read-only mode | Episodic entry viewer only |

### 15.8.2 Dirty State

Any editor with unsaved changes:
- Shows an unsaved indicator (dot) in the section nav.
- **Save** button transitions to primary/accent color.
- Navigating away with unsaved changes shows a confirmation: *"You have unsaved changes. Leave without saving?"*

### 15.8.3 Loading & Error States

All sections:
- **Loading**: skeleton content blocks while API call is in-flight.
- **404 / empty**: empty state message with a prompt action (e.g. "Create profile").
- **API error**: error banner with the error message and a **Retry** button.
- **Save success**: green toast (3s) with the relevant confirmation text.
- **Save failure**: error toast (persistent until dismissed) with the API error message.

### 15.8.4 Agent Selector Behaviour

The agent selector (top-right of Intelligence Hub) persists the selected `agent_id` to `localStorage` under the key `graphclaw.intelligence.agent_id`. Default: `main`.

Changing the agent re-fetches all sections for the new agent ID.

---

## 15.9 API Contract Summary

All endpoints are under `/app/v1/intelligence/`. All require `Authorization: Bearer {token}`.

### Agent Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | `/agents/{agent_id}/profile` | Get profile Markdown |
| PUT | `/agents/{agent_id}/profile` | Save profile Markdown |

### Working Memory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/agents/{agent_id}/memory/working` | Get working context |
| PUT | `/agents/{agent_id}/memory/working` | Save working context |
| POST | `/agents/{agent_id}/memory/compact` | Compact and archive |

### Episodic Memory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/agents/{agent_id}/memory/episodic` | List entries |
| GET | `/agents/{agent_id}/memory/episodic/{entry_name}` | Read entry |
| DELETE | `/agents/{agent_id}/memory/episodic/{entry_name}` | Delete entry |

### Semantic Memory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/agents/{agent_id}/memory/semantic` | List topics |
| GET | `/agents/{agent_id}/memory/semantic/{topic}` | Read topic |
| PUT | `/agents/{agent_id}/memory/semantic/{topic}` | Write topic |
| DELETE | `/agents/{agent_id}/memory/semantic/{topic}` | Delete topic |

### Skill Authoring

| Method | Path | Description |
|--------|------|-------------|
| GET | `/skills/authored` | List authored skills |
| POST | `/skills/authored` | Create authored skill |
| GET | `/skills/authored/{skill_id}` | Get authored skill |
| PUT | `/skills/authored/{skill_id}` | Update authored skill |
| DELETE | `/skills/authored/{skill_id}` | Delete authored skill |
| POST | `/skills/authored/{skill_id}/fork` | Fork authored skill |
| POST | `/skills/validate` | Validate SKILL.md (no save) |
| POST | `/skills/import` | Import SKILL.md file upload |

---

## 15.10 Wave G Build Plan

The Intelligence Hub is Wave G of the cockpit build. All backend APIs are complete (Wave 7 of the backend build).

### Phase G.1 — Routing & Navigation

- Add **Intelligence** entry to the sidebar navigation.
- Create `/intelligence` route with agent selector and left-nav sub-sections.
- Implement `localStorage` persistence for agent ID selection.
- Render empty placeholder panels for all sub-sections.

### Phase G.2 — Agent Profile

- Implement `GET` / `PUT` profile API calls.
- Render Monaco Editor with starter template fallback.
- Dirty-state tracking and save/discard toolbar.

### Phase G.3 — Working Memory + Compact

- Implement `GET` / `PUT` working context API calls.
- Render Monaco Editor with size warning banner logic (> 8 000 chars).
- Implement Compact modal with `POST /memory/compact`.
- Auto-reload working context after compact.

### Phase G.4 — Episodic Memory

- Implement `GET` list + paginated table.
- Row-level **View** slide-over with read-only Monaco Editor.
- Row-level **Delete** with confirmation dialog.

### Phase G.5 — Semantic Memory

- Implement topic list + editor two-panel layout.
- `GET` list, `GET` topic, `PUT` topic, `DELETE` topic API calls.
- New topic slug creation with validation.

### Phase G.6 — Skill Authoring

- Implement authored skill list table.
- Skill editor: Monaco Editor + skill ID field + validation panel.
- Create (`POST`) and update (`PUT`) flows.
- Fork button and fork navigation.
- Delete with confirmation.
- Import file upload via `POST /skills/import`.

### Phase G.7 — Polish

- Apply design system tokens (colors, spacing, typography) consistently.
- Dark-mode testing.
- Mobile: Intelligence Hub is read-only on viewports below 768px (editors collapse to read-only views with a "best viewed on desktop" notice).
- Accessibility: all interactive elements keyboard-navigable, ARIA labels on icon buttons.
- Error handling audit across all panels.

---

## 15.11 Out of Scope (Wave G)

The following are explicitly deferred:

| Feature | Reason | Future Phase |
|---------|--------|-------------|
| Agent-to-Agent (A2A) topology view | Requires multi-agent orchestration backend work | Phase H |
| Real-time memory streaming | WebSocket push for agent memory updates in-flight | Phase H |
| Semantic memory search | Full-text search across topics | Phase H |
| Skill version history | Diff viewer for SKILL.md edits over time | Phase H |
| Install authored skill directly from editor | Needs SkillRegistryService integration | Phase H |
| Memory export / import (ZIP) | Bulk backup and restore | Phase I |
