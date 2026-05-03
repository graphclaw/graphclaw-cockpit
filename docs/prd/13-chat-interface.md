# 13 — Chat Interface

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

> **2026-05-02 design extension.** Web chat is **one channel of many**. The comms agent maintains unified context across cockpit, WhatsApp, Telegram, email; replies flow back on the originating channel; counterparty conversations are visible but stored **separately** from owner-self chat under `{user_id}/conversations/{counterparty_id}/{channel}/{thread_id}.jsonl` (FR-STORE-001). Web chat is processed through the **same** InboundIntelligenceAgent distillation as other channels (FR-CA-002). References:
> - [graphclaw/docs/architecture/14-agent-triad.md](../../../graphclaw/docs/architecture/14-agent-triad.md)
> - [graphclaw/docs/architecture/16-cross-user-conversations.md](../../../graphclaw/docs/architecture/16-cross-user-conversations.md)
> - [graphclaw/docs/requirements/agent-triad-and-comms-substrate.md](../../../graphclaw/docs/requirements/agent-triad-and-comms-substrate.md) FR-CA-001, FR-CA-002, FR-STORE-001

---

## 13.1 Design Principle

> Web chat is the **default, always-active channel**. It requires no setup, no API keys, and no external service. Every user gets it automatically upon account creation. Other channels (WhatsApp, Telegram, Email) are optional add-ons activated from Settings.

---

## 13.2 Layout

| Mode | Layout | Activation |
|------|--------|------------|
| **Sidebar** | Right-side sliding panel (350px wide), overlays the graph/table view | Click chat icon in top bar |
| **Full Page** | Dedicated `/chat` route, full-width, conversation-first | Navigate via sidebar link |

Both modes share the same component — only the container width changes.

---

## 13.3 Message Model

### User → Agent (Inbound)

```json
{
  "id": "msg_abc123",
  "channel": "web",
  "sender_id": "USR-xxx",
  "content": "What's the status of the Q3 launch?",
  "timestamp": "2026-03-21T14:30:00Z",
  "session_id": "sess_xyz"
}
```

Maps to existing `InboundMessage` Pydantic model with `channel="web"`.

### Agent → User (Outbound)

```json
{
  "id": "msg_def456",
  "channel": "web",
  "recipient_id": "USR-xxx",
  "content": "The Q3 Launch goal is 68% complete with 3 blocked tasks...",
  "cards": [
    { "type": "task_card", "task_id": "TSK-4821", "title": "Deploy to prod", "state": "BLOCKED", "score": 0.876 },
    { "type": "score_card", "task_id": "TSK-4821", "factors": { "w1": 0.85, "w2": 0.60, "..." : "..." } }
  ],
  "suggested_actions": [
    { "label": "Unblock TSK-4821", "action": "transition", "task_id": "TSK-4821", "target_state": "READY" },
    { "label": "View Dependencies", "action": "navigate", "path": "/graph/tasks/TSK-4821/deps" }
  ],
  "timestamp": "2026-03-21T14:30:02Z",
  "session_id": "sess_xyz"
}
```

Maps to existing `OutboundMessage` model with `channel="web"`, extended with `cards` and `suggested_actions`.

---

## 13.4 Capabilities

The chat interface supports the full range of agent interactions:

| Capability | Example User Message | Agent Response |
|-----------|---------------------|----------------|
| **Status query** | "What's blocking the Q3 launch?" | Text explanation + task cards for blocked items |
| **Task creation** | "Add a task to review the API docs, due Friday" | Creates task node, returns confirmation card |
| **State transition** | "Mark TSK-4821 as done" | Transitions state, shows updated task card |
| **Priority explanation** | "Why is TSK-4821 ranked #1?" | ScoreExplanation in natural language + score card |
| **Briefing request** | "Give me today's briefing" | Full briefing text (same as daily briefing) |
| **Approval** | "Approve the Jira sync" | Resolves pending approval task |

---

## 13.5 Agent Response Rendering

Responses are rendered as rich messages, not plain text:

### Text Content

- Rendered as Markdown (headings, lists, bold, code blocks, links)
- Task references (e.g., `TSK-4821`) rendered as clickable links → open in detail panel or navigate to graph

