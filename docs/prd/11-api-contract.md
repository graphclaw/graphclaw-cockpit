# 11 — API Contract

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

> **2026-05-02 design extension.** New API surfaces: `GET /conversations/{counterparty_id}` (FR-STORE-001), `POST /agent-channels` and CRUD (FR-IN-003), `/admin/lifecycle/{cancel-purge,confirm-purge,right-to-erasure,legal-hold}` (FR-DEL-004..007), `/admin/cross-tenant/rebuild` (FR-AE-001), `/admin/triggers/follow_up` (FR-SCHED-001), policies REST (`/agents/{agent_id}/policies/{name}` GET/PUT — FR-POL-001), `/identity/resolve_user` (FR-ID-002), `/identity/merge_resource` (FR-ID-004). References:
> - [graphclaw/docs/architecture/14-agent-triad.md](../../../graphclaw/docs/architecture/14-agent-triad.md)
> - [graphclaw/docs/architecture/15-user-identity-and-onboarding.md](../../../graphclaw/docs/architecture/15-user-identity-and-onboarding.md)
> - [graphclaw/docs/architecture/16-cross-user-conversations.md](../../../graphclaw/docs/architecture/16-cross-user-conversations.md)
> - [graphclaw/docs/architecture/17-cross-tenant-task-projection.md](../../../graphclaw/docs/architecture/17-cross-tenant-task-projection.md)
> - [graphclaw/docs/requirements/agent-triad-and-comms-substrate.md](../../../graphclaw/docs/requirements/agent-triad-and-comms-substrate.md) (full FR list)

---

## 11.1 Conventions

- **Base URL**: `/app/v1/` for all cockpit endpoints
- **Auth**: All endpoints require `Authorization: Bearer <JWT>` (RS256, 15-min expiry) unless stated otherwise
- **Format**: JSON request/response bodies. XML only for guardrail rules (`PUT /admin/guardrails`)
- **Pagination**: Cursor-based via `?cursor=...&limit=N` (default 50, max 200)
- **Errors**: RFC 7807 Problem Details (`{ "type", "title", "status", "detail", "instance" }`)
- **Rate limiting**: Per-user, returns `429 Too Many Requests` with `Retry-After` header

---

## 11.2 Graph API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 1 | GET | `/app/v1/graph/goals` | query: `org_id`, `state`, `cursor`, `limit` | `{ goals: GoalNode[], next_cursor }` | User | **NEW** |
| 2 | GET | `/app/v1/graph/goals/{goal_id}/tree` | query: `depth` | `{ nodes: (TaskNode\|GoalNode\|ConstraintNode\|ResourceNode)[], edges: GraphEdge[] }` | User | **NEW** |
| 3 | GET | `/app/v1/graph/tasks` | query: `state`, `assignee_id`, `org_id`, `goal_id`, `type`, `sort`, `cursor`, `limit` | `{ tasks: TaskNode[], next_cursor }` | User | **NEW** |
| 4 | GET | `/app/v1/graph/tasks/{task_id}` | — | `{ task: TaskNode, score: ScoreExplanation, edges: GraphEdge[] }` | User | **NEW** |
| 5 | POST | `/app/v1/graph/tasks` | `CreateTaskRequest` (type, title, description, assignee_id, deadline, parent_goal_id, priority) | `TaskNode` | User | **NEW** |
| 6 | PATCH | `/app/v1/graph/tasks/{task_id}` | `UpdateTaskRequest` (partial: state, description, deadline, assignee_id, priority, agent_override) | `TaskNode` | User | **NEW** |
| 7 | DELETE | `/app/v1/graph/tasks/{task_id}` | — | `204 No Content` | User | **NEW** |
| 8 | GET | `/app/v1/graph/resources` | query: `org_id`, `cursor`, `limit` | `{ resources: ResourceNode[], next_cursor }` | User | **NEW** |
| 9 | GET | `/app/v1/graph/edges` | query: `edge_type`, `source_id`, `target_id`, `cursor`, `limit` | `{ edges: GraphEdge[], next_cursor }` | User | **NEW** |
| 10 | POST | `/app/v1/graph/edges` | `CreateEdgeRequest` (source_id, target_id, edge_type, metadata) | `GraphEdge` | User | **NEW** |
| 11 | DELETE | `/app/v1/graph/edges/{edge_id}` | — | `204 No Content` | User | **NEW** |

---

