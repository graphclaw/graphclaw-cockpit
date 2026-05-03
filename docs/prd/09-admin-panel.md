# 09 — Administration Panel

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

> **2026-05-02 design extension.** Admin gains: directory-policy controls (org-level `directory_visibility`), legal-hold panel (FR-DEL-007), pending-purge view + cancel (FR-DEL-004), Right-to-Erasure flow (FR-DEL-006), org archive with member-handling choices (FR-DEL-009), service-principal status indicator (admin/agent/migration). References:
> - [graphclaw/docs/architecture/19-data-lifecycle-and-deletion-policy.md](../../../graphclaw/docs/architecture/19-data-lifecycle-and-deletion-policy.md) (foundational)
> - [graphclaw/docs/architecture/13-tenancy-model.md](../../../graphclaw/docs/architecture/13-tenancy-model.md)
> - [graphclaw/docs/requirements/agent-triad-and-comms-substrate.md](../../../graphclaw/docs/requirements/agent-triad-and-comms-substrate.md) FR-DEL-004..009, FR-GRAPH-006

---

## 9.1 Access Control

- Only users with `OWNER` or `ADMIN` role on an `OrganizationNode` can access the admin panel
- Admin panel is scoped to the current org — admins see settings only for their org
- Non-admin users do not see the admin navigation item
- All admin endpoints require Bearer JWT + org role verification

---

## 9.2 User Management

| Action | Description | Endpoint |
|--------|-------------|----------|
| **List Members** | View all org members with role, status, joined_at | `GET /app/v1/admin/members` |
| **Invite** | Send invitation (email or link) with assigned role | `POST /app/v1/admin/members/invite` |
| **Change Role** | Promote/demote: OWNER ↔ ADMIN ↔ MEMBER ↔ GUEST | `PATCH /app/v1/admin/members/{user_id}` |
| **Suspend** | Temporarily disable access (status → SUSPENDED) | `PATCH /app/v1/admin/members/{user_id}` |
| **Reactivate** | Restore suspended member (status → ACTIVE) | `PATCH /app/v1/admin/members/{user_id}` |
| **Remove** | Remove from org (status → REMOVED) | `DELETE /app/v1/admin/members/{user_id}` |
| **Activity Summary** | View member's task count, last active, response rate | Inline on member list |

### Role Permissions

| Capability | OWNER | ADMIN | MEMBER | GUEST |
|-----------|-------|-------|--------|-------|
| Admin panel access | ✅ | ✅ | ❌ | ❌ |
| Manage members | ✅ | ✅ | ❌ | ❌ |
| Configure features/guardrails | ✅ | ✅ | ❌ | ❌ |
| Configure LLM/SSO | ✅ | ✅ | ❌ | ❌ |
| Create/edit tasks | ✅ | ✅ | ✅ | Read only |
| View graph | ✅ | ✅ | ✅ | ✅ (scoped) |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |
| Delete org | ✅ | ❌ | ❌ | ❌ |

---

## 9.3 Feature Gating

Org admins control which features are available to users — similar to GitHub Copilot Enterprise admin controls.

### Feature Policy Configuration

| Feature Gate | Description | Default |
|-------------|-------------|---------|
| **MCP Connectors** | Whitelist of allowed MCP server types users can register | All allowed |
| **A2A Integrations** | Which external agent APIs users can connect | All allowed |
| **Marketplace Access** | Enable/disable remote skill marketplace | Enabled |
| **Marketplace Sources** | Pin specific allowed skill sources (GitHub repos) | All sources |
| **Channel Allowlist** | Which channels users can activate (Web always on) | All channels |
| **Canvas Editor** | Enable/disable agent/skill design canvas | Enabled |
| **API Access** | Enable/disable external API integrations | Enabled |
| **User BYOK** | Allow users to bring their own LLM API keys | Enabled |

### UI Behavior

- Features **not** in the allowlist are **hidden** from the user interface (not just disabled)
- If a feature is disabled after a user has already configured it, existing configuration is preserved but inactive
- Admin sees which features are active and how many users are using each

