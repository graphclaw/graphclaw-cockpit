# External A2A Harness (Skeleton)

Status: Pending scaffold (not active in CI)
Last updated: 2026-05-18

## Purpose

Provide a real external-agent simulator for future A2A end-to-end tests:

- Receive orchestrator callback deliveries
- Capture callback payloads for assertion
- Send inbound status updates back to GraphClaw `/api/v1/task-update`

## Files

- `external-agent-service.ts` — lightweight HTTP service with callback capture and replay endpoints
- `../a2a-orchestrator-trigger.spec.ts` — pending e2e skeleton for outbound callback verification
- `../a2a-roundtrip.spec.ts` — pending e2e skeleton for outbound+inbound closure

## Run (manual)

From repo root:

```bash
npx tsx e2e/a2a/harness/external-agent-service.ts
```

Environment variables:

- `A2A_HARNESS_PORT` (default `8787`)
- `GRAPHCLAW_BASE_URL` (default `http://localhost:8000`)
- `GRAPHCLAW_A2A_KEY` (optional, needed for `/replay/task-update`)

## Endpoints

- `GET /health` — liveness
- `POST /callback` — receives outbound callback payloads
- `GET /events` — returns captured callbacks
- `DELETE /events` — clears in-memory event list
- `POST /replay/task-update` — forwards payload to GraphClaw `/api/v1/task-update`

## Notes

- This is intentionally in-memory and ephemeral.
- This harness is a development tool and not wired into CI.
- Future implementation will add docker-compose profile integration and signed callback validation checks.
