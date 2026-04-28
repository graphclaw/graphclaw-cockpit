# Canvas Redesign — Agent Configuration Hub

**Version:** 2.0  
**Status:** Active  
**Date:** 2026-04-28  
**Dependencies:** agent-subagent-design-requirements.md (v1.0), architecture.md, graphclaw-requirements.md (§23, §26, §34, §38, §57), cockpit-backend-api-prd.md (§04)

---

## 1. Purpose & Scope

This document specifies the complete redesign of the GraphClaw Cockpit Canvas Editor from a generic workflow builder into an **Agent Configuration Hub** — the primary visual interface for creating, inspecting, wiring, and managing the agent ecosystem.

### 1.1 What Canvas Becomes
- Visual topology of the user's agent ecosystem: orchestrator, sub-agents, external A2A agents, system agents
- Configuration surface for per-agent capability wiring: skills, MCP servers, tool sets
- Inspection UI for agent internals: profile, config, memory tiers
- Bridge between visual design and runtime agent provisioning

### 1.2 What Canvas No Longer Is
- NOT a workflow builder (LLM Call, Condition, Loop, Transform, Human Gate, Input, Output nodes removed)
- NOT a task graph viewer (Task, Goal, Milestone, Dependency nodes removed — these belong to the Graph feature)
- NOT a standalone prototype — fully integrated with backend APIs

### 1.3 Explicit Exclusions
- Workflow execution/dry-run (deferred)
- Real-time collaboration/multi-user editing (deferred)
- Agent version side-by-side diff viewer (deferred — move to Intelligence Hub)
- SKILL.md authoring editor (lives in Intelligence Hub, not canvas)
- Mobile canvas (desktop only; mobile shows agent list view)

---

## 2. Architecture Alignment

### 2.1 Storage Systems (from agent-subagent-design-requirements.md §2, §10)

| System | Path | Purpose | API |
|--------|------|---------|-----|
| **Canvas Definitions** | `agents/{user_id}/definitions/{agent_id}.json` | Per-agent definition + free-form config | `GET/POST/PATCH/DELETE /app/v1/agents` |
| **Canvas Versions** | `agents/{user_id}/definitions/{agent_id}/versions/{v}.json` | Auto-versioned snapshots on PATCH | `GET /app/v1/agents/{id}/versions` |
| **Canvas Layout** | `agents/{user_id}/definitions/canvas-layout.json` | Node positions, zoom, pan (UI-only) | `GET/PUT /app/v1/canvas/layout` (NEW) |
| **Runtime Agents** | `{user_id}/agents/{agent_id}/` | Executable agent with profile + memory | `GET /app/v1/intelligence/agents` |
| **User Agent Config** | `agents/{user_id}/agent_config.json` | Global user-level agent config | `GET/PUT/PATCH /app/v1/config` (EXISTS) |

> **Note:** Canvas layout lives under the same `agents/{user_id}/definitions/` prefix as agent definitions — no new StoragePaths method needed. This prefix is the established namespace for all canvas-related user artifacts.

### 2.2 Bridge Requirement (from agent-subagent-design-requirements.md §10.2, B10)

When canvas creates or modifies an agent, it MUST provision/sync runtime files:

**On POST (create):**
1. Save canvas definition at `agents/{user_id}/definitions/{agent_id}.json`
2. Provision runtime at `{user_id}/agents/{agent_id}/` with profile.md, manifest.json, config.json, memory/semantic/knowledge.md
3. Invalidate AgentCatalog Redis cache

**On PATCH (update):**
1. Update canvas definition + create version snapshot (existing behavior)
2. Sync changes to runtime profile.md and config.json
3. Do NOT touch memory files

**On DELETE:**
1. Delete canvas definition (existing behavior)
2. **Currently orphans version history** — fix: also delete `agents/{user_id}/definitions/{agent_id}/versions/` prefix
3. Prompt user: "Also delete runtime agent and memory?" — never silent delete
4. If confirmed, delete runtime files at `{user_id}/agents/{agent_id}/`

### 2.3 Agent Types (from agent-subagent-design-requirements.md §2)

| Type | Storage | Canvas Behavior |
|------|---------|----------------|
| **Main Orchestrator** | `{user_id}/agents/{user_id}/` | Always-present root node, cannot be deleted, visually distinct |
| **User Sub-Agent** | `{user_id}/agents/{agent_id}/` | Created via (+), fully configurable |
| **System Agent** | `system/agents/{agent_id}/` | Read-only reference node, dimmed styling |
| **External Agent (A2A)** | Registered via `/app/v1/a2a/agents` | Special node with A2A protocol config |

---

## 3. Per-Agent Capability Scoping

### 3.1 The Problem ("No Flooding" Principle)

Currently, tool invocations return EVERYTHING visible to the user:
- `_tool_list_available_skills` → ALL installed skills (no `agent_id` parameter)
- `_tool_list_mcp_tools` → ALL tools from ALL registered MCP servers (no `agent_id` parameter)
- `_tool_list_available_agents` → ALL agent manifests (no `agent_id` parameter)
- `ToolSetRegistry.activate` → any named set, no restriction (no `agent_id` parameter)

This floods agents with irrelevant capabilities, increasing hallucination risk and token waste.

### 3.2 The Solution: config.json Scoping

The runtime agent's config.json at `{user_id}/agents/{agent_id}/config.json` is extended:

```json
{
  "llm_model": "claude-sonnet-4-20250514",
  "heartbeat_interval_seconds": 60,
  "execution_timeout_seconds": 600,
  "skills": ["email-classifier", "research-assistant"],
  "mcp_servers": ["mcp-github", "mcp-slack"],
  "tool_sets": ["task_management", "planning", "skills"],
  "sub_agents": ["research-agent", "comms"]
}
```

**New field: `tool_sets`** — array of named tool set IDs this agent can `load_tool_set()`. Available sets: `task_management`, `planning`, `skills`, `mcp`, `delegation`.

**New field: `sub_agents`** — array of agent_ids this orchestrator can delegate to (only meaningful for orchestrator; sub-agents cannot delegate per flat hierarchy rule).

### 3.3 Backend Filtering Changes Required

| Tool Function | File | Current | Required Change |
|---------------|------|---------|-----------------|
| `_tool_list_available_skills(user_id, args)` | `main_orchestrator.py` | Returns all installed skills | Add `agent_id` param; filter by runtime `config.json.skills[]` |
| `_tool_list_mcp_tools(user_id, args)` | `main_orchestrator.py` | Returns all MCP server tools | Add `agent_id` param; filter by runtime `config.json.mcp_servers[]` |
| `ToolSetRegistry.activate(set_name)` | `tool_registry.py` | Activates any set | Add `agent_id` param; validate against runtime `config.json.tool_sets[]` |
| `_tool_list_available_agents(user_id, args)` | `main_orchestrator.py` | Returns all manifests | Sub-agents: return empty (flat hierarchy). Orchestrator: filter by `config.json.sub_agents[]` if set |
| `_tool_delegate_to_agent(user_id, args)` | `main_orchestrator.py` | Delegates to any agent | Validate target `agent_id` is in caller's `config.json.sub_agents[]` |

