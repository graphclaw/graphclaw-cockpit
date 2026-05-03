# 04 — API Contract (Cockpit ↔ Gateway)

> **Status:** Approved · **Date:** 2026-05-03

This is the contract between cockpit (graphclaw-cockpit) and gateway (graphclaw). Backend implementation lives at [`graphclaw/docs/requirements/agent-monitor-v2-backend.md`](../../../graphclaw/docs/requirements/agent-monitor-v2-backend.md). This document is the source of truth for endpoint shapes that both repos depend on.

All endpoints:
- Live under `/app/v1/`.
- Require user-scoped JWT auth (`Depends(current_user)` pattern).
- Return JSON.
- Follow camelCase for response keys (matches existing convention).
- Have stable `operationId` so cockpit's openapi-fetch typegen stays consistent.

---

## 1. Existing endpoints (no changes)

These are consumed as-is. The cockpit must not assume any field changes.

| Endpoint | Used by | Phase |
|----------|---------|-------|
| `GET /app/v1/agent/status` | M-B KPI: Agent Status, Last Run | A |
| `GET /app/v1/agent/action-queue` | M-G Scoring task table | A |
| `GET /app/v1/agent/triggers/schedule` | M-E Scheduling | A |
| `POST /app/v1/agent/triggers/{id}/fire` | M-E Run Now | A |
| `GET /app/v1/skills/workers` | M-F Skills, Attention Strip | A |
| `GET /app/v1/agents/pool/status` | M-H Pool KPIs | A |
| `GET /app/v1/agents/pool/runners` | M-H Heartbeat, Attention Strip | A |
| `GET /app/v1/agents/dispatch-plan/{session_id}` | M-H Dispatch Plan | A |
| `GET /app/v1/scoring/tasks/{id}` | M-G Factor breakdown | A |
| `GET /app/v1/scoring/tasks/{id}/history` | M-G Score history (deferred) | C |
| SSE `/app/v1/events` | M-B Ticker, M-C live append | A |

**M-A audit:** verify each of the above renders the fields the cockpit consumes. If schema mismatch found → escalate as gateway change before consuming.

---

## 2. Endpoints to verify

These are referenced by the design but not yet confirmed to exist. M-A pre-flight grep:

```bash
# In graphclaw repo:
grep -rn "scoring/simulate\|scoring_simulate" src/graphclaw/api/
grep -rn "agents/delegations\|delegations_route" src/graphclaw/api/
```

| Endpoint | Used by | If missing |
|----------|---------|-----------|
| `POST /app/v1/scoring/simulate` | M-G-3 What-if Simulator | B-8 (add it) |
| `GET /app/v1/agents/delegations` | M-H-4 Active delegations | B-9 (add it) |

---

## 3. New endpoints (Phase B)

### 3.1 `GET /app/v1/agent/activity`

**Operation ID:** `getAgentActivity`
**Used by:** M-C Activity Panel
**Auth:** required, user-scoped.

**Query params:**
| Name | Type | Required | Notes |
|------|------|----------|-------|
| `from` | ISO8601 datetime | yes | Start of time range (inclusive) |
| `to` | ISO8601 datetime | yes | End of time range (exclusive) |
| `type` | enum | no | `all` (default) \| `decisions` \| `comms` \| `skills` \| `errors` |
| `limit` | int | no | 1–100, default 50 |
| `cursor` | string | no | Opaque base64 from previous response |

**Response:**
```json
{
  "items": [
    {
      "timestamp": "2026-05-03T14:32:07Z",
      "eventType": "task.scored",
      "message": "Scored 14 tasks — top priority: Competitive analysis (Notion vs Linear)",
      "taskId": "TK-4821",
      "status": "done",
      "sessionId": "SES-3f8a2c1d"
    }
  ],
  "nextCursor": "eyJmaWxlIjoiMjAyNi0wNS0wMy8xMzAwWi5qc29ubCIsIm9mZnNldCI6MTAyfQ=="
}
```

**Errors:**
- `400` if `to - from > 7 days`. Body: `{ "error": "range_too_large", "maxDays": 7 }`.
- `401` if no auth.
- `429` rate-limit if > 60 req/min.

**Backend implementation guidance:**
- Reads MinIO files matching `{user_id}/logs/*/{date}/{HH}00Z*.jsonl` for hours intersecting `[from, to]`.
- Streams files in reverse-chrono; parses each line; filters by `event_type`; applies `activity_formatter.format_event(record)`.
- Hard limit: 50 files scanned per request.
- Cursor encodes `{file_key, line_offset}`.

