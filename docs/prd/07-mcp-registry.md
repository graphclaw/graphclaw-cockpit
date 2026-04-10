# 07 — MCP Registry

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

---

## 7.1 MCP Server List

The MCP Registry section shows each user's registered MCP servers (`MCPServerNode` records):

| Column | Description |
|--------|-------------|
| Name | Human-readable name (e.g., "Google Calendar") |
| Transport | `STDIO` / `SSE` / `HTTP` |
| Endpoint URL | URL for SSE/HTTP transports |
| Trust Tier | Badge: 🟢 AUTO / 🟡 GATED / 🔴 BLOCKED |
| Scope | Declared capability scopes |
| Enabled | On/Off toggle |
| Last Used | Last tool call timestamp |
| Registered | Registration timestamp |

**Actions:**
- **Edit** — update endpoint, trust tier, enabled flag
- **Delete** — deregister server
- **View Tools** — list available tools on this server
- **Test Connection** — verify server is reachable

**Endpoint:** `GET /app/v1/mcp-servers`

---

## 7.2 Pre-Built MCP Adapter Templates

The platform ships pre-built configuration templates. Users activate from the settings panel — no CLI required:

| Service | Transport | Default Trust | Key Capabilities |
|---------|-----------|---------------|-----------------|
| Google Calendar | SSE | AUTO (read) / GATED (write) | Read events, create events, check free/busy |
| GitHub | HTTP | AUTO (read) / GATED (write) | List issues/PRs, read file, create issue, add comment |
| Slack | HTTP | AUTO (read) / GATED (write) | Read channel messages, post message, list channels |
| Jira | HTTP | AUTO (read) / GATED (write) | List issues, update status, add comment |
| Notion | HTTP | AUTO (read) / GATED (write) | Read pages/databases, create page |
| Linear | HTTP | AUTO (read) / GATED (write) | List issues, update status |
| Google Drive | HTTP | AUTO (read) / GATED (write) | List files, read file content, create doc |

**Activation flow:**
1. User selects a template from the adapter gallery
2. UI pre-fills transport, endpoint, and scope configuration
3. User provides credentials (OAuth token or API key) → stored in Secrets Manager
4. Server registered as `MCPServerNode` with template defaults

---

## 7.3 Official Registry Search

Integrated search against the official MCP registry at `registry.modelcontextprotocol.io`:

- Search by name or capability
- View server metadata: transport type, declared scopes, publisher, version
- **One-click install**: user provides endpoint URL + credentials → UI calls `POST /app/v1/mcp-servers`

**Endpoint:** `GET /app/v1/mcp-servers/search?q=...`

---

## 7.4 Custom MCP Server Registration

Form for registering user-built or third-party MCP servers:

| Field | Type | Description |
|-------|------|-------------|
| Name | Text | Human-readable name |
| Transport | Dropdown | STDIO / SSE / HTTP |
| Endpoint URL | URL input | For SSE/HTTP transports |
| Command | Text | For STDIO transport (executable path + args) |
| Auth Type | Dropdown | None / API Key / OAuth Token |
| Credential | Password input | Stored in Secrets Manager, never shown after |
| Initial Trust Tier | Radio | AUTO / GATED / BLOCKED |
| Scope Description | Textarea | What capabilities this server provides |

**Endpoint:** `POST /app/v1/mcp-servers`

---

## 7.5 Trust Tier Configuration

Per-server trust controls, changeable at any time:

| Tier | Badge | Behavior |
|------|-------|----------|
| **AUTO** | 🟢 | Tools called without user confirmation. For trusted, read-only operations. |
| **GATED** | 🟡 | Agent proposes the tool call, waits for user approval before executing. For write operations. |
| **BLOCKED** | 🔴 | All tool calls rejected. Server suspended without removing configuration. |

- Trust tier editable via `PATCH /app/v1/mcp-servers/{server_id}`
- Any tier can be revoked instantly (Design Principle 60)
- Admin may restrict which tiers users can assign (e.g., force GATED minimum for write-capable servers)

---

## 7.6 GATED Approval Workflow (In-App)

When a GATED MCP server tool call is pending:

1. **Approval Card** appears in the cockpit (notification panel and/or approval queue):
   - Server name and icon
   - Tool name being invoked
   - Proposed input parameters (JSON preview)
   - "Approve" / "Reject" buttons
2. Approval resolves the pending `APPROVAL` task node in the graph
3. If user hasn't responded within the session, the agent notifies via configured channel (WhatsApp / Telegram / Email)

**Endpoints:**
- `GET /app/v1/mcp-approvals` — list pending GATED approval tasks
- `POST /app/v1/approvals/{task_id}/approve` — approve
- `POST /app/v1/approvals/{task_id}/deny` — reject

---

## 7.7 MCP Scope Visualization

For each registered server, the UI shows:

- **Declared scopes** as tags (e.g., `read_events`, `create_event`, `get_free_busy`)
- **Read vs Write indicator**: read scopes in green, write scopes in amber
- **Last tool call**: tool name, timestamp, trust tier used, success/failure
- **Usage stats**: total calls, success rate, average latency

---

## 7.8 MCP Server Tool Listing

Drill into any server to see its available tools:

| Column | Description |
|--------|-------------|
| Tool Name | Function name |
| Description | What the tool does |
| Parameters | JSON Schema of input parameters |
| Trust Tier | Inherited from server, can be overridden per-tool (future) |

**Endpoint:** `GET /app/v1/mcp-servers/{server_id}/tools`

---

## 7.9 Admin MCP Constraints

If org admin has configured MCP allowlist (PRD §09):
- Only whitelisted MCP server types can be registered by users
- "Register Custom Server" may be disabled
- Template gallery shows only admin-approved adapters
- Trust tier minimum may be enforced (e.g., all write tools must be GATED)
