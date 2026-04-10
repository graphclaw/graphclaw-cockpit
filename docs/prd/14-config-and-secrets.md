# 14 — Configuration & Secrets Management

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

---

## 14.1 Design Principle

> One JSON config file per user. One Secrets Manager integration per deployment. The UI writes config, the backend reads config. Secrets never appear in the config file — only reference IDs.

---

## 14.2 Single JSON Config File

Each user's settings are stored as a single JSON file in S3/MinIO.

### Storage

- **Path**: `config/{user_id}/settings.json`
- **Backend**: `StorageClient` (S3 in production, MinIO in local dev)
- **Read**: Agent reads fresh on each invocation (no stale cache)
- **Write**: UI writes via `PUT /app/v1/config`
- **Validation**: Pydantic model validates the full JSON before save

### Schema

```json
{
  "schema_version": "1.0",
  "profile": {
    "display_name": "Alex Kim",
    "timezone": "America/New_York",
    "locale": "en-US",
    "preferred_task_batch_size": 5,
    "responsive_hours": { "start": "09:00", "end": "18:00" }
  },
  "channels": {
    "web": { "enabled": true },
    "whatsapp": { "enabled": false, "phone_number": null, "secret_ref": null },
    "telegram": { "enabled": false, "bot_handle": null, "secret_ref": null },
    "email": { "enabled": true, "agent_email": "agent-abc@graphclaw.ai" }
  },
  "llm": {
    "default_provider": "anthropic",
    "default_model": "claude-sonnet-4-20250514",
    "byok_keys": {
      "anthropic": { "secret_ref": "graphclaw/USR-xxx/llm/anthropic" },
      "openai": { "secret_ref": null }
    },
    "temperature": 0.7,
    "max_tokens": 4096
  },
  "scoring_weights": {
    "w1_timeline_urgency": 0.25,
    "w2_dependency_weight": 0.20,
    "w3_critical_path": 0.20,
    "w4_blocker": 0.15,
    "w5_human_override": 0.10,
    "w6_resource_risk": 0.05,
    "w7_constraint_pressure": 0.05
  },
  "briefing": {
    "enabled": true,
    "schedule": "08:00",
    "channel": "web",
    "include_score_breakdown": false,
    "max_tasks": 10
  },
  "triggers": {
    "follow_up_default_hours": 48,
    "interrupt_threshold": 0.9,
    "quiet_hours": { "start": "22:00", "end": "07:00" }
  },
  "preferences": {
    "default_task_view": "graph",
    "theme": "system",
    "saved_filters": [],
    "notifications_enabled": true
  },
  "organizations": [
    {
      "org_id": "ORG-xxx",
      "role": "OWNER",
      "default_workspace_id": "WS-xxx"
    }
  ]
}
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/app/v1/config` | Read full config JSON |
| PUT | `/app/v1/config` | Write full config (Pydantic-validated before save) |
| PATCH | `/app/v1/config/{section}` | Update a specific section (e.g., `scoring_weights`, `channels`) |

### Migration

- New users: config initialized with defaults on first login
- Existing users (from pre-config era): migration script creates config from current in-memory settings
- `schema_version` field enables future migrations

---

## 14.3 AWS Secrets Manager Integration

The UI provides forms for storing credentials directly into AWS Secrets Manager — users never need to access the AWS console.

### Supported Credential Types

| Category | Key Name Examples | Used By |
|----------|-------------------|---------|
| `llm` | `anthropic`, `openai`, `google` | LLM BYOK API keys |
| `channel` | `whatsapp`, `telegram` | Channel authentication tokens |
| `mcp` | `google-calendar`, `github`, `slack` | MCP server auth tokens |
| `connector` | `jira`, `notion`, `linear` | Connector API keys / OAuth tokens |

### Secret Path Convention

```
graphclaw/{user_id}/{category}/{key_name}
```

Example: `graphclaw/USR-abc123/llm/anthropic`

### Flow

```
1. User opens Settings → LLM Keys (or Channels, or MCP, etc.)
2. User enters credential in masked input field (type="password")
3. UI calls: POST /app/v1/secrets/{category}/{key_name}
   Body: { "value": "sk-ant-api03-..." }
4. Backend:
   a. Validates category + key_name against allowed values
   b. Calls SecretsClient.set_secret(path, value)
   c. Updates config JSON with reference: config.llm.byok_keys.anthropic.secret_ref = path
   d. Returns: { "reference_id": "graphclaw/USR-xxx/llm/anthropic" }
5. UI shows green check mark, stores only reference_id
6. Secret value NEVER appears in UI again, NEVER in config JSON, NEVER in logs
```