### 3.2 `GET /app/v1/agent/sessions`

**Operation ID:** `getAgentSessions`
**Used by:** M-C session grouping, M-E Run history
**Auth:** required, user-scoped.

**Query params:**
| Name | Type | Required | Notes |
|------|------|----------|-------|
| `from` | ISO8601 | no | Default: 7 days ago |
| `to` | ISO8601 | no | Default: now |
| `limit` | int | no | 1–50, default 10 |
| `cursor` | int | no | Offset for pagination |

**Response:**
```json
{
  "items": [
    {
      "sessionId": "SES-3f8a2c1d",
      "startedAt": "2026-05-03T13:50:00Z",
      "completedAt": "2026-05-03T13:50:45Z",
      "triggerType": "scheduled",
      "toolCallCount": 8,
      "skillCount": 1,
      "messagesSent": 1,
      "messagesReceived": 0,
      "inputTokens": 1820,
      "outputTokens": 410,
      "status": "completed"
    }
  ],
  "nextCursor": 10
}
```

**Errors:** `401` no auth.

### 3.3 `GET /app/v1/comms/summary`

**Operation ID:** `getCommsSummary`
**Used by:** M-D Banner, M-B Glance Strip
**Auth:** required.

**Query params:**
| Name | Type | Required |
|------|------|----------|
| `date` | YYYY-MM-DD | no (default: today UTC) |

**Response:**
```json
{
  "date": "2026-05-03",
  "received": 3,
  "sent": 2,
  "matched": 3,
  "unmatched": 0
}
```

### 3.4 `GET /app/v1/tasks/inbound-log`

