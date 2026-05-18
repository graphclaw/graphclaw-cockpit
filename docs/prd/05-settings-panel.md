# 05 — Settings Panel

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

> **2026-05-02 design extension.** Settings extends with: `OrganizationNode.settings.directory_visibility` controls (FR-GRAPH-006), AgentChannelIdentity admin per channel (FR-IN-003), per-user `discoverability` override, channel-stickiness window (`channel_stickiness_hours` default 48 — FR-GRAPH-005), multi-agent management (FR-AM-001), SaaS multi-org switcher. References:
> - [graphclaw/docs/architecture/13-tenancy-model.md](../../../graphclaw/docs/architecture/13-tenancy-model.md)
> - [graphclaw/docs/architecture/14-agent-triad.md](../../../graphclaw/docs/architecture/14-agent-triad.md)
> - [graphclaw/docs/architecture/15-user-identity-and-onboarding.md](../../../graphclaw/docs/architecture/15-user-identity-and-onboarding.md)
> - [graphclaw/docs/requirements/agent-triad-and-comms-substrate.md](../../../graphclaw/docs/requirements/agent-triad-and-comms-substrate.md) FR-IN-003, FR-AM-001, FR-UI-002, FR-GRAPH-005, FR-GRAPH-006

---

## 5.1 Channel Configuration

The settings panel handles channel activation. The **web chat** is always active and requires no configuration. All other channels require explicit enablement — and are constrained to the admin-approved channel allowlist for the org.

### Channel Activation Flows

**WhatsApp:**
```
1. User opens Settings → Channels → WhatsApp → "Activate"
2. Platform provisions a WhatsApp Business number for this user
3. UI shows: "Send 'ACTIVATE [code]' to [number] from your WhatsApp"
4. User sends the message from their phone
5. Platform verifies sender phone, links to UserNode
6. Status changes: Pending Activation → Active
7. User saves the agent number as a contact
```

**Telegram:**
```
1. User opens Settings → Channels → Telegram → "Activate"
2. UI shows: "Open Telegram and send /start to @jd_workgraph_bot"
3. User opens Telegram, sends /start
4. Bot records Telegram user_id, links to UserNode
5. Status changes: Pending Activation → Active
```

**Email:**
```
1. User opens Settings → Channels → Email → "Activate"
2. No user-side setup required
3. UI shows: "Your agent email is jd-agent@workgraph.app"
4. DKIM/SPF configured at domain level by platform
5. Status: Active immediately
```

### Channel Status Display

| Status | Badge | Meaning |
|--------|-------|---------|
| Active | 🟢 | Channel linked and operational |
| Pending Activation | 🟡 | Awaiting user action (code, /start, etc.) |
| Inactive | ⚪ | Not activated |
| Not Available | 🔒 | Channel not in org admin's allowlist |

### Per-Org Channel Binding

Users can bind different channels to different organizations:
- "Use WhatsApp for Work org briefings, Email for Personal"
- Configured via per-org briefing schedule (see §5.4)

**Endpoints:**
- `GET /app/v1/settings/channels` — list channels with status
- `POST /app/v1/settings/channels/{channel}/activate` — initiate activation
- `DELETE /app/v1/settings/channels/{channel}` — deactivate

---

## 5.2 Organization Workspace Setup

| Action | Description |
|--------|-------------|
| **Create** | New org with name, color_tag, emoji_tag |
| **Rename** | Update org name |
| **Configure** | Per-org settings (see table below) |
| **Delete** | Remove org (admin only, confirmation required) |

### Per-Org Settings

| Setting | Field | Default |
|---------|-------|---------|
| Briefing Channel | whatsapp / telegram / email / web | web |
| Briefing Time | HH:MM local time | 08:00 |
| Briefing Days | MON–SUN checkboxes | MON–FRI |
| Briefing Style | concise / detailed | concise |
| Timezone | IANA timezone | User's timezone |
| Color Tag | Color picker | Random |
| Emoji Tag | Emoji selector | 📁 |
| Data Isolation | data_isolated, contact_isolated, channel_isolated toggles | All false |
| Workspace Visibility | PRIVATE / INTERNAL / PUBLIC | PRIVATE |
| Allow Guest Members | Toggle | false |
| Require Approval for Tasks | Toggle | false |