### Inline Cards

| Card Type | Content | Actions |
|-----------|---------|---------|
| **Task Card** | Title, state badge, score, assignee, deadline | "View" → detail panel, "Transition" → state menu |
| **Score Card** | 7-factor mini breakdown (sparkline bars) | "Full Breakdown" → explainability panel (§08) |
| **Approval Card** | Pending approval description, requester | "Approve" / "Deny" buttons |
| **Briefing Card** | Summary stats, top-3 tasks, blockers | "Full Briefing" → expand |
| **Error Card** | Error message, suggested fix | "Retry" button |

### Suggested Actions

- Rendered as clickable pill buttons below the message
- Each action maps to either:
  - API call (e.g., state transition)
  - Navigation (e.g., open graph view with task focused)
  - Follow-up message (pre-fill chat input with a suggested prompt)

---

## 13.6 Real-Time Communication

### WebSocket Connection

- Endpoint: `WS /app/v1/chat/ws`
- Auth: JWT passed as query param on initial handshake (upgraded to cookie-based after connect)
- Reconnection: Automatic with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Heartbeat: Client sends ping every 30s; server responds with pong

### Message Flow

```
Client                          Server
  |--- { type: "message",        |
  |      content: "..." } ------>|
  |                               |---> InboundMessage → Agent Loop
  |                               |<--- Agent processes...
  |<-- { type: "typing" } -------|  (streaming indicator)
  |<-- { type: "response",       |
  |      content: "...",          |
  |      cards: [...],            |
  |      actions: [...] } -------|
```

### Typing Indicator

- Server sends `{ type: "typing" }` event when agent starts processing
- Client shows animated typing indicator
- Clears when response arrives

---

## 13.7 Conversation History

### Persistence

- All messages stored per-user with session grouping
- Sessions auto-created: new session starts after 30 minutes of inactivity
- Endpoint: `GET /app/v1/chat/messages?session_id=...&before_id=...&limit=50`

### UI

- **Session list**: Left sidebar (full page mode) showing past sessions by date
- **Infinite scroll**: Load older messages on scroll-up
- **Search**: Full-text search across conversation history
- **Export**: Download conversation as Markdown or JSON

### Session Grouping

| Field | Description |
|-------|-------------|
| session_id | UUID, auto-generated |
| started_at | First message timestamp |
| ended_at | Last message timestamp + 30 min inactivity |
| message_count | Total messages in session |
| summary | Agent-generated 1-line summary (lazy, on first view) |

---

## 13.8 Backend Integration

The chat interface requires a new operating mode for the agent loop:

### Current Mode: Batch Scoring Cycle

- Trigger engine fires → Agent scores all tasks → Generates ranked queue → Sends briefing/follow-ups
- Asynchronous, agent-initiated

### New Mode: Single-Message Request-Response

- User sends message via chat → Agent processes single message → Returns response
- Synchronous (within WebSocket), user-initiated
- New internal method: `AgentLoop.process_chat_message(user_id, message) → AgentResponse`

### AgentResponse Model

```python
class AgentResponse(BaseModel):
    content: str                         # Markdown text
    cards: list[InlineCard] = []         # Task cards, score cards, etc.
    suggested_actions: list[Action] = [] # Clickable follow-up actions
    session_id: str                      # For conversation continuity
```

---

## 13.9 Notifications Bridge

When the agent generates an outbound message and the user is **not** currently viewing the chat:

- **Browser notification** (if permitted): "GraphClaw: 3 tasks need your attention"
- **Badge count** on the chat icon in the top bar
- **Notification queue**: Accumulated messages shown when user opens chat

If the user has other channels active (WhatsApp/Telegram/Email), the agent routes messages there instead — following the channel priority rules from the trigger engine.

---

## 13.10 Data Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /app/v1/chat/messages` | Send message (REST fallback if WebSocket unavailable) |
| `GET /app/v1/chat/messages` | Fetch history (paginated) |
| `GET /app/v1/chat/messages/{id}` | Single message detail |
| `WS /app/v1/chat/ws` | Real-time bidirectional stream |