**Operation ID:** `getInboundLog`
**Used by:** M-D Inbound tab
**Auth:** required, user-scoped (only user's own tasks).

**Query params:**
| Name | Type | Required |
|------|------|----------|
| `from` | ISO8601 | yes |
| `to` | ISO8601 | yes |
| `limit` | int | no (1–100, default 50) |
| `cursor` | string | no |

**Response:**
```json
{
  "items": [
    {
      "timestamp": "2026-05-03T13:55:10Z",
      "channel": "email",
      "fromDisplay": "Sarah K.",
      "messagePreview": "Budget has been approved for Q4. Please proceed with the…",
      "taskId": "TK-4799",
      "taskTitle": "Q3 budget approval sign-off",
      "actionTaken": "scored_and_updated",
      "signal": "DONE"
    }
  ],
  "nextCursor": "eyJ0cyI6IjIwMjYtMDUtMDNUMTM6NTU6MTBaIiwiaWQiOiJ4MTIzIn0="
}
```

**Backend implementation guidance:**
- Cypher: traverse all `TaskNode` where owner = current_user, unwind `update_log[]`, filter by date range, sort desc.
- `channel`, `fromDisplay`, `signal`, `actionTaken` come from `update_log` entry fields.

### 3.5 `GET /app/v1/tasks/outbound-log`

**Operation ID:** `getOutboundLog`
**Used by:** M-D Outbound tab
**Auth:** required, user-scoped.

**Query params:** same as inbound.

**Response:**
```json
{
  "items": [
    {
      "timestamp": "2026-05-03T14:31:44Z",
      "channel": "email",
      "toDisplay": "Alex M.",
      "subject": "Quick update on Q3 budget",
      "summary": "…can you confirm?",
      "taskId": "TK-4799",
      "taskTitle": "Q3 budget approval sign-off",
      "status": "sent"
    }
  ],
  "nextCursor": null
}
```

**Display name resolution priority for `toDisplay`:**
1. Lookup `agent_channel_identities` table by `recipient_hashed` → `display_name`.
2. Fallback to `TaskNode.counterparty.display_name` (graph property).
3. Fallback to `User-{lastFourCharsOfHash}`.

### 3.6 `POST /app/v1/scoring/simulate` *(verify exists, B-8)*

**Operation ID:** `simulateScore`
**Used by:** M-G-3 What-if Simulator

**Request body:**
```json
{
  "taskId": "TK-4821",
  "overrides": {
    "timelineUrgencyDays": 3,
    "dependencyCount": 4,
    "criticalPath": true,
    "blocker": false,
    "humanOverridePriority": 2,
    "resourceRisk": 0.7,
    "constraintPressure": 0.3
  }
}
```

**Response:**
```json
{
  "baselineScore": 0.87,
  "simulatedScore": 0.91,
  "delta": 0.04,
  "factorContributions": [
    { "name": "Timeline urgency", "weight": 0.25, "rawScore": 1.0 },
    { "name": "Dependency weight", "weight": 0.20, "rawScore": 0.85 }
  ]
}
```

**Note:** simulation only — no DB writes.

### 3.7 `GET /app/v1/agents/delegations` *(verify exists, B-9)*

**Operation ID:** `getActiveDelegations`
**Used by:** M-H-4 Active delegations table

**Query params:**
| Name | Type |
|------|------|
| `status` | optional filter: `running` \| `blocked` \| `all` (default running+blocked) |

**Response:**
```json
{
  "items": [
    {
      "agentId": "research-agent",
      "taskId": "TK-4821",
      "sessionId": "SES-3f8a2c1d",
      "status": "running",
      "startedAt": "2026-05-03T14:28:04Z",
      "lastHeartbeatAt": "2026-05-03T14:32:00Z",
      "lastHeartbeatAgeSeconds": 12,
      "durationMs": 240000,
      "lastProgress": "Searching competitor pricing pages…"
    }
  ]
}
```

---

## 4. SSE event shapes

The cockpit consumes SSE at `GET /app/v1/events`. Each event is a JSON line with `event` and `data`. Cockpit parses via `src/lib/sse.ts`.

| Event | Data shape (subset cockpit uses) |
|-------|-----------------------------------|
| `task.scored` | `{ count, topTaskId, topTaskTitle, sessionId, timestamp }` |
| `skill.completed` | `{ skillName, taskId, taskTitle, status, durationMs, tokens, error?, sessionId, timestamp }` |
| `briefing.ready` | `{ sectionsCriticalCount, sectionsAttentionCount, sentChannel, timestamp }` |
| `task.state_changed` | `{ taskId, taskTitle, oldState, newState, timestamp }` |
| `approval.pending` | `{ taskId, taskTitle, action, timestamp }` |
| `agent.heartbeat` | `{ runnerId, agentId, taskId, timestamp }` |
| `agent.tool_call` *(Phase B)* | `{ toolName, taskId, sessionId, success, latencyMs, attempt, timestamp }` |

These shapes are stable. If gateway needs to add fields, additive only.

---

## 5. Plain-language formatter contract

The string in `ActivityItem.message` and the cockpit's `formatEvent.ts` output for the same input event **must be byte-identical**. Both repos test against:

`tests/fixtures/event_formatter_cases.json`:
```json
[
  {
    "input": { "type": "task.scored", "count": 14, "topTaskTitle": "Competitive analysis" },
    "expected": "Scored 14 tasks — top priority: Competitive analysis"
  },
  {
    "input": { "type": "skill.completed", "skillName": "research", "status": "failed", "error": { "type": "TimeoutError", "afterSeconds": 60, "attempt": 3 } },
    "expected": "research skill failed — timed out after 60s on 3rd attempt"
  }
]
```

This file lives in **graphclaw repo** at `tests/fixtures/event_formatter_cases.json`. Cockpit copies it to its own repo at `e2e/fixtures/event_formatter_cases.json` and snapshot-tests against the copy. CI in cockpit fails if the fixture has drifted (file hash mismatch).

---

## 6. OpenAPI typegen

After each new endpoint ships in graphclaw:
1. Backend confirms endpoint appears in `http://localhost:8000/openapi.json`.
2. Cockpit runs `npm run gen:api` (verify command exists in package.json; add if missing).
3. Cockpit imports use `paths['/app/v1/agent/activity']['get']['responses']['200']['content']['application/json']` style types from generated `api-types.ts`.
4. PR includes regenerated types file as a separate commit.

---

## 7. Errors and rate limits

All endpoints follow the existing error shape:
```json
{
  "error": "<short_code>",
  "message": "<human readable>",
  "details": { /* optional */ }
}
```

Standard codes used:
- `range_too_large` — for `/agent/activity` when from-to span > 7 days.
- `not_found` — when `taskId` or `sessionId` not in user's scope.
- `unauthorized` — missing/invalid JWT.
- `rate_limited` — too many requests.

Rate limits (recommended starting points):
- `/agent/activity`: 60 req/min/user.
- `/scoring/simulate`: 30 req/min/user (debounced client-side).
- `/comms/summary`: 60 req/min/user (cacheable).
- All others: existing limits.