**Endpoints:**
- `GET /app/v1/admin/features` — get org feature policy
- `PUT /app/v1/admin/features` — update org feature policy
- `GET /app/v1/admin/features/channels` — get allowed channels
- `PUT /app/v1/admin/features/channels` — set allowed channels
- `GET /app/v1/admin/features/mcp-allowlist` — get MCP allowlist
- `PUT /app/v1/admin/features/mcp-allowlist` — set MCP allowlist
- `GET /app/v1/admin/features/marketplace` — get marketplace policy
- `PUT /app/v1/admin/features/marketplace` — set marketplace policy

---

## 9.4 LLM Configuration (Admin-Controlled)

Admins control which LLM providers and models are available to the entire org.

### Provider & Model Allowlist

| Setting | Description |
|---------|-------------|
| **Allowed Providers** | Multi-select: Anthropic, OpenAI, Google, Custom (LiteLLM) |
| **Model Allowlist** | Per-provider: specific model IDs allowed (e.g., `claude-sonnet-4-20250514`, `gpt-4o`) |
| **Default Model** | The model pre-selected for new skills and agent nodes |
| **User BYOK** | Toggle: allow users to supply their own API keys, or use org keys only |

### Org-Level API Keys

- Admin submits org-level LLM API keys via masked form → stored in Secrets Manager
- All users in the org inherit these keys (unless user BYOK is enabled and user has own key)
- Key rotation: submit new key → old overwritten in SM → containers pick up within 15-min cache

### Budget Limits

| Setting | Description |
|---------|-------------|
| Max Tokens Per User Per Day | Hard limit on daily token usage per user |
| Max Cost Per User Per Day (USD) | Hard limit on daily LLM cost per user |
| Alert at % | Notify admin when user reaches N% of budget |

Budget tracking uses `LLMResponse.tokens_used` and `LLMResponse.cost_usd` from skill execution.

**Endpoints:**
- `GET /app/v1/admin/llm/providers` — list allowed providers + models
- `PUT /app/v1/admin/llm/providers` — set provider/model allowlist
- `POST /app/v1/admin/llm/keys` — store org LLM API key in Secrets Manager
- `DELETE /app/v1/admin/llm/keys/{provider}` — remove org LLM key
- `GET /app/v1/admin/llm/budget` — get budget limits
- `PUT /app/v1/admin/llm/budget` — set budget limits

---

## 9.5 LLM-as-a-Judge

Admin configures an evaluator LLM to review and score agent LLM request/response pairs.

### Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| **Judge Model** | LLM to use for evaluation (can differ from execution model) | claude-opus-4-20250514 |
| **Evaluation Criteria** | Rubric dimensions: relevance, safety, accuracy, policy compliance | All enabled |
| **Sampling Rate** | Percentage of LLM calls to evaluate (cost control) | 10% |
| **Score Threshold** | Minimum acceptable score (0.0–1.0) | 0.7 |
| **Action on Low Score** | LOG_ONLY / FLAG_FOR_REVIEW / BLOCK_RESPONSE | LOG_ONLY |

### Action Modes

| Mode | Behavior |
|------|----------|
| `LOG_ONLY` | Low-scoring responses logged for review but delivered to user normally |
| `FLAG_FOR_REVIEW` | Response delivered with a flag; appears in admin review queue |
| `BLOCK_RESPONSE` | Response blocked; user receives a fallback message. Adds synchronous latency. |

### Results Dashboard

- **Score distribution**: Histogram of judge scores over time
- **Flagged responses**: List of responses below threshold with judge reasoning
- **Trend line**: Average score over last 30 days
- **Per-skill breakdown**: Which skills produce the lowest-quality outputs
- **Drill-down**: Click any evaluation → see original request, response, judge score, judge reasoning

### Integration Architecture

The judge hooks into `LLMClient.complete()` as post-response middleware:

```
Request → LLMClient.complete() → Response
                                    ↓
                          [Sampling: N% of calls]
                                    ↓
                          JudgeLLMClient.evaluate(request, response)
                                    ↓
                          Store: (request, response, score, reasoning)
                                    ↓
                          If score < threshold → apply action
```

Recommended: Judge evaluation runs async (background) for LOG_ONLY and FLAG_FOR_REVIEW modes. Only BLOCK_RESPONSE adds synchronous latency.