## 11.3 Settings API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 12 | GET | `/app/v1/settings` | — | Full user settings object | User | Stub |
| 13 | PATCH | `/app/v1/settings` | Partial settings update | Updated settings | User | Stub |
| 14 | GET | `/app/v1/settings/profile` | — | `UserNode` (includes behavioral_model) | User | **NEW** |
| 15 | PATCH | `/app/v1/settings/profile` | Partial profile update | Updated `UserNode` | User | **NEW** |
| 16 | GET | `/app/v1/settings/channels` | — | Channel list with status | User | Stub |
| 17 | POST | `/app/v1/settings/channels/{channel}/activate` | Channel-specific params | `{ status, activation_ref }` | User | **NEW** |
| 18 | DELETE | `/app/v1/settings/channels/{channel}` | — | `204 No Content` | User | **NEW** |
| 19 | GET | `/app/v1/settings/scoring-weights` | — | `{ w1..w7: float }` | User | **NEW** |
| 20 | PATCH | `/app/v1/settings/scoring-weights` | `{ w1..w7: float }` (must sum to 1.0) | Updated weights | User | **NEW** |
| 21 | GET | `/app/v1/settings/organizations` | — | `OrganizationNode[]` | User | **NEW** |
| 22 | POST | `/app/v1/settings/organizations` | `CreateOrgRequest` | `OrganizationNode` | User | **NEW** |
| 23 | PATCH | `/app/v1/settings/organizations/{org_id}` | Partial org settings | Updated `OrganizationNode` | Owner/Admin | **NEW** |
| 24 | POST | `/app/v1/settings/llm-keys` | `{ provider, api_key }` | `{ reference_id }` | User | **NEW** |
| 25 | DELETE | `/app/v1/settings/llm-keys/{provider}` | — | `204 No Content` | User | **NEW** |

---

## 11.4 Agent Monitoring API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 26 | GET | `/app/v1/agent/status` | — | `{ state, last_invocation, active_session_id, uptime }` | User | **NEW** |
| 27 | GET | `/app/v1/agent/action-queue` | query: `limit` | `{ actions: RankedAction[] }` | User | **NEW** |
| 28 | GET | `/app/v1/agent/briefing` | query: `date` | `{ briefing_text, generated_at, task_count, channel }` | User | **NEW** |
| 29 | GET | `/app/v1/agent/triggers/schedule` | query: `limit` | `{ triggers: ScheduledTrigger[] }` | User | **NEW** |
| 30 | GET | `/app/v1/agent/triggers/{trigger_id}` | — | `ScheduledTrigger` detail | User | **NEW** |
| 31 | POST | `/app/v1/agent/triggers/{trigger_id}/fire` | — | `{ result, fired_at }` | User | **NEW** |

### 11.4a Sub-Agent Pool API (Phase 5)

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 31a | GET | `/app/v1/agents/pool/status` | — | `{ active_runners, total_runners, queue_depth, max_concurrent }` | User | **NEW** |
| 31b | GET | `/app/v1/agents/pool/runners` | — | `{ runners: RunnerStatus[] }` where RunnerStatus = `{ runner_id, state, agent_id, task_id, session_id, started_at, last_heartbeat, elapsed_ms }` | User | **NEW** |
| 31c | GET | `/app/v1/agents/delegations` | query: `session_id?`, `batch_id?`, `cursor`, `limit` | `{ delegations: DelegationEntry[], next_cursor }` | User | **NEW** |
| 31d | GET | `/app/v1/agents/dispatch-plan/{session_id}` | — | `{ tiers: DispatchTier[], completed_tiers: int, total_tiers: int }` where `DispatchTier = { batch_id, task_ids, agent_ids, status, started_at, completed_at }` | User | **NEW** |
| 31e | GET | `/app/v1/agents/{agent_id}/heartbeats` | query: `since`, `limit` | `{ heartbeats: HeartbeatEntry[], health: HEALTHY\|STALE\|BLOCKED }` | User | **NEW** |
| 31f | GET | `/app/v1/agents/config` | — | `{ max_concurrent_agents, subagent_worker_pool_size, heartbeat_interval_s, heartbeat_timeout_s }` | Admin | **NEW** |
| 31g | PATCH | `/app/v1/agents/config` | `{ max_concurrent_agents?, subagent_worker_pool_size? }` | Updated config | Admin | **NEW** |

---