### Key Operations

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| **Store** | `POST /app/v1/secrets/{category}/{key_name}` | Store credential, return reference ID |
| **Rotate** | `POST /app/v1/secrets/{category}/{key_name}` | Submit new value → overwrites old in SM → containers pick up within 15-min cache TTL |
| **Delete** | `DELETE /app/v1/secrets/{category}/{key_name}` | Remove from SM + clear reference in config JSON |
| **Test** | `POST /app/v1/secrets/{category}/{key_name}/test` | Validate credential works (make test API call to provider) |
| **Status** | `GET /app/v1/secrets/status` | List all references with validation status (no values) |

### Visual Status

Each stored credential shows a status indicator:

| Icon | Status | Meaning |
|------|--------|---------|
| 🟢 | Valid | Credential tested and working |
| 🔴 | Invalid | Last test failed (expired, revoked, or wrong) |
| ⚪ | Untested | Stored but not yet tested |
| 🔄 | Testing | Test in progress |

### Environment-Specific Backend

| Environment | SecretsClient | Storage |
|-------------|---------------|---------|
| **Local Dev** (Docker Compose) | `EnvFileSecretsClient` | `.env` file in container |
| **Production** (AWS) | `AWSSecretsClient` | AWS Secrets Manager |

The UI is identical in both environments — the backend factory (`create_secrets_client()`) selects the implementation based on `SECRETS_BACKEND` env var.

---

## 14.4 Channel Enablement Model

### Default State

| Channel | Default | Requires |
|---------|---------|----------|
| **Web Chat** | Always enabled | Nothing (built-in) |
| **WhatsApp** | Disabled | Admin allowlist + user activation + Business API token |
| **Telegram** | Disabled | Admin allowlist + user activation + Bot token |
| **Email** | Disabled | Admin allowlist + user activation (DKIM/SPF auto-configured) |

### Two-Tier Enablement

```
Admin Level (org-wide)                    User Level (per-user)
┌─────────────────────┐                  ┌──────────────────────┐
│ Channel Allowlist    │                  │ Channel Activation   │
│ (§09.8)              │ ──── gates ───→ │ (Settings panel)     │
│                      │                  │                      │
│ WhatsApp: ✅ allowed │                  │ WhatsApp: Activate   │
│ Telegram: ❌ blocked │                  │ Telegram: (hidden)   │
│ Email:    ✅ allowed │                  │ Email:    Active     │
└─────────────────────┘                  └──────────────────────┘
```

1. **Admin** configures which channels are available to the org (§09.8)
2. **User** in Settings sees only admin-approved channels
3. **User** activates a channel → provides credentials if needed → channel goes live
4. **Deactivation**: User can deactivate any time → `config.channels.{channel}.enabled = false`
5. Message history preserved after deactivation

### Channel Status States

| Status | UI Display | Meaning |
|--------|-----------|---------|
| `ACTIVE` | Green badge | Channel is live and receiving/sending messages |
| `PENDING_ACTIVATION` | Amber badge | Credentials submitted, waiting for verification |
| `INACTIVE` | Grey badge | Channel available but not activated by user |
| `DISABLED_BY_ADMIN` | Hidden | Admin removed from org allowlist |

---

## 14.5 Config Sync Between UI and Backend

### Write Path (UI → Backend)

```
User edits setting in UI
  → UI calls PATCH /app/v1/config/{section}
  → Backend validates with Pydantic
  → Backend writes to S3: config/{user_id}/settings.json
  → Backend returns updated section
  → UI updates local TanStack Query cache
```

### Read Path (Backend → Agent)

```
Trigger fires / Chat message received
  → Agent reads config/{user_id}/settings.json from S3
  → Agent applies: scoring weights, briefing schedule, channel preferences
  → Agent resolves secret_refs via SecretsClient when needed
```

### Consistency

- No caching on the agent read path — always reads fresh from S3
- S3 provides read-after-write consistency (strong consistency since 2020)
- Concurrent writes: last-write-wins (acceptable for single-user config)

---

## 14.6 Security Constraints

| Constraint | Implementation |
|-----------|---------------|
| Secret values never in config JSON | Config stores `secret_ref` (path string), not the value |
| Secret values never in UI after save | POST returns only `reference_id`; GET `/secrets/status` returns status, not value |
| Secret values never in logs | `AsyncLogger.log()` scrubs known secret patterns; `AuditLogger` uses `_scrub_sensitive()` |
| Config JSON validated before save | Pydantic model enforces types, ranges, and required fields |
| Config scoped to user | S3 path prefix: `config/{user_id}/` — IAM policy enforces user-scoped access |
| Secrets scoped to user | SM path prefix: `graphclaw/{user_id}/` — IAM policy enforces user-scoped access |
| Transport encryption | All API calls over HTTPS; S3 server-side encryption (AES-256) |
