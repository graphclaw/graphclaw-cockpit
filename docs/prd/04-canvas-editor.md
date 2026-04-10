# 04 — Canvas Editor: Agent & Skill Design

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

---

## 4.1 Agent Canvas Editor (Visual Drag-and-Drop)

A node-based visual workflow builder — similar to Langflow, Flowise, or n8n — for designing custom agent execution flows.

### Canvas Node Types

| Node Type | Icon | Purpose | Configuration |
|-----------|------|---------|---------------|
| **LLM Call** | 🧠 | Send prompt to an LLM | Provider, model, system prompt, temperature, max_tokens |
| **Tool Call (MCP)** | 🔧 | Invoke an MCP server tool | Server selection, tool name, input mapping |
| **Condition / Branch** | ◇ | If/else logic on output | Condition expression, true/false output ports |
| **Input** | → | Agent entry point | Input schema definition (what data flows in) |
| **Output** | ← | Agent result | Output mapping (what the agent returns) |
| **Loop** | ↻ | Iterate over a collection | Collection source, loop body, break condition |
| **Human Approval Gate** | 🛡 | Pause for user approval | Approval prompt, timeout, fallback action |
| **Sub-Agent** | 📦 | Call another agent definition | Agent ID selection, input/output mapping |
| **Transform** | ⚙ | Data transformation | JavaScript/Python expression for reshaping data |

### Canvas Interactions

| Gesture | Action |
|---------|--------|
| Drag node from palette | Add node to canvas |
| Drag between ports | Wire two nodes together (output → input) |
| Click node | Open configuration panel (right sidebar) |
| Click wire | View/edit data mapping |
| Delete key | Remove selected node or wire |
| Ctrl+Z / Cmd+Z | Undo |
| Ctrl+S / Cmd+S | Save current version |

### Per-Node Configuration (LLM Call)

| Field | Type | Description |
|-------|------|-------------|
| Provider | Dropdown | From admin-approved LLM provider list |
| Model | Dropdown | From admin-approved model list for selected provider |
| System Prompt | Monaco Editor | System prompt with variable interpolation (`{{input.task_title}}`) |
| Temperature | Slider 0.0–2.0 | Default 0.0 |
| Max Tokens | Number | Default 4096 |
| Tools | Multi-select | Attach MCP tools (from registered servers) |
| Stop Sequences | Tags input | Optional stop sequences |

### Per-Node Configuration (MCP Tool Call)

| Field | Type | Description |
|-------|------|-------------|
| MCP Server | Dropdown | From user's registered MCPServerNode list |
| Tool | Dropdown | Populated from `GET /app/v1/mcp-servers/{id}/tools` |
| Input Mapping | Key-value editor | Map canvas data to tool input parameters |
| Trust Override | Dropdown | AUTO / GATED / BLOCKED (defaults to server trust tier) |

### Agent Metadata

| Field | Description |
|-------|-------------|
| Agent Name | Human-readable name |
| Description | What this agent does |
| Version | Semantic version (auto-incremented on save) |
| Trigger Conditions | When this agent activates (SCHEDULED, EVENT, INBOUND, ON_DEMAND) |
| Org Scope | Which organizations this agent is active in |
| Tags | Searchable labels |

### Test Mode

- **Dry-run button**: Execute the agent flow with sample inputs
- **Step-through mode**: Pause at each node, inspect intermediate output
- **Input panel**: Provide sample data matching the Input node schema
- **Output panel**: View the final agent result + intermediate values at each node
- **Cost preview**: Estimated token usage before execution

### Version Control

- Every save creates a new version (auto-increment)
- **Version list**: see all saved versions with timestamps
- **Compare**: side-by-side diff of two versions (visual diff on canvas)
- **Rollback**: restore a previous version as the current draft
- **Export/Import**: Download agent definition as JSON, upload to another org

### Storage

- Agent definitions stored as JSON in S3 at `agents/{user_id}/{agent_id}/v{version}.json`
- Metadata (name, description, version, created_at) stored as graph node (`AgentDefinitionNode`)
- Canvas layout (node positions, zoom level) embedded in the JSON

**Endpoints:**
- `GET /app/v1/agents` — list agent definitions
- `POST /app/v1/agents` — create agent definition
- `GET /app/v1/agents/{agent_id}` — get agent definition + flow graph JSON
- `PATCH /app/v1/agents/{agent_id}` — update agent definition
- `DELETE /app/v1/agents/{agent_id}` — delete agent definition
- `GET /app/v1/agents/{agent_id}/versions` — version list
- `POST /app/v1/agents/{agent_id}/test` — dry-run with sample inputs

---

## 4.2 Skill Form Editor (Structured Form)

For configuring skills (SKILL.md-based), a structured form editor provides a guided experience.

### Skill Metadata Section

| Field | Type | Mapped To |
|-------|------|-----------|
| Skill ID | Auto-generated | `SkillDefinition.name` |
| Name | Text input | `SkillDefinition.name` |
| Version | Semver | `SkillDefinition.version` |
| Description | Textarea | `SkillDefinition.description` |
| Tags | Tag input | `SkillDefinition.tags` |

### LLM Configuration Section

| Field | Type | Mapped To |
|-------|------|-----------|
| Provider | Dropdown (admin-approved only) | `SkillDefinition.model` prefix |
| Model | Dropdown (admin-approved only) | `SkillDefinition.model` |
| Max Tokens | Number slider | `SkillDefinition.max_tokens` |
| Temperature | Slider 0.0–2.0 | `SkillDefinition.temperature` |
| Timeout | Seconds input | `SkillDefinition.timeout_seconds` |

### System Prompt Editor

- **Monaco Editor** with syntax highlighting
- Variable interpolation preview: `{{task.title}}`, `{{task.description}}`, `{{context}}`
- Character count and estimated token count
- Template library: common prompt patterns as starting points

### Task Template Editor

- Monaco Editor for the task template (what gets sent as the user message)
- Variable placeholders from the triggering task's fields
- Preview: shows rendered template with sample task data

### Tool Selection

- Multi-select from registered MCP server tools
- Each selected tool shows: server name, tool name, trust tier, declared scopes
- Tools added to `SkillDefinition.tools` array

### Trigger & Scope Configuration

| Field | Options |
|-------|---------|
| Trigger Types | SCHEDULED, EVENT, INBOUND, ON_DEMAND (multi-select) |
| Output Type | DRAFT_FOR_REVIEW / AUTO_COMPLETE |
| Requires Approval | Toggle |
| Org Scope | Multi-select from user's orgs |

### Test Panel

- Input: provide sample task data (title, description, state, etc.)
- Execute: run the skill with the sample input via `POST /app/v1/skills/{skill_id}/test`
- Output: rendered result, token count, cost, execution time
- Feedback: rate the output (used for quality tracking)

### SKILL.md Preview

- Live preview of the generated SKILL.md file (YAML frontmatter + markdown body)
- Copy-to-clipboard for manual use
- The form generates the same SKILL.md format the backend parser expects

---

## 4.3 LLM Provider Constraints

Both the agent canvas and skill form editor enforce **admin-configured LLM policies**:

1. **Provider dropdown** shows only providers in the org's `admin/llm/providers` allowlist
2. **Model dropdown** shows only models in the allowlist for the selected provider
3. **Default model** pre-selected from admin's org default
4. If no admin config exists (single-user / local dev), all providers and models are available
5. Budget indicators show remaining token/cost budget if admin limits are configured

**Endpoint:** `GET /app/v1/admin/llm/providers` (read by canvas/form to populate dropdowns)