## 11.5 Scoring API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 32 | GET | `/app/v1/scoring/tasks/{task_id}` | — | `ScoreExplanation` (7-factor breakdown + NL summary) | User | **NEW** |
| 33 | GET | `/app/v1/scoring/tasks/{task_id}/history` | query: `cursor`, `limit` | `{ scores: ScoreExplanation[], next_cursor }` | User | **NEW** |
| 34 | POST | `/app/v1/scoring/simulate` | `{ task_id, modified_weights?, modified_factors? }` | Hypothetical `ScoreExplanation` | User | **NEW** |

---

## 11.6 State Machine API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 35 | GET | `/app/v1/tasks/{task_id}/state-history` | query: `cursor`, `limit` | `{ entries: StateHistoryEntry[], next_cursor }` | User | **NEW** |
| 36 | GET | `/app/v1/tasks/{task_id}/valid-transitions` | — | `{ valid_states: TaskState[] }` | User | **NEW** |
| 37 | POST | `/app/v1/tasks/{task_id}/transition` | `{ target_state, reason? }` | Updated `TaskNode` | User | **NEW** |

---

## 11.7 Skill API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 38 | GET | `/app/v1/skills` | query: `source`, `trigger_type`, `cursor`, `limit` | `{ skills: SkillEntry[], next_cursor }` | User | Stub |
| 39 | POST | `/app/v1/skills/install` | `{ source_uri, version? }` | `SkillEntry` | User | Stub |
| 40 | DELETE | `/app/v1/skills/{skill_id}` | — | `204 No Content` | User | Stub |
| 41 | GET | `/app/v1/skills/search` | query: `q`, `tags`, `source` | `{ skills: SkillEntry[] }` | User | Stub |
| 42 | GET | `/app/v1/skills/sources` | — | `{ sources: SkillSource[] }` | User | Stub |
| 43 | POST | `/app/v1/skills/sources` | `{ uri, type }` | `SkillSource` | User | Stub |
| 44 | DELETE | `/app/v1/skills/sources/{source_uri}` | — | `204 No Content` | User | Stub |
| 45 | POST | `/app/v1/skills/{skill_id}/feedback` | `{ rating: up\|down, comment? }` | `201 Created` | User | **NEW** |
| 46 | GET | `/app/v1/skills/workers` | — | `{ workers: WorkerStatus[] }` | User | **NEW** |
| 47 | GET | `/app/v1/skills/{skill_id}/executions` | query: `cursor`, `limit` | `{ executions: SkillExecution[], next_cursor }` | User | **NEW** |
| 48 | POST | `/app/v1/skills/{skill_id}/test` | `{ sample_inputs }` | `{ output, duration_ms, tokens_used }` | User | **NEW** |

---

## 11.8 MCP API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 49 | GET | `/app/v1/mcp-servers` | query: `trust_tier`, `cursor`, `limit` | `{ servers: MCPServerNode[], next_cursor }` | User | Stub |
| 50 | POST | `/app/v1/mcp-servers` | `CreateMCPServerRequest` | `MCPServerNode` | User | Stub |
| 51 | PATCH | `/app/v1/mcp-servers/{server_id}` | Partial update (trust_tier, enabled, endpoint) | `MCPServerNode` | User | Stub |
| 52 | DELETE | `/app/v1/mcp-servers/{server_id}` | — | `204 No Content` | User | Stub |
| 53 | GET | `/app/v1/mcp-servers/search` | query: `q` | `{ servers: MCPServerNode[] }` | User | Stub |
| 54 | GET | `/app/v1/mcp-servers/{server_id}/tools` | — | `{ tools: MCPTool[] }` | User | **NEW** |
| 55 | GET | `/app/v1/mcp-approvals` | — | `{ approvals: ApprovalTask[] }` | User | **NEW** |

---

## 11.9 Approval API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 56 | GET | `/app/v1/approvals` | query: `status`, `cursor`, `limit` | `{ approvals: ApprovalTask[], next_cursor }` | User | Stub |
| 57 | POST | `/app/v1/approvals/{task_id}/approve` | `{ comment? }` | Updated task | User | Stub |
| 58 | POST | `/app/v1/approvals/{task_id}/deny` | `{ reason? }` | Updated task | User | Stub |

---

## 11.10 Events API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 59 | GET | `/app/v1/events` | SSE stream | Events: `task.state_changed`, `task.scored`, `briefing.ready`, `approval.pending`, `skill.completed` | User | **NEW** |