**Endpoints:**
- `GET /app/v1/settings/organizations` — list orgs
- `POST /app/v1/settings/organizations` — create org
- `PATCH /app/v1/settings/organizations/{org_id}` — update settings

---

## 5.3 LLM Provider Configuration (User-Level)

Users configure their LLM preferences within the boundaries set by the org admin:

| Setting | Description |
|---------|-------------|
| **Provider** | Select from admin-approved list (Anthropic, OpenAI, Google, LiteLLM custom) |
| **Model** | Select from admin-approved models for chosen provider |
| **BYOK Key** | "Bring Your Own Key" — submit API key via masked input. Stored in Secrets Manager, never in UI or logs. Only key reference ID shown after submission. |
| **Key Rotation** | Submit new key → SM overwrites → containers pick up within 15-min cache TTL |
| **Key Deletion** | Remove key → SM deletion → config JSON reference cleared |
| **Test Connection** | Verify key works before saving (sends test request) |

If admin has set org-level keys and disabled user BYOK, the key fields are hidden.

**Endpoints:**
- `POST /app/v1/settings/llm-keys` — store BYOK key
- `DELETE /app/v1/settings/llm-keys/{provider}` — remove key
- `POST /app/v1/secrets/{category}/{key_name}/test` — test credential

---

## 5.4 Briefing Schedule Configuration

Per-org briefing configuration (stored in org settings):

| Field | Type | Description |
|-------|------|-------------|
| Channel | Dropdown | WhatsApp / Telegram / Email / Web (from activated channels) |
| Time | Time picker | HH:MM in org timezone |
| Days | Checkbox group | MON–SUN |
| Style | Radio | Concise / Detailed |
| Timezone | Dropdown | IANA timezone list |

Preview: shows sample briefing in the selected style.

---

## 5.5 Scoring Weight Adjustment

Power users tune the 7-factor scoring weights used by the orchestrating agent:

| Weight | Factor | Default | Range |
|--------|--------|---------|-------|
| W1 | Timeline Urgency | 0.25 | 0.00–1.00 |
| W2 | Dependency Weight | 0.20 | 0.00–1.00 |
| W3 | Critical Path | 0.20 | 0.00–1.00 |
| W4 | Blocker | 0.15 | 0.00–1.00 |
| W5 | Human Override | 0.10 | 0.00–1.00 |
| W6 | Resource Risk | 0.05 | 0.00–1.00 |
| W7 | Constraint Pressure | 0.05 | 0.00–1.00 |

**UI:** Slider for each weight. Weights auto-normalize to sum to 1.0. Live preview: "With these weights, your top 3 tasks would be: …"

**Endpoints:**
- `GET /app/v1/settings/scoring-weights` — current W1–W7
- `PATCH /app/v1/settings/scoring-weights` — update

---

## 5.6 Trigger Engine Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Default Follow-Up Days | Days before follow-up fires | 3 |
| Interrupt Threshold | Priority score that justifies mid-day alert (max 2 per day) | 0.85 |
| Auto Update AI Agents | Agent can auto-update AI agent resource tasks | true |
| Auto Send Follow-ups | Agent sends follow-ups without approval | true |
| Auto Close Resolved | Agent auto-closes tasks marked done by inbound update | false |

---

## 5.7 A2A API Key Management (Deferred)

Status: Deferred from current Settings scope to simplify current release UX.

Future implementation design, rollout phases, and testing details are tracked in:
`docs/planning/a2a-future-release-design-plan.md`

For external AI agents registered as ResourceNodes:

| Action | Description |
|--------|-------------|
| **Generate** | Create new `wg_agent_` API key → shown once, never again |
| **Rotate** | Replace key → old key invalid immediately |
| **Revoke** | Delete key → hash cleared from ResourceNode |
| **List** | Show all registered agents: key_id, agent_name, registered_at (no plaintext keys) |

**API alignment note (pending):**
- Future implementation will align cockpit-facing A2A lifecycle behavior with canonical runtime A2A behavior.
- Canonical endpoint and auth decisions are pending and documented in the future-release plan.