**Endpoints:**
- `GET /app/v1/admin/llm-judge/config` — get judge config
- `PUT /app/v1/admin/llm-judge/config` — set judge config
- `GET /app/v1/admin/llm-judge/results` — paginated evaluations
- `GET /app/v1/admin/llm-judge/stats` — aggregate statistics

---

## 9.6 AI Gateway Guardrails (XML Rule Engine)

Quantitative guardrails applied at LLM request/response boundaries. Inspired by Databricks AI Gateway, AWS Bedrock Guardrails, and Anthropic usage policies.

### Request-Side Rules (Before LLM SDK Call)

| Rule Type | Description |
|-----------|-------------|
| **Token Limit** | Reject if `max_tokens` exceeds configured limit |
| **PII Detection** | Scan prompt for PII patterns (email, phone, SSN) → scrub or block |
| **Prompt Injection** | Detect known attack patterns (jailbreak, role-override) → block |
| **Topic Blocking** | Configurable deny-list of topics/keywords → block |
| **Rate Limiting** | Per-user: max requests/minute, max tokens/hour |
| **Content Classification** | Reject requests classified as harmful or off-topic |

### Response-Side Rules (After LLM SDK Response)

| Rule Type | Description |
|-----------|-------------|
| **Output Token Limit** | Truncate or flag responses exceeding limit |
| **PII in Response** | Scan output for PII → scrub before delivery |
| **Toxic Content** | Filter toxic/harmful language |
| **Format Validation** | Validate expected JSON schema or markdown structure |
| **Cost Anomaly** | Flag responses significantly above average cost |
| **Hallucination Detection** | Confidence threshold check (if model provides confidence) |

### XML Rule Engine Configuration

Rules defined in XML format — human-readable and version-controlled:

```xml
<guardrails version="1.0" org_id="ORG-xxx">
  <rule name="max-tokens" scope="REQUEST" priority="1"
        description="Limit max tokens per request">
    <condition>request.max_tokens > 8192</condition>
    <action type="BLOCK" message="Max token limit exceeded (8192)" />
  </rule>

  <rule name="pii-scrub-request" scope="REQUEST" priority="2"
        description="Remove PII from prompts before sending">
    <condition>contains_pii(request.messages)</condition>
    <action type="SCRUB" pattern="email|phone|ssn" />
  </rule>

  <rule name="prompt-injection-detect" scope="REQUEST" priority="3"
        description="Block known prompt injection patterns">
    <condition>matches_injection_pattern(request.messages)</condition>
    <action type="BLOCK" message="Potential prompt injection detected" />
  </rule>

  <rule name="rate-limit" scope="REQUEST" priority="4"
        description="Per-user rate limiting">
    <condition>user.requests_per_minute > 30</condition>
    <action type="BLOCK" message="Rate limit exceeded" />
  </rule>

  <rule name="pii-scrub-response" scope="RESPONSE" priority="10"
        description="Remove PII from LLM output">
    <condition>contains_pii(response.content)</condition>
    <action type="SCRUB" pattern="email|phone|ssn" />
  </rule>

  <rule name="toxic-filter" scope="RESPONSE" priority="11"
        description="Filter toxic content from responses">
    <condition>is_toxic(response.content)</condition>
    <action type="BLOCK" message="Response contained inappropriate content" />
  </rule>

  <rule name="cost-anomaly" scope="RESPONSE" priority="20"
        description="Flag unusually expensive responses">
    <condition>response.cost_usd > 0.50</condition>
    <action type="FLAG" message="High-cost response detected" />
  </rule>
</guardrails>
```

### Evaluation Modes

- **First-match**: Stop at the first matching rule
- **All-match**: Evaluate all rules and apply all matching actions

### Admin UI

- **Form builder**: Visual rule editor for common patterns (dropdowns for scope, condition templates, action selection)
- **Raw XML editor**: Monaco editor with XML syntax highlighting for advanced configuration
- **Validation**: `POST /app/v1/admin/guardrails/validate` — check XML is well-formed and conditions are valid
- **Dry-run**: `POST /app/v1/admin/guardrails/test` — test rules against a sample request/response pair
- **Metrics**: Block rate, scrub rate, average latency overhead, rules triggered over time

### Storage