---

## 11.11 Chat API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 60 | POST | `/app/v1/chat/messages` | `{ content, session_id? }` | `{ message: AgentResponse }` | User | **NEW** |
| 61 | GET | `/app/v1/chat/messages` | query: `session_id`, `before_id`, `limit` | `{ messages: ChatMessage[], next_cursor }` | User | **NEW** |
| 62 | GET | `/app/v1/chat/messages/{message_id}` | — | `ChatMessage` | User | **NEW** |
| 63 | WS | `/app/v1/chat/ws` | WebSocket upgrade | Bidirectional: `{ type: "message", content }` ↔ `{ type: "response", content, cards?, actions? }` | User | **NEW** |

---

## 11.12 Secrets Management API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 64 | POST | `/app/v1/secrets/{category}/{key_name}` | `{ value }` (encrypted in transit) | `{ reference_id }` | User | **NEW** |
| 65 | DELETE | `/app/v1/secrets/{category}/{key_name}` | — | `204 No Content` | User | **NEW** |
| 66 | POST | `/app/v1/secrets/{category}/{key_name}/test` | — | `{ valid: bool, message? }` | User | **NEW** |
| 67 | GET | `/app/v1/secrets/status` | — | `{ secrets: SecretStatus[] }` (no values) | User | **NEW** |

---

## 11.13 Config JSON API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 68 | GET | `/app/v1/config` | — | Full user config JSON | User | **NEW** |
| 69 | PUT | `/app/v1/config` | Full config JSON | Validated + saved config | User | **NEW** |
| 70 | PATCH | `/app/v1/config/{section}` | Section-specific partial update | Updated section | User | **NEW** |

---

## 11.14 Canvas / Agent Design API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 71 | GET | `/app/v1/agents` | query: `cursor`, `limit` | `{ agents: AgentDefinition[], next_cursor }` | User | **NEW** |
| 72 | POST | `/app/v1/agents` | `CreateAgentRequest` (canvas export JSON) | `AgentDefinition` | User | **NEW** |
| 73 | GET | `/app/v1/agents/{agent_id}` | — | `AgentDefinition` + flow graph | User | **NEW** |
| 74 | PATCH | `/app/v1/agents/{agent_id}` | Partial update | `AgentDefinition` | User | **NEW** |
| 75 | DELETE | `/app/v1/agents/{agent_id}` | — | `204 No Content` | User | **NEW** |
| 76 | GET | `/app/v1/agents/{agent_id}/versions` | query: `cursor`, `limit` | `{ versions: AgentVersion[] }` | User | **NEW** |
| 77 | POST | `/app/v1/agents/{agent_id}/test` | `{ sample_inputs }` | `{ output, steps_executed, duration_ms }` | User | **NEW** |

---

## 11.15 Auth API

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 78 | GET | `/auth/login` | query: `provider`, `redirect_uri` | 302 redirect to IdP | None | Exists |
| 79 | GET | `/auth/callback` | query: `code`, `state` | Set cookies, redirect to app | None | Exists |
| 80 | POST | `/auth/refresh` | Cookie: refresh_token | New JWT cookie | Cookie | Exists |
| 81 | POST | `/auth/logout` | — | Clear cookies, revoke refresh | User | Exists |
| 82 | GET | `/auth/me` | — | `UserNode` (current user) | User | Exists |

---

## 11.16 Admin API

### Members

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 83 | GET | `/app/v1/admin/members` | query: `role`, `status`, `cursor`, `limit` | `{ members: OrgMember[], next_cursor }` | Admin | **NEW** |
| 84 | POST | `/app/v1/admin/members/invite` | `{ email, role }` | `{ invitation_id }` | Admin | **NEW** |
| 85 | PATCH | `/app/v1/admin/members/{user_id}` | `{ role?, status? }` | Updated member | Admin | **NEW** |
| 86 | DELETE | `/app/v1/admin/members/{user_id}` | — | `204 No Content` | Admin | **NEW** |