### 3.4 Applies to Main Orchestrator

The orchestrator's runtime config.json is ALSO the scoping source. Canvas is where users visually manage these wirings for ALL agents including the orchestrator.

### 3.5 Secure-by-Default Semantics

| config.json field state | Behavior |
|------------------------|----------|
| Field present, explicit empty `[]` | Agent gets NONE of that capability type |
| Field present, populated `["a","b"]` | Agent gets only listed items |
| Field entirely absent (key missing) | Backward compatibility: agent gets ALL available (no filter applied) |

This ensures existing agents continue working while new canvas-created agents start with explicit scoping.

---

## 4. Node Types

### 4.1 Orchestrator Node

**Visual:** Largest node (280px wide), brand cyan (#0EA5E9) accent, crown/brain icon, always centered at canvas top.

**Display:**
- Agent name (editable inline)
- LLM model badge (e.g., "claude-sonnet-4")
- Wiring summary: "3 skills · 2 MCP · 1 tool set · 2 sub-agents"
- Status indicator (heartbeat pulse when active)

**Handles:** Bottom handle (source for delegation edges to sub-agents). Left/right handles for skill/MCP/tool set wiring edges.

**Cannot be:** Deleted, duplicated, or disconnected from canvas.

### 4.2 Sub-Agent Node

**Visual:** Medium node (220px), green (#10B981) accent, Bot icon.

**Display:**
- Agent name (from manifest.json)
- LLM model badge
- Wiring summary: "2 skills · 1 MCP"
- Status: IDLE / RUNNING / BLOCKED (from AgentHealthMonitor)

**Handles:** Top (target for delegation edge from orchestrator), left/right (for skill/MCP/tool set wiring).

**Created via:** (+) Add Agent action on canvas.

### 4.3 System Agent Node

**Visual:** Medium node (220px), gray (#9CA3AF) accent, Shield icon, dimmed opacity (0.7).

**Display:**
- Agent name (from system manifest.json)
- Capabilities list (read-only)
- Tool hint text
- Badge: "System" (non-removable)

**Read-only:** No configuration, no edge drawing to it. Informational only.

### 4.4 External Agent (A2A) Node

**Visual:** Medium node (220px), purple (#A855F7) accent, Globe icon, dotted border.

**Display:**
- Agent name (from A2A registration)
- Endpoint URL (masked)
- Capabilities list
- Trust status: ACTIVE / REVOKED

**Handles:** Top (target for A2A link from orchestrator).

**Config (in PropertyInspector):**
- A2A endpoint URL
- Authentication key (display masked, rotate button)
- Capabilities array
- Reporting mode (API / Channel fallback)

### 4.5 Skill Node

**Visual:** Compact node (180px), orange (#F59E0B) accent, Wand2 icon.

**Display:**
- Skill name
- Source: "Installed" / "Authored" / "Marketplace"
- Output type badge: "AUTO" / "DRAFT"
- LLM model hint

**Handles:** Left handle (target for wiring edges from agents).

**Click action:** Opens SKILL.md preview in PropertyInspector (read-only).

### 4.6 MCP Server Node

**Visual:** Compact node (180px), red (#EF4444) accent, Plug icon.

**Display:**
- Server name
- Transport badge: "HTTP" / "SSE" / "STDIO"
- Trust tier badge: "AUTO" (green) / "GATED" (orange) / "BLOCKED" (red)
- Tools count: "5 tools"

**Handles:** Left handle (target for wiring edges from agents).

**Click action:** Opens tools list in PropertyInspector.

### 4.7 Tool Set Node

**Visual:** Compact node (160px), blue (#3B82F6) accent, Package icon.

**Display:**
- Set name (e.g., "task_management")
- Tools count: "4 tools"
- Tools preview list

**Handles:** Left handle (target for wiring edges from agents).

**Fixed set:** 5 system-defined tool sets: `task_management`, `planning`, `skills`, `mcp`, `delegation`.

---

## 5. Edge Types

| Edge | Source → Target | Color | Style | Animated | Deletable |
|------|----------------|-------|-------|----------|-----------|
| **Delegation** | Orchestrator → Sub-Agent | Cyan #0EA5E9 | Solid 2.5px | Yes (pulse) | Yes |
| **Skill Wiring** | Agent → Skill | Orange #F59E0B | Solid 1.5px | No | Yes |
| **MCP Wiring** | Agent → MCP Server | Red #EF4444 | Solid 1.5px | No | Yes |
| **Tool Set Wiring** | Agent → Tool Set | Blue #3B82F6 | Dashed 1.5px | No | Yes |
| **A2A Link** | Orchestrator → External Agent | Purple #A855F7 | Dotted 2px | Yes (pulse) | Yes |

**Edge semantics on save:** Creating/deleting an edge updates the source agent's runtime `config.json`:
- Skill wiring edge → adds/removes skill_id from `config.json.skills[]`
- MCP wiring edge → adds/removes server_id from `config.json.mcp_servers[]`
- Tool set wiring edge → adds/removes set_name from `config.json.tool_sets[]`
- Delegation edge → adds/removes agent_id from `config.json.sub_agents[]`

---

## 6. Panels & Layout

### 6.1 Overall Layout

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR (56px) — Logo | Breadcrumb | "Agent Canvas" | Save  │
├──────────────────────────────────────────────────────────────┤
│ ┌─LEFT─────┐ ┌─CENTER CANVAS──────────────────┐ ┌─RIGHT────┐│
│ │ Node     │ │                                 │ │ Property ││
│ │ Palette  │ │  [Floating Toolbar]             │ │ Inspector││
│ │ (220px)  │ │                                 │ │ (320px)  ││
│ │          │ │  ┌──────────────┐               │ │          ││
│ │ + Add    │ │  │ Orchestrator │               │ │ [Tabs]   ││
│ │ Agent    │ │  └──────┬───────┘               │ │ Profile  ││
│ │          │ │    ┌────┴────┐                  │ │ Config   ││
│ │ AGENTS   │ │ ┌──┴──┐  ┌──┴──┐               │ │ Memory   ││
│ │ SKILLS   │ │ │Sub-1│  │Sub-2│               │ │ Wiring   ││
│ │ MCP      │ │ └─────┘  └─────┘               │ │          ││
│ │ TOOL SETS│ │                                 │ │          ││
│ │          │ │  [Minimap]    [Zoom]            │ │          ││
│ └──────────┘ └─────────────────────────────────┘ └──────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Left Panel — Node Palette (220px)

**Sections (collapsible):**

**➕ Add Agent** — Primary action button at top. Opens AddAgentDialog.

**AGENTS section:**
- Lists existing agents (orchestrator always first, then sub-agents alphabetically, then system agents dimmed)
- Each row: color dot + agent name + type badge ("Orchestrator" / "Sub-Agent" / "System")
- A2A agents appear here (purple dot, "A2A" badge)
- Click → select on canvas + scroll to node
- Drag → reposition if already on canvas

**RESOURCES section** (collapsible subsections):
- **Skills** subsection: Lists all installed skills from `GET /app/v1/skills`. Each row shows skill name, output type badge ("AUTO"/"DRAFT"), and checkmark if wired to currently selected agent.
- **MCP Servers** subsection: Lists all registered MCP servers from `GET /app/v1/mcp-servers`. Each row shows server name, transport badge, trust tier indicator, and checkmark if wired to selected agent.
- **Tool Sets** subsection: Lists all 5 system tool sets. Each row shows set name, tools count, and checkmark if wired to selected agent.
- Each resource item is draggable to canvas — dropping it creates the resource node.
- Items already wired to the selected agent show a **✓ checkmark icon** in the palette list.

### 6.3 Wiring Interaction Model

Users can wire capabilities to agents through **two complementary paths** that stay in sync:

```
Palette (browse & place)   Canvas (visual wiring)    Inspector (configure)
┌──────────────────┐      ┌───────────────────┐     ┌──────────────────┐
│ SKILLS           │ drag │                   │     │ Wiring Tab       │
│ ✓ email-cls      │────→ │  [Skill Node]     │     │ ☑ email-cls      │
│   research       │      │       ↑           │←──→ │ ☐ research       │
│                  │      │   [wiring edge]   │sync │                  │
│ MCP SERVERS      │ drag │       │           │     │ MCP Servers      │
│ ✓ github         │────→ │  [MCP Node]       │     │ ☑ github         │
│   slack          │      │                   │     │ ☐ slack          │
└──────────────────┘      └───────────────────┘     └──────────────────┘
```

**Path A: Palette → Canvas → Edge**
1. User drags a resource (skill, MCP server, tool set) from palette onto canvas
2. Resource node appears on canvas
3. User draws an edge from the agent's handle to the resource node's handle
4. Edge creation triggers `PUT /app/v1/agents/{id}/config` — adds resource ID to config.json array
5. Palette checkmark appears next to the wired resource

**Path B: PropertyInspector Wiring Tab**
1. User selects an agent node on canvas
2. Opens Wiring tab in PropertyInspector
3. Multi-select checklists show all available skills, MCP servers, tool sets
4. Checking a box → edge appears on canvas + resource node auto-placed if not already on canvas + config.json updated
5. Unchecking → edge removed + config.json updated

**Source of truth:** Always the agent's runtime `config.json` (skills[], mcp_servers[], tool_sets[], sub_agents[]). Canvas edges and palette checkmarks are derived views.

### 6.4 Center Canvas

**React Flow viewport** with:
- Dot grid background (24px gap, subtle)
- Minimap (bottom-right, 140×88px)
- Zoom controls (bottom-center): −, level %, +, fit-to-view
- `minZoom={0.3}`, `maxZoom={3}`
- `fitView` on initial load

**Floating Toolbar (centered, top):**
- Select tool (default) | Pan tool
- Separator
- Undo | Redo
- Separator
- Auto-layout (dagre algorithm)
- Separator
- Save

### 6.5 Right Panel — Property Inspector (320px)

**When no node selected:** Shows canvas summary:
- Total agents count
- Total wired skills/MCP/tool sets
- Last saved timestamp

**When agent node selected (Orchestrator or Sub-Agent):** Four tabs:

**Tab 1: Profile**
- Monaco editor for profile.md content
- Save / Discard buttons
- Read from: `GET /app/v1/intelligence/agents/{id}/profile` (EXISTS)
- Write to: `PUT /app/v1/intelligence/agents/{id}/profile` (EXISTS)

**Tab 2: Config**
- LLM Model dropdown (from approved list in PRD §26)
- Heartbeat interval (number input, seconds)
- Execution timeout (number input, seconds)
- Read/Write: `GET/PUT /app/v1/agents/{id}/config` (NEW endpoints)

**Tab 3: Memory** (read-only overview)
- Working memory: character count + last modified
- Episodic: count of active + archived entries
- Semantic: list of topic files with sizes
- "Open in Intelligence Hub" link (navigates to `/intelligence/agents/{id}/memory`)
- Read from: existing intelligence memory endpoints

**Tab 4: Wiring**
- **Skills:** Multi-select checklist of all installed skills. Checked = wired to this agent.
- **MCP Servers:** Multi-select checklist of all registered MCP servers. Checked = wired.
- **Tool Sets:** Multi-select checklist of 5 system sets. Checked = available to this agent.
- **Sub-Agents** (orchestrator only): Multi-select of user agents. Checked = can delegate to.
- Changes here create/remove edges on canvas AND update runtime config.json.

**When Skill node selected:**
- SKILL.md content preview (read-only Monaco)
- Metadata: output_type, llm_config, trigger_types
- "Wired to:" list of agents that have this skill
- Skill data from: `GET /app/v1/skills` (EXISTS)

**When MCP Server node selected:**
- Server details: transport, endpoint, trust_tier
- Tools list from: `GET /app/v1/mcp-servers/{id}/tools` (EXISTS)
- "Wired to:" list of agents

**When External Agent (A2A) node selected:**
- Endpoint URL (editable)
- Auth key (masked, rotate button)
- Capabilities editor
- Status: ACTIVE / REVOKED
- Data from: `GET /app/v1/a2a/agents` (EXISTS)

---

## 7. User Flows

### 7.1 First-Time Canvas Load

1. User navigates to `/canvas`
2. Fetch in parallel:
   - `GET /app/v1/canvas/layout` → node positions, zoom, pan (or null if first visit)
   - `GET /app/v1/intelligence/agents` → all runtime agents (user + system)
   - `GET /app/v1/skills` → installed skills
   - `GET /app/v1/mcp-servers` → registered MCP servers
   - `GET /app/v1/a2a/agents` → external A2A agents
3. For each agent: read config.json via `GET /app/v1/agents/{id}/config` to determine wiring
4. If no layout exists: auto-layout with orchestrator centered at top (dagre)
5. Orchestrator node always present (agent_id == user_id from auth)
6. Edges drawn based on each agent's config.json (skills[], mcp_servers[], tool_sets[], sub_agents[])
7. Resource nodes (skills, MCP, tool sets) only appear on canvas if wired to at least one agent (or user explicitly places them)

### 7.2 Add Agent (+)

1. User clicks (+) Add Agent button in palette
2. AddAgentDialog opens:
   - Agent Name (required) — auto-slugifies to agent_id
   - Description (required)
   - LLM Model (dropdown, default: claude-sonnet-4)
   - Initial Skills (multi-select from installed, optional)
   - Initial MCP Servers (multi-select from registered, optional)
   - Initial Tool Sets (multi-select from 5 available, optional)
3. User confirms
4. `POST /app/v1/agents` with body including config containing skills/mcp/tool sets
5. Bridge: backend provisions runtime files at `{user_id}/agents/{agent_id}/`
6. New Sub-Agent node appears on canvas connected via delegation edge from orchestrator
7. Orchestrator's config.json.sub_agents[] updated to include new agent_id

### 7.3 Wire a Skill to an Agent

**Method A: Edge Drawing**
1. User clicks agent's right handle → drag to skill node's left handle
2. Edge created → config.json.skills[] updated via `PUT /app/v1/agents/{id}/config`
3. Canvas auto-saves layout

**Method B: PropertyInspector Wiring Tab**
1. Select agent node → Wiring tab → check skill in Skills checklist
2. Edge appears on canvas + config.json updated
3. If skill node not on canvas, it is auto-placed near the agent

**Method C: Palette Drag-and-Drop**
1. User drags skill from palette Resources section onto canvas
2. Skill node appears
3. User draws wiring edge from agent to skill
4. config.json updated on edge creation

### 7.4 Remove a Capability

1. Select edge on canvas → Delete key, OR
2. Select agent → Wiring tab → uncheck skill/MCP/tool set
3. Edge removed → ID removed from config.json array
4. Canvas auto-saves

### 7.5 Inspect Agent

1. Click any agent node → PropertyInspector opens with 4 tabs
2. Profile: view/edit profile.md via intelligence API
3. Config: view/edit LLM model, timeouts via agent config API
4. Memory: overview with "Open in Intelligence Hub" link
5. Wiring: full capability inventory with check/uncheck

### 7.6 Delete Agent

1. Select sub-agent node → Delete key (or context menu → Delete)
2. Confirmation dialog: "Delete agent '{name}'?"
3. Second checkbox: "Also delete runtime agent and all memory? This cannot be undone."
4. If confirmed: `DELETE /app/v1/agents/{id}` with `?cleanup_runtime=true|false` query param
5. Backend deletes canvas definition + version history. If cleanup_runtime=true, also deletes `{user_id}/agents/{agent_id}/`
6. All edges to/from this agent removed from canvas
7. Orchestrator's config.json.sub_agents[] updated

### 7.7 Save & Persistence

**Autosave (debounced 2s):** After any node move, edge create/delete, or viewport change:
- `PUT /app/v1/canvas/layout` → saves node positions, viewport state
- Individual `PUT /app/v1/agents/{id}/config` calls for agents whose wiring changed

**Explicit Save:** Save button in toolbar triggers immediate save, toast: "Canvas saved"

---

## 8. API Endpoints

### 8.1 Existing Endpoints Used by Canvas (no modifications needed)

| Method | Path | Purpose | Cockpit Hook Status |
|--------|------|---------|---------------------|
| GET | `/app/v1/intelligence/agents` | List runtime agents | ✅ `useIntelligenceAgents()` exists |
| GET | `/app/v1/intelligence/agents/{id}/profile` | Load profile.md | ✅ `useAgentProfile()` exists |
| PUT | `/app/v1/intelligence/agents/{id}/profile` | Save profile.md | ✅ `useUpdateAgentProfile()` exists |
| GET | `/app/v1/intelligence/agents/{id}/memory/*` | Memory endpoints | ✅ hooks exist |
| GET | `/app/v1/skills` | List installed skills | ❌ hook needed |
| GET | `/app/v1/mcp-servers` | List MCP servers | ❌ hook needed |
| GET | `/app/v1/mcp-servers/{id}/tools` | List MCP server tools | ❌ hook needed |
| GET | `/app/v1/a2a/agents` | List A2A agents | ❌ hook needed |

### 8.2 Existing Endpoints Requiring Modification

| Method | Path | Current Behavior | Required Change |
|--------|------|-----------------|-----------------|
| POST | `/app/v1/agents` | Creates canvas definition only. Agent ID is `AGT-{uuid12}` | **Bridge:** also provision runtime files. Agent ID must be slugified from name (not UUID). Accept `agent_id` in request body. |
| PATCH | `/app/v1/agents/{id}` | Updates definition + versions. No runtime sync | **Bridge:** also sync runtime profile.md + config.json |
| DELETE | `/app/v1/agents/{id}` | Deletes definition only. **Orphans version history.** | Clean up version history prefix. Accept `?cleanup_runtime=true` to also delete runtime agent. |

### 8.3 New Endpoints Required

| Method | Path | Purpose | Storage Path |
|--------|------|---------|--------------|
| GET | `/app/v1/canvas/layout` | Load canvas layout | `agents/{user_id}/definitions/canvas-layout.json` |
| PUT | `/app/v1/canvas/layout` | Save canvas layout | Same |
| GET | `/app/v1/agents/{id}/config` | Load agent runtime config.json | `{user_id}/agents/{agent_id}/config.json` |
| PUT | `/app/v1/agents/{id}/config` | Update runtime config.json (syncs to runtime) | Same |
| GET | `/app/v1/agents/{id}/wiring` | Wiring summary (convenience endpoint) | Reads config.json, resolves names |

**Wiring endpoint response shape:**
```json
{
  "agent_id": "research-agent",
  "skills": [{"skill_id": "email-classifier", "name": "Email Classifier", "enabled": true}],
  "mcp_servers": [{"server_id": "mcp-github", "name": "GitHub MCP", "trust_tier": "AUTO"}],
  "tool_sets": ["task_management", "planning"],
  "sub_agents": [{"agent_id": "comms", "name": "Communications Agent", "source": "system"}]
}
```

### 8.4 Backend Tool Filtering (Per-Agent Scoping)

| File | Function | Change |
|------|----------|--------|
| `agent/main_orchestrator.py` | `_tool_list_available_skills` | Accept `agent_id`, read config.json.skills[], filter results |
| `agent/main_orchestrator.py` | `_tool_list_mcp_tools` | Accept `agent_id`, read config.json.mcp_servers[], filter results |
| `agent/main_orchestrator.py` | `_tool_list_available_agents` | Sub-agents: return empty. Orchestrator: filter by config.json.sub_agents[] if present |
| `agent/tool_registry.py` | `ToolSetRegistry.activate` | Accept `agent_id`, validate against config.json.tool_sets[] |
| `agent/main_orchestrator.py` | `_tool_delegate_to_agent` | Validate target in caller's config.json.sub_agents[] |

---

## 9. State Management

### 9.1 Zustand Store: useCanvasStore

```typescript
interface CanvasState {
  // React Flow state
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };

  // Data state (loaded from API on mount)
  agents: AgentListEntry[];          // from GET /intelligence/agents
  skills: SkillEntry[];              // from GET /skills
  mcpServers: MCPServerEntry[];      // from GET /mcp-servers
  a2aAgents: A2AAgentEntry[];        // from GET /a2a/agents
  agentConfigs: Map<string, AgentConfig>;  // per-agent config.json

  // Undo/redo
  undoStack: CanvasSnapshot[];
  redoStack: CanvasSnapshot[];

  // Persistence
  isDirty: boolean;
  lastSaved: string | null;
  isSaving: boolean;

  // Actions
  addAgent(agent: CreateAgentInput): Promise<void>;
  deleteAgent(agentId: string, cleanupRuntime: boolean): Promise<void>;
  wireCapability(agentId: string, resourceId: string, type: WiringType): Promise<void>;
  unwireCapability(agentId: string, resourceId: string, type: WiringType): Promise<void>;
  updateAgentConfig(agentId: string, patch: Partial<AgentConfig>): Promise<void>;
  selectNode(nodeId: string | null): void;
  undo(): void;
  redo(): void;
  save(): Promise<void>;
  loadCanvas(): Promise<void>;
  autoLayout(): void;
}

type WiringType = 'skill' | 'mcp' | 'tool_set' | 'sub_agent';
```

### 9.2 TanStack Query Hooks (new hooks needed for canvas)

| Hook | Endpoint | Status |
|------|----------|--------|
| `useInstalledSkills()` | `GET /app/v1/skills` | NEW |
| `useMCPServers()` | `GET /app/v1/mcp-servers` | NEW |
| `useMCPServerTools(serverId)` | `GET /app/v1/mcp-servers/{id}/tools` | NEW |
| `useA2AAgents()` | `GET /app/v1/a2a/agents` | NEW |
| `useCanvasLayout()` | `GET /app/v1/canvas/layout` | NEW |
| `useSaveCanvasLayout()` | `PUT /app/v1/canvas/layout` | NEW |
| `useAgentConfig(agentId)` | `GET /app/v1/agents/{id}/config` | NEW |
| `useSaveAgentConfig()` | `PUT /app/v1/agents/{id}/config` | NEW |
| `useAgentWiring(agentId)` | `GET /app/v1/agents/{id}/wiring` | NEW |
| `useCreateAgentDefinition()` | `POST /app/v1/agents` | NEW |
| `useDeleteAgentDefinition()` | `DELETE /app/v1/agents/{id}` | NEW |

Existing hooks reused: `useIntelligenceAgents()`, `useAgentProfile()`, `useUpdateAgentProfile()`, intelligence memory hooks.

---

## 10. Component Architecture

### 10.1 File Structure

```
src/features/canvas/
├── CanvasEditorPage.tsx           # Main page (REWRITE — replace all current code)
├── CanvasEditorPage.test.tsx      # Tests (REWRITE)
├── NodePalette.tsx                # Left panel (REWRITE — agent-centric)
├── PropertyInspector.tsx          # Right panel (NEW)
├── AddAgentDialog.tsx             # (+) add agent modal (NEW)
├── CanvasToolbar.tsx              # Floating toolbar (NEW)
├── nodes/
│   ├── OrchestratorNode.tsx       # NEW
│   ├── SubAgentNode.tsx           # NEW
│   ├── SystemAgentNode.tsx        # NEW
│   ├── ExternalAgentNode.tsx      # NEW (A2A)
│   ├── SkillNode.tsx              # NEW
│   ├── MCPServerNode.tsx          # NEW
│   └── ToolSetNode.tsx            # NEW
├── edges/
│   ├── DelegationEdge.tsx         # NEW
│   ├── WiringEdge.tsx             # NEW (shared for skill/MCP/tool set — styled by type prop)
│   └── A2ALinkEdge.tsx            # NEW
├── panels/
│   ├── ProfilePanel.tsx           # NEW — Monaco profile editor
│   ├── ConfigPanel.tsx            # NEW — LLM/timeout config form
│   ├── MemoryPanel.tsx            # NEW — Memory overview with IH link
│   ├── WiringPanel.tsx            # NEW — Multi-select checklists
│   ├── SkillDetailPanel.tsx       # NEW — SKILL.md viewer
│   ├── MCPDetailPanel.tsx         # NEW — MCP server + tools list
│   └── A2ADetailPanel.tsx         # NEW — A2A config editor
└── hooks/
    ├── useCanvasStore.ts          # NEW — Zustand store
    └── useCanvasApi.ts            # NEW — TanStack Query hooks
```

### 10.2 Component Dependency Tree

```
CanvasEditorPage
├── NodePalette (left)
│   └── AddAgentDialog
├── ReactFlow (center)
│   ├── OrchestratorNode, SubAgentNode, SystemAgentNode, ExternalAgentNode
│   ├── SkillNode, MCPServerNode, ToolSetNode
│   ├── DelegationEdge, WiringEdge, A2ALinkEdge
│   ├── Background, MiniMap, Controls (from @xyflow/react)
│   └── CanvasToolbar (floating overlay)
└── PropertyInspector (right)
    ├── ProfilePanel (agent selected)
    ├── ConfigPanel (agent selected)
    ├── MemoryPanel (agent selected)
    ├── WiringPanel (agent selected)
    ├── SkillDetailPanel (skill selected)
    ├── MCPDetailPanel (MCP server selected)
    └── A2ADetailPanel (A2A agent selected)
```

---

## 11. Cleanup Required (Existing Code)

### 11.1 Files to Rewrite

The current canvas implementation is a prototype that will be fully replaced:

| File | Lines | Reason |
|------|-------|--------|
| `src/features/canvas/CanvasEditorPage.tsx` | 122 | Rewrite in place — all local useState + workflow nodes removed |
| `src/features/canvas/NodePalette.tsx` | 46 | Rewrite in place — 9 workflow node types replaced with agent-centric palette |
| `src/features/canvas/CanvasEditorPage.test.tsx` | 84 | Rewrite in place — tests for old node types and toolbar |
| `e2e/canvas/canvas-editor.spec.ts` | 28 | Rewrite — tests for old canvas behavior |
| `src/features/canvas/nodes/` | 0 | Empty directory — populate with custom node components |

### 11.2 Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/Sidebar.tsx` (line 51) | Update Canvas icon from `GitFork` to `Brain` or `Network` to reflect agent topology |
| `src/components/layout/Topbar.tsx` (line 17) | Update breadcrumb label from `'Canvas'` to `'Agent Canvas'` |
| `src/components/common/CommandPalette.tsx` (line 22) | Update Canvas command label to `'Agent Canvas'` |
| `src/features/admin/FeaturesPage.tsx` (line 8) | Update feature flag description from `'Visual agent workflow builder'` to `'Agent Configuration Canvas'` |
| `src/features/admin/FeaturesPage.test.tsx` (line 10) | Update test expectation for renamed feature |
| `src/lib/api-hooks.ts` | Add 11 new TanStack Query hooks for canvas API calls |
| `src/routes.tsx` | No change needed — lazy import path and route `/canvas` remains the same |

### 11.3 Backend Cleanup in `api/agents.py`

| Issue | Fix |
|-------|-----|
| Agent ID generation uses `AGT-{uuid12}` (line 245) — random, not idempotent | Replace with slugified name: `_slugify(name)[:40]` (aligns with B1 in agent-subagent-design-requirements.md) |
| `AgentCreateRequest` missing `agent_id` field | Add optional `agent_id: str \| None = None` — if provided, use it; if not, slugify from name |
| `config` field is untyped `dict[str, Any]` | Add Pydantic model `AgentConfigSchema` with typed fields (skills, mcp_servers, tool_sets, sub_agents, llm_model, etc.) |
| DELETE doesn't clean up version history | Add `storage_client.delete_prefix(versions_path)` before deleting definition |
| DELETE doesn't clean up runtime agent | Add `?cleanup_runtime=true` query param; if true, delete `{user_id}/agents/{agent_id}/` |
| No bridge to runtime agent provisioning | Add `_provision_runtime_agent()` helper called from POST and PATCH handlers |
| Version sort is string-based not numeric | Fix: `sorted(versions, key=lambda v: int(v.version))` |

### 11.4 Dependencies

| Dependency | Status | Action |
|------------|--------|--------|
| `@xyflow/react@^12.10.2` | In use | KEEP — used for new canvas implementation |
| `dagre` or `@dagrejs/dagre` | Not installed | ADD — needed for auto-layout algorithm |
| `monaco-editor` / `@monaco-editor/react` | Already in package.json | KEEP — used for ProfilePanel |

---

## 12. Backend Changes Summary

### 12.1 Prerequisites from agent-subagent-design-requirements.md

| ID | Change | Status | Canvas Dependency |
|----|--------|--------|-------------------|
| B1 | Fix UUID auto-gen in `_tool_create_agent` — use deterministic slug | Required | Canvas agent creation relies on idempotent slugs |
| B2 | `GET /intelligence/agents` endpoint | ✅ Implemented | Canvas loads agents from this |
| B10 | Canvas → runtime bridge on POST/PATCH | Required | Core canvas functionality |

### 12.2 New Backend Changes for Canvas

| ID | Change | File | Priority |
|----|--------|------|----------|
| C1 | Extend config.json schema: add `tool_sets[]` and `sub_agents[]` typed fields | `api/agents.py` | HIGH |
| C2 | Per-agent filtering in `_tool_list_available_skills` | `agent/main_orchestrator.py` | HIGH |
| C3 | Per-agent filtering in `_tool_list_mcp_tools` | `agent/main_orchestrator.py` | HIGH |
| C4 | Per-agent validation in `ToolSetRegistry.activate` | `agent/tool_registry.py` | HIGH |
| C5 | Per-agent validation in `_tool_delegate_to_agent` | `agent/main_orchestrator.py` | HIGH |
| C6 | `GET /app/v1/canvas/layout` endpoint | `api/agents.py` or `api/canvas.py` | MEDIUM |
| C7 | `PUT /app/v1/canvas/layout` endpoint | Same | MEDIUM |
| C8 | `GET /app/v1/agents/{id}/config` — read runtime config.json | `api/agents.py` | HIGH |
| C9 | `PUT /app/v1/agents/{id}/config` — update runtime config.json | `api/agents.py` | HIGH |
| C10 | `GET /app/v1/agents/{id}/wiring` — resolved wiring summary | `api/agents.py` | MEDIUM |
| C11 | POST `/agents` bridge: provision runtime agent files | `api/agents.py` | HIGH |
| C12 | PATCH `/agents` bridge: sync runtime profile + config | `api/agents.py` | HIGH |
| C13 | DELETE `/agents` cleanup: versions prefix + optional runtime | `api/agents.py` | MEDIUM |
| C14 | `AgentCreateRequest` accept optional `agent_id` + slugify | `api/agents.py` | HIGH |
| C15 | Fix version sort: string → numeric | `api/agents.py` | LOW |

---

## 13. Frontend Implementation Phases

### Phase 1: Foundation (Backend Prerequisites + Core UI)
**Backend:** C1, C6, C7, C8, C9, C11, C14 (config schema, layout endpoints, agent config endpoints, bridge, agent_id slugification)
**Frontend:**
- Zustand store (`useCanvasStore`)
- TanStack Query hooks (`useCanvasApi`) — all 11 new hooks
- `CanvasEditorPage` rewrite (replace local state with Zustand, add API loading)
- `OrchestratorNode` + `SubAgentNode` custom React Flow components
- `DelegationEdge` component
- `NodePalette` rewrite (agent-centric sections with resource lists)
- `AddAgentDialog` component
- `CanvasToolbar` component
- Canvas layout save/load
- Cleanup: update Sidebar icon, Topbar breadcrumb, CommandPalette label, FeaturesPage description

### Phase 2: Wiring & Inspection (Must Have)
**Backend:** C10, C12, C13 (wiring endpoint, PATCH bridge, DELETE cleanup)
**Frontend:**
- `SkillNode`, `MCPServerNode`, `ToolSetNode` components
- `WiringEdge` component (shared, styled by type prop)
- `PropertyInspector` with 4 tabs shell
- `WiringPanel` with multi-select checklists (bidirectional sync with canvas edges)
- `ConfigPanel` with LLM model dropdown + timeout inputs
- `ProfilePanel` with Monaco editor
- `MemoryPanel` with overview + Intelligence Hub link
- Edge creation/deletion → config.json sync
- Palette checkmark indicators for wired resources
- Auto-layout (dagre) + `@dagrejs/dagre` dependency

### Phase 3: Detail Panels & Advanced (Should Have)
**Backend:** C2, C3, C4, C5, C15 (per-agent tool filtering, version sort fix)
**Frontend:**
- `SkillDetailPanel` (SKILL.md preview)
- `MCPDetailPanel` (server details + tools list)
- `SystemAgentNode` (read-only)
- `ExternalAgentNode` (A2A)
- `A2ALinkEdge`
- `A2ADetailPanel`
- Undo/redo (full implementation with stack)
- Autosave with 2s debounce
- Canvas export/import JSON

---

## 14. Documents Requiring Updates

| Document | Section | Change |
|----------|---------|--------|
| `graphclaw-requirements.md` | §23 | Add "Surface 4: Agent Canvas" as a distinct UX surface |
| `agent-subagent-design-requirements.md` | New §13 | Per-agent capability scoping specification (config.json extensions, filtering, secure-by-default) |
| `agent-subagent-design-requirements.md` | §3.3 | Canvas creation flow with scoping fields |
| `agent-subagent-design-requirements.md` | §10.4 | Canvas layout persistence path |
| `architecture.md` | New section | Canvas Integration Layer |
| `cockpit-backend-api-prd.md` | §04 | Update canvas endpoints for agent config hub |
| `graphclaw-cockpit/build-plan.md` | Wave 8 | Rewrite to reflect agent canvas redesign |

---

## 15. E2E Test Scenarios

| Test | Verification |
|------|-------------|
| Canvas loads with orchestrator | Orchestrator node always present after page load |
| Add agent via (+) | New sub-agent node appears; `POST /agents` called with slugified ID; runtime files provisioned |
| Wire skill to agent via edge | Edge drawn; `PUT /agents/{id}/config` called with skill added to skills[] |
| Wire skill via wiring panel | Checkbox toggle → edge appears on canvas + config.json updated |
| Wire skill via palette drag | Drag skill from palette → drop on canvas → draw edge → config updated |
| Remove skill wiring | Edge removed; config.json.skills[] updated |
| Delete sub-agent | Confirmation dialog shown; node + edges removed; runtime optionally cleaned up |
| Property inspector shows profile | Monaco loads profile.md from intelligence API |
| Config change persists | LLM model dropdown change → `PUT /agents/{id}/config` called |
| Canvas layout persists | Move nodes → reload page → positions match |
| Orchestrator cannot be deleted | Delete key on orchestrator → no action or error toast |
| System agent is read-only | Click system agent → no handles, no edge drawing, inspector shows read-only view |
| Palette shows checkmarks | Select agent → wired resources show ✓ in palette |

---

## 16. Verification Checklist

### Backend
- [ ] POST /agents accepts optional agent_id; slugifies from name if absent
- [ ] POST /agents provisions runtime files (profile.md, manifest.json, config.json, memory/semantic/knowledge.md)
- [ ] PATCH /agents syncs changes to runtime profile.md + config.json
- [ ] DELETE /agents cleans up version history prefix
- [ ] DELETE /agents with `?cleanup_runtime=true` also deletes runtime agent folder
- [ ] GET /agents/{id}/config reads from `{user_id}/agents/{agent_id}/config.json`
- [ ] PUT /agents/{id}/config writes to runtime config.json
- [ ] GET/PUT /canvas/layout persists to `agents/{user_id}/definitions/canvas-layout.json`
- [ ] GET /agents/{id}/wiring returns resolved wiring summary
- [ ] _tool_list_available_skills filters by agent's config.json.skills[]
- [ ] _tool_list_mcp_tools filters by agent's config.json.mcp_servers[]
- [ ] ToolSetRegistry.activate validates against config.json.tool_sets[]
- [ ] _tool_delegate_to_agent validates target in caller's config.json.sub_agents[]
- [ ] Explicit empty `[]` returns no capabilities; missing field returns all (backward compat)
- [ ] AgentCatalog Redis cache invalidated on agent create/delete

### Frontend
- [ ] Canvas loads with orchestrator always present as root node
- [ ] (+) creates agent via POST, node appears with delegation edge
- [ ] Edge creation/deletion syncs to runtime config.json via PUT
- [ ] PropertyInspector tabs render correctly for each node type
- [ ] WiringPanel multi-select state matches edge state on canvas (bidirectional sync)
- [ ] Palette resource items show checkmarks for wired capabilities when agent selected
- [ ] ProfilePanel loads/saves via intelligence API
- [ ] ConfigPanel loads/saves via agent config API
- [ ] MemoryPanel shows correct counts with "Open in Intelligence Hub" link
- [ ] Canvas layout persists across page reloads
- [ ] Auto-layout (dagre) produces clean tree from orchestrator
- [ ] Undo/redo works for node and edge operations
- [ ] Autosave with 2s debounce + explicit save button
- [ ] System agent nodes are non-interactive (read-only, dimmed)
- [ ] Sidebar icon, breadcrumb, command palette updated
- [ ] Feature flag description updated in admin panel
- [ ] No orphaned workflow builder code remains (Input, LLM Call, Condition, etc.)

---

## 17. Implementation Progress Tracker

> **Instructions for Claude:** Update this table as each requirement is implemented. Mark each column when the step is completed. Use ✅ for done, ⬜ for not started, 🔄 for in progress.

### Phase 1: Foundation

| # | Requirement | Code Done | Git Commit | Testing | Deployed Local |
|---|------------|-----------|------------|---------|----------------|
| B1 | Fix UUID auto-gen in `_tool_create_agent` — use deterministic slug | ✅ | ✅ | ✅ | ✅ |
| C1 | Extend config.json schema: add `tool_sets[]` and `sub_agents[]` fields | ✅ | ✅ | ✅ | ✅ |
| C6 | `GET /app/v1/canvas/layout` endpoint | ✅ | ✅ | ✅ | ✅ |
| C7 | `PUT /app/v1/canvas/layout` endpoint | ✅ | ✅ | ✅ | ✅ |
| C8 | `GET /app/v1/agents/{id}/config` endpoint | ✅ | ✅ | ✅ | ✅ |
| C9 | `PUT /app/v1/agents/{id}/config` endpoint | ✅ | ✅ | ✅ | ✅ |
| C11 | POST `/agents` bridge: provision runtime agent files | ✅ | ✅ | ✅ | ✅ |
| C14 | `AgentCreateRequest` accept optional `agent_id` + slugify | ✅ | ✅ | ✅ | ✅ |
| F1 | Zustand store (`useCanvasStore`) | ✅ | ✅ | ✅ | ✅ |
| F2 | TanStack Query hooks (`useCanvasApi`) — 11 new hooks | ✅ | ✅ | ✅ | ✅ |
| F3 | `CanvasEditorPage` rewrite (Zustand + API loading) | ✅ | ✅ | ✅ | ✅ |
| F4 | `OrchestratorNode` custom React Flow component | ✅ | ✅ | ✅ | ✅ |
| F5 | `SubAgentNode` custom React Flow component | ✅ | ✅ | ✅ | ✅ |
| F6 | `DelegationEdge` component | ✅ | ✅ | ✅ | ✅ |
| F7 | `NodePalette` rewrite (agents + resources sections with checkmarks) | ✅ | ✅ | ✅ | ✅ |
| F8 | `AddAgentDialog` component | ✅ | ✅ | ✅ | ✅ |
| F9 | `CanvasToolbar` component | ✅ | ✅ | ✅ | ✅ |
| F10 | Canvas layout save/load | ✅ | ✅ | ✅ | ✅ |
| F11 | Cleanup: Sidebar icon, Topbar breadcrumb, CommandPalette, FeaturesPage | ✅ | ✅ | ✅ | ✅ |

### Phase 2: Wiring & Inspection

| # | Requirement | Code Done | Git Commit | Testing | Deployed Local |
|---|------------|-----------|------------|---------|----------------|
| C10 | `GET /app/v1/agents/{id}/wiring` endpoint | ✅ | ✅ | ✅ | ✅ |
| C12 | PATCH `/agents` bridge: sync runtime profile + config | ✅ | ✅ | ✅ | ✅ |
| C13 | DELETE `/agents` cleanup: versions prefix + optional runtime | ✅ | ✅ | ✅ | ✅ |
| F12 | `SkillNode` custom React Flow component | ✅ | ✅ | ✅ | ✅ |
| F13 | `MCPServerNode` custom React Flow component | ✅ | ✅ | ✅ | ✅ |
| F14 | `ToolSetNode` custom React Flow component | ✅ | ✅ | ✅ | ✅ |
| F15 | `WiringEdge` component (shared, styled by type) | ✅ | ✅ | ✅ | ✅ |
| F16 | `PropertyInspector` with 4 tabs shell | ✅ | ✅ | ✅ | ✅ |
| F17 | `WiringPanel` with multi-select checklists (bidirectional edge sync) | ✅ | ✅ | ✅ | ✅ |
| F18 | `ConfigPanel` with LLM model dropdown + timeout inputs | ✅ | ✅ | ✅ | ✅ |
| F19 | `ProfilePanel` with Monaco editor | ✅ | ✅ | ✅ | ✅ |
| F20 | `MemoryPanel` with overview + Intelligence Hub link | ✅ | ✅ | ✅ | ✅ |
| F21 | Edge creation/deletion → config.json sync | ✅ | ✅ | ✅ | ✅ |
| F22 | Palette checkmark indicators for wired resources | ✅ | ✅ | ✅ | ✅ |
| F23 | Auto-layout (dagre) + `@dagrejs/dagre` dependency | ✅ | ✅ | ✅ | ✅ |

### Phase 3: Detail Panels & Advanced

| # | Requirement | Code Done | Git Commit | Testing | Deployed Local |
|---|------------|-----------|------------|---------|----------------|
| C2 | Per-agent filtering in `_tool_list_available_skills` | ✅ | ✅ | ✅ | ✅ |
| C3 | Per-agent filtering in `_tool_list_mcp_tools` | ✅ | ✅ | ✅ | ✅ |
| C4 | Per-agent validation in `ToolSetRegistry.activate` | ✅ | ✅ | ✅ | ✅ |
| C5 | Per-agent validation in `_tool_delegate_to_agent` | ✅ | ✅ | ✅ | ✅ |
| C15 | Fix version sort: string → numeric | ✅ | ✅ | ✅ | ✅ |
| F24 | `SkillDetailPanel` (SKILL.md preview in inspector) | ✅ | ✅ | ✅ | ✅ |
| F25 | `MCPDetailPanel` (server details + tools list) | ✅ | ✅ | ✅ | ✅ |
| F26 | `SystemAgentNode` (read-only, dimmed) | ✅ | ✅ | ✅ | ✅ |
| F27 | `ExternalAgentNode` (A2A with protocol config) | ⬜ | ⬜ | ⬜ | ⬜ |
| F28 | `A2ALinkEdge` component | ⬜ | ⬜ | ⬜ | ⬜ |
| F29 | `A2ADetailPanel` (A2A config editor) | ⬜ | ⬜ | ⬜ | ⬜ |
| F30 | Undo/redo (full stack implementation) | ⬜ | ⬜ | ⬜ | ⬜ |
| F31 | Autosave with 2s debounce | ✅ | ✅ | ✅ | ✅ |
| F32 | Canvas export/import JSON | ✅ | ✅ | ✅ | ✅ |

### E2E Tests

| # | Test Scenario | Code Done | Git Commit | Testing | Deployed Local |
|---|--------------|-----------|------------|---------|----------------|
| E1 | Canvas loads with orchestrator always present | ✅ | ✅ | ✅ | ✅ |
| E2 | Add agent via (+) → node + runtime files created | ✅ | ✅ | ✅ | ✅ |
| E3 | Wire skill to agent via edge drawing | ⬜ | ⬜ | ⬜ | ⬜ |
| E4 | Wire skill via wiring panel checkbox | ✅ | ✅ | ✅ | ✅ |
| E5 | Wire skill via palette drag-and-drop | ⬜ | ⬜ | ⬜ | ⬜ |
| E6 | GET /agents/{id}/wiring resolved wiring summary | ✅ | ✅ | ✅ | ✅ |
| E7 | DELETE agent with cleanup_runtime removes MinIO files | ✅ | ✅ | ✅ | ✅ |
| E8 | PropertyInspector 4 tabs render on node click | ✅ | ✅ | ✅ | ✅ |
| E9 | Config panel LLM model change persists | ✅ | ✅ | ✅ | ✅ |
| E10 | Auto-layout button present (dagre) | ✅ | ✅ | ✅ | ✅ |
| E11 | Orchestrator cannot be deleted | ✅ | ✅ | ✅ | ✅ |
| E12 | Export/Import toolbar buttons present (F32) | ✅ | ✅ | ✅ | ✅ |
| E13 | Palette shows checkmarks for wired resources | ✅ | ✅ | ✅ | ✅ |

### Document Updates

| # | Document | Section | Code Done | Git Commit | Testing | Deployed Local |
|---|----------|---------|-----------|------------|---------|----------------|
| D1 | `graphclaw-requirements.md` | §23 — Add Surface 4: Agent Canvas | ⬜ | ⬜ | N/A | N/A |
| D2 | `agent-subagent-design-requirements.md` | New §13 — Per-agent capability scoping | ⬜ | ⬜ | N/A | N/A |
| D3 | `agent-subagent-design-requirements.md` | §3.3 — Canvas creation flow | ⬜ | ⬜ | N/A | N/A |
| D4 | `agent-subagent-design-requirements.md` | §10.4 — Canvas layout persistence | ⬜ | ⬜ | N/A | N/A |
| D5 | `architecture.md` | New section — Canvas Integration Layer | ⬜ | ⬜ | N/A | N/A |
| D6 | `cockpit-backend-api-prd.md` | §04 — Update canvas endpoints | ⬜ | ⬜ | N/A | N/A |
| D7 | `graphclaw-cockpit/build-plan.md` | Wave 8 — Rewrite for agent canvas | ⬜ | ⬜ | N/A | N/A |