- Rules stored in S3 at `config/{org_id}/guardrails.xml`
- Loaded at LLM call time (cached with 5-min TTL)
- Version history maintained (previous versions kept in S3)

### Backend Architecture

Composition pattern: `GuardedLLMClient` wraps any `LLMClient` + `GuardrailEngine`:

```
GuardedLLMClient
  ├── llm_client: LLMClient (Anthropic / OpenAI / LiteLLM)
  └── guardrail_engine: GuardrailEngine
        ├── evaluate_request(messages, model, max_tokens) → Pass / Block / Scrub
        └── evaluate_response(response) → Pass / Block / Scrub / Flag
```

**Endpoints:**
- `GET /app/v1/admin/guardrails` — get current XML rules
- `PUT /app/v1/admin/guardrails` — update rules
- `POST /app/v1/admin/guardrails/validate` — validate XML
- `POST /app/v1/admin/guardrails/test` — dry-run against sample
- `GET /app/v1/admin/guardrails/metrics` — guardrail performance metrics

---

## 9.7 SSO / Identity Provider Configuration

Admin configures SSO for the organization, extending the current OAuth 2.0 support.

### Supported Protocols

| Protocol | Status | IdPs |
|----------|--------|------|
| **OAuth 2.0** | Implemented | Google Workspace, Microsoft Entra ID, GitHub |
| **OIDC** | New | Okta, Auth0, OneLogin, PingIdentity, any OIDC-compliant IdP |
| **SAML 2.0** | New | Okta, ADFS, OneLogin, PingIdentity, any SAML 2.0 IdP |

### OIDC Configuration Fields

| Field | Description |
|-------|-------------|
| Issuer URL | OIDC issuer (e.g., `https://dev-12345.okta.com`) |
| Client ID | Application client ID |
| Client Secret | Stored in Secrets Manager |
| Scopes | openid, email, profile (configurable) |
| Attribute Mapping | Map IdP claims to UserNode fields (email, name, role) |

### SAML Configuration Fields

| Field | Description |
|-------|-------------|
| IdP Entity ID | Identity provider entity identifier |
| SSO URL | IdP single sign-on endpoint |
| Certificate | X.509 certificate for signature verification (PEM upload) |
| Attribute Mapping | Map SAML attributes to UserNode fields |
| Name ID Format | emailAddress / persistent / transient |

### SSO Policies

| Setting | Description | Default |
|---------|-------------|---------|
| **Auto-Provisioning** | New users from IdP auto-created as MEMBER | Enabled |
| **Domain Matching** | Use `org.domain` to route login to correct IdP | Enabled |
| **Enforce SSO** | Require SSO for all members (disable direct OAuth) | Disabled |
| **Default Role** | Role assigned to auto-provisioned users | MEMBER |

### UI

- Configuration form with collapsible OIDC / SAML sections
- "Test Connection" button: initiates test auth flow, shows success/failure
- Certificate upload widget (drag-and-drop PEM file)
- Attribute mapping table (IdP claim → UserNode field)

**Endpoints:**
- `GET /app/v1/admin/sso` — get SSO config for org
- `PUT /app/v1/admin/sso` — configure provider (OIDC or SAML)
- `POST /app/v1/admin/sso/test` — test SSO connection
- `PATCH /app/v1/admin/sso/enforce` — toggle enforce-SSO

---

## 9.8 Channel Management (Admin-Level)

Admin controls which channels are available org-wide:

| Channel | Always Available | Admin Toggle | Credential Required |
|---------|-----------------|-------------|-------------------|
| **Web Chat** | ✅ (cannot be disabled) | — | None |
| **WhatsApp** | ❌ | Enable/Disable | WhatsApp Business API token |
| **Telegram** | ❌ | Enable/Disable | Telegram Bot token |
| **Email** | ❌ | Enable/Disable | None (platform DKIM/SPF) |

- Admin sets org-level channel credentials → stored in Secrets Manager
- Users in Settings can only activate channels from this admin-approved list
- If admin disables a channel that users have active, those user channels become inactive

---

## 9.9 GDPR & Compliance