### Feature Gating

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 87 | GET | `/app/v1/admin/features` | — | `OrgFeaturePolicy` | Admin | **NEW** |
| 88 | PUT | `/app/v1/admin/features` | `OrgFeaturePolicy` | Updated policy | Admin | **NEW** |
| 89 | GET | `/app/v1/admin/features/channels` | — | `{ allowed: Channel[] }` | Admin | **NEW** |
| 90 | PUT | `/app/v1/admin/features/channels` | `{ allowed: Channel[] }` | Updated list | Admin | **NEW** |
| 91 | GET | `/app/v1/admin/features/mcp-allowlist` | — | `{ allowed: string[] }` | Admin | **NEW** |
| 92 | PUT | `/app/v1/admin/features/mcp-allowlist` | `{ allowed: string[] }` | Updated list | Admin | **NEW** |
| 93 | GET | `/app/v1/admin/features/marketplace` | — | `MarketplacePolicy` | Admin | **NEW** |
| 94 | PUT | `/app/v1/admin/features/marketplace` | `MarketplacePolicy` | Updated policy | Admin | **NEW** |

### LLM Configuration

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 95 | GET | `/app/v1/admin/llm/providers` | — | `{ providers: LLMProviderConfig[] }` | Admin | **NEW** |
| 96 | PUT | `/app/v1/admin/llm/providers` | `{ providers: LLMProviderConfig[] }` | Updated config | Admin | **NEW** |
| 97 | POST | `/app/v1/admin/llm/keys` | `{ provider, api_key }` | `{ reference_id }` | Admin | **NEW** |
| 98 | DELETE | `/app/v1/admin/llm/keys/{provider}` | — | `204 No Content` | Admin | **NEW** |
| 99 | GET | `/app/v1/admin/llm/budget` | — | `BudgetPolicy` | Admin | **NEW** |
| 100 | PUT | `/app/v1/admin/llm/budget` | `BudgetPolicy` | Updated policy | Admin | **NEW** |

### LLM-as-a-Judge

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 101 | GET | `/app/v1/admin/llm-judge/config` | — | `JudgeConfig` | Admin | **NEW** |
| 102 | PUT | `/app/v1/admin/llm-judge/config` | `JudgeConfig` | Updated config | Admin | **NEW** |
| 103 | GET | `/app/v1/admin/llm-judge/results` | query: `min_score`, `flagged`, `cursor`, `limit` | `{ evaluations: JudgeEvaluation[], next_cursor }` | Admin | **NEW** |
| 104 | GET | `/app/v1/admin/llm-judge/stats` | query: `period` | `{ avg_score, block_rate, flag_rate, distribution }` | Admin | **NEW** |

### Guardrails

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 105 | GET | `/app/v1/admin/guardrails` | — | `{ xml: string, version }` | Admin | **NEW** |
| 106 | PUT | `/app/v1/admin/guardrails` | `{ xml: string }` | `{ version }` | Admin | **NEW** |
| 107 | POST | `/app/v1/admin/guardrails/validate` | `{ xml: string }` | `{ valid: bool, errors?: string[] }` | Admin | **NEW** |
| 108 | POST | `/app/v1/admin/guardrails/test` | `{ xml: string, sample_request, sample_response }` | `{ rules_triggered: RuleResult[] }` | Admin | **NEW** |
| 109 | GET | `/app/v1/admin/guardrails/metrics` | query: `period` | `{ block_rate, scrub_rate, avg_latency_ms }` | Admin | **NEW** |

### SSO

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 110 | GET | `/app/v1/admin/sso` | — | `SSOConfig` (OIDC or SAML) | Admin | **NEW** |
| 111 | PUT | `/app/v1/admin/sso` | `SSOConfig` | Updated config | Admin | **NEW** |
| 112 | POST | `/app/v1/admin/sso/test` | — | `{ success: bool, error? }` | Admin | **NEW** |
| 113 | PATCH | `/app/v1/admin/sso/enforce` | `{ enforce: bool }` | Updated policy | Admin | **NEW** |

### Audit & Compliance

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 114 | GET | `/app/v1/admin/audit-log` | query: `user_id`, `action`, `from`, `to`, `cursor`, `limit` | `{ entries: AuditEntry[], next_cursor }` | Admin | **NEW** |

### Infrastructure

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 115 | GET | `/app/v1/admin/deployment/status` | — | Container statuses | Admin | **NEW** |
| 116 | GET | `/app/v1/admin/deployment/config` | — | Deployment config | Admin | **NEW** |
| 117 | GET | `/app/v1/admin/cluster/health` | — | Redis, DB, broker status | Admin | **NEW** |
| 118 | GET | `/app/v1/admin/backups` | — | Backup history + policy | Admin | **NEW** |
| 119 | GET | `/app/v1/admin/security/status` | — | WAF, TLS, JWT status | Admin | **NEW** |
| 120 | GET | `/app/v1/admin/alarms` | — | P1/P2/P3 alarm list | Admin | **NEW** |
| 121 | PATCH | `/app/v1/admin/alarms/{alarm_id}` | `{ enabled?, threshold? }` | Updated alarm | Admin | **NEW** |
| 122 | GET | `/app/v1/admin/migrations` | — | Migration list + pending count | Admin | **NEW** |
| 123 | POST | `/app/v1/admin/migrations/apply` | — | `{ applied: string[] }` | Admin | **NEW** |
| 124 | GET | `/app/v1/admin/connectors` | — | `{ connectors: Connector[] }` | Admin | **NEW** |
| 125 | POST | `/app/v1/admin/connectors` | `CreateConnectorRequest` | `Connector` | Admin | **NEW** |
| 126 | POST | `/app/v1/admin/connectors/{connector_id}/sync` | — | `{ sync_id, status }` | Admin | **NEW** |
| 127 | GET | `/app/v1/admin/connectors/{connector_id}/health` | — | `{ healthy: bool, last_sync, error? }` | Admin | **NEW** |

---

## 11.17 Gateway API (Existing)

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 128 | POST | `/api/v1/inbound` | `InboundMessage` | `202 Accepted` | API Key | Exists |
| 129 | POST | `/api/v1/outbound` | `OutboundMessage` | `{ message_id }` | Internal | Exists |
| 130 | POST | `/api/v1/trigger` | `TriggerRequest` | `{ trigger_id }` | Internal | Exists |
| 131 | GET | `/webhooks/whatsapp` | Verification challenge | Challenge response | None | Exists |
| 132 | POST | `/webhooks/whatsapp` | WhatsApp webhook payload | `200 OK` | Signature | Exists |
| 133 | GET | `/webhooks/telegram` | — | — | None | Exists |
| 134 | POST | `/webhooks/telegram` | Telegram update payload | `200 OK` | Token | Exists |

---

## 11.18 Compliance API (Existing)

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 135 | GET | `/app/v1/compliance/export` | query: `user_id` | GDPR data export (JSON) | User | Exists |
| 136 | POST | `/app/v1/compliance/erasure` | `{ user_id, reason }` | `{ request_id, status }` | User | Exists |
| 137 | GET | `/app/v1/compliance/erasure/{request_id}` | — | `{ status, progress }` | User | Exists |

---

## 11.19 A2A API (Existing)

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 138 | POST | `/api/v1/a2a/agents` | Agent card registration | `AgentCard` | API Key | Exists |
| 139 | GET | `/api/v1/a2a/agents` | — | `{ agents: AgentCard[] }` | API Key | Exists |
| 140 | DELETE | `/api/v1/a2a/agents` | — | `204 No Content` | API Key | Exists |
| 141 | POST | `/api/v1/task-update` | A2A task update | `202 Accepted` | API Key | Exists |

---

## 11.20 Health API (Existing)

| # | Method | Path | Request | Response | Auth | Status |
|---|--------|------|---------|----------|------|--------|
| 142 | GET | `/health` | — | `{ status: "ok" }` | None | Exists |
| 143 | GET | `/health/ready` | — | `{ ready: bool, checks: {...} }` | None | Exists |
| 144 | GET | `/ready` | — | `{ ready: bool }` | None | Exists |

---

## 11.21 Summary

| Category | Existing | New | Total |
|----------|----------|-----|-------|
| Graph | 0 | 11 | 11 |
| Settings | 3 | 11 | 14 |
| Agent Monitoring | 0 | 6 | 6 |
| Scoring | 0 | 3 | 3 |
| State Machine | 0 | 3 | 3 |
| Skills | 7 | 4 | 11 |
| MCP | 5 | 2 | 7 |
| Approvals | 3 | 0 | 3 |
| Events | 0 | 1 | 1 |
| Chat | 0 | 4 | 4 |
| Secrets | 0 | 4 | 4 |
| Config | 0 | 3 | 3 |
| Canvas/Agents | 0 | 7 | 7 |
| Auth | 5 | 0 | 5 |
| Admin | 0 | 45 | 45 |
| Gateway | 7 | 0 | 7 |
| Compliance | 3 | 0 | 3 |
| A2A | 4 | 0 | 4 |
| Health | 3 | 0 | 3 |
| **Total** | **40** | **104** | **144** |