| Feature | Description | Endpoint |
|---------|-------------|----------|
| **Data Export** | Initiate GDPR Article 20 data export for any user | `GET /app/v1/compliance/export` |
| **Erasure Request** | Submit GDPR Article 17 right-to-erasure request | `POST /app/v1/compliance/erasure` |
| **Erasure Status** | Track erasure request processing | `GET /app/v1/compliance/erasure/{request_id}` |
| **Audit Log** | Query audit events filtered by user, action, date range | `GET /app/v1/admin/audit-log` |
| **Retention Policy** | Configure data retention periods | Admin config |
| **Consent Management** | Track and manage user consent records | Admin config |

---

## 9.10 Deployment Configuration

Environment-aware: detects AWS ECS vs Docker Compose and shows relevant controls.

### Common

| Widget | Description |
|--------|-------------|
| Container Status | agent-runtime, channel-gateway, trigger-engine, api-server — status, uptime, health |
| Health Checks | Liveness + readiness probe results per container |
| Environment Viewer | Environment variables (secrets redacted) |

### Docker Compose Mode

| Action | Description |
|--------|-------------|
| Service Status | Per-service: running/stopped, port, uptime |
| Restart | Restart a service |
| Logs | View recent logs per service |

### AWS ECS Mode

| Widget | Description |
|--------|-------------|
| Task Definitions | CPU/memory per container |
| Service Scaling | Desired count, running count, pending count |
| Deployment Strategy | ROLLING / BLUE_GREEN / CANARY (configurable) |
| Circuit Breaker | Enable/disable with rollback |

**Endpoints:**
- `GET /app/v1/admin/deployment/status`
- `GET /app/v1/admin/deployment/config`

---

## 9.11 Cluster & Scaling

| Widget | Description |
|--------|-------------|
| Scaling Profiles | Current profile, CPU/memory thresholds |
| ECS Task Definitions | Per-container resource allocation |
| Redis Status | Cluster health, memory usage, connected clients |
| DB Pool | min/max connections, active, idle |

**Endpoint:** `GET /app/v1/admin/cluster/health`

---

## 9.12 Backup & Recovery

| Widget | Description |
|--------|-------------|
| Backup Policy | Retention period (35 days), backup window (03:00–04:00 UTC), encryption status |
| Backup History | Last N backups with status (COMPLETED/FAILED) |
| PITR | Point-in-time recovery configuration |

**Endpoint:** `GET /app/v1/admin/backups`

---

## 9.13 Security

| Widget | Description |
|--------|-------------|
| WAF Rules | Rate limits, IP allowlists, geo-restrictions |
| Encryption | TLS status, at-rest encryption status |
| OAuth Providers | Configured IdPs and status |
| JWT Key Rotation | Current signing key age, rotation schedule |

**Endpoint:** `GET /app/v1/admin/security/status`

---

## 9.14 Observability

| Widget | Description |
|--------|-------------|
| Alarms | P1/P2/P3 alarm list with current state (OK/ALARM/INSUFFICIENT_DATA) |
| Dashboards | Links to 5 CloudWatch dashboards: platform-health, llm-cost, latency, reliability, user-activity |
| Alert Routing | P1→page on-call, P2→alert SNS, P3→dashboard only |

**Endpoints:**
- `GET /app/v1/admin/alarms`
- `PATCH /app/v1/admin/alarms/{alarm_id}`

---

## 9.15 Migration Management

| Widget | Description |
|--------|-------------|
| Migration List | All migrations with version, name, status (APPLIED/SKIPPED/FAILED) |
| Pending | Count of unapplied migrations |
| Apply | "Apply Pending" button (admin only, confirmation required) |

**Endpoints:**
- `GET /app/v1/admin/migrations`
- `POST /app/v1/admin/migrations/apply`

---

## 9.16 Connector Management

| Widget | Description |
|--------|-------------|
| Connector List | Google Calendar, Outlook, Jira, Asana, Notion — status, last sync |
| Health | Per-connector health check result |
| Manual Sync | "Sync Now" button per connector |
| Credentials | Manage connector credentials (stored in Secrets Manager) |

**Endpoints:**
- `GET /app/v1/admin/connectors`
- `POST /app/v1/admin/connectors`
- `POST /app/v1/admin/connectors/{connector_id}/sync`
- `GET /app/v1/admin/connectors/{connector_id}/health`
