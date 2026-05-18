# A2A Future Release Design Plan

Status: Pending (design only)
Owner: TBD
Last updated: 2026-05-18
Target release: Future release (not in current release)

## 1. Purpose

This document captures the full design for Agent-to-Agent (A2A) functionality so it can be implemented in a future release without re-discovery.

Current release objective: simplify Settings by pulling out A2A configuration UI from the primary Settings flow.
Future release objective: deliver complete, production-grade A2A lifecycle, orchestrator integration, and real-agent end-to-end testing.

## 2. Current Release Decision

The following is intentionally deferred to a future release:

- Advanced A2A configuration in Settings
- Orchestrator outbound trigger to external A2A agents
- Unified runtime and app-plane A2A key lifecycle
- Persisted endpoint/callback editing from cockpit UI

Current release simplification direction:

- Remove or hide A2A configuration controls from Settings navigation
- Keep this design plan as the implementation source of truth
- Mark all A2A implementation work as pending in planning and PRD docs

## 3. Current Baseline (As-Is)

### 3.1 Cockpit UI baseline

- A2A key generation currently defaults to label "New Key" from the current UI flow.
- Rotate action is visible but not wired in Settings.
- Canvas A2A endpoint edit field is local-state only and not persisted.
- Canvas can display A2A external-agent visuals when API data exists.

### 3.2 Backend baseline

- Core runtime A2A exists under `/api/v1/a2a/*` and `/api/v1/task-update`.
- Cockpit-facing app-plane endpoints exist under `/app/v1/a2a/agents`.
- Runtime inbound auth validates `X-Agent-Api-Key` via core A2A key manager path.
- Current orchestrator delegation path is internal sub-agent oriented; external A2A outbound triggering is not a first-class implemented path.

## 4. Future Architecture (Target)

### 4.1 Canonical A2A API strategy

Target state:

- Use one canonical runtime plane for A2A key lifecycle and task updates.
- Align cockpit app-plane behavior to canonical runtime behavior.
- Eliminate split-brain key lifecycle behavior between `/app/v1` and `/api/v1` surfaces.

Design options (decision required before implementation):

- Option A (recommended): canonicalize around `/api/v1/a2a/*` and `/api/v1/task-update`; app-plane routes become adapters.
- Option B: maintain dual planes with explicit translation layer and parity contract tests.

### 4.2 Data model and persistence

A2A registration record requirements:

- `agent_id` / `key_id`
- `agent_name`
- `description`
- `callback_url`
- `trust_status` (`ACTIVE`, `REVOKED`, optional future states)
- `api_key_hash` (no plaintext at rest)
- `created_at`, `updated_at`, `rotated_at`
- `owner_user_id`
- optional `capabilities`

Non-negotiable security constraints:

- Plaintext key is returned once only at issue/rotation
- Constant-time hash compare for verification
- Explicit revoke semantics invalidating runtime authentication immediately

### 4.3 Orchestrator awareness and context flow

Target state:

1. Orchestrator discovers A2A agents as candidate external resources.
2. Context assembly includes normalized A2A descriptors:
   - `agent_id`, `agent_name`, `callback_url`, `trust_status`, `capabilities`, ownership
3. A2A records appear in orchestrator decision context only when trust-valid and feature-enabled.

### 4.4 Outbound trigger model (orchestrator -> external A2A)

Target state:

- Orchestrator can trigger external A2A agent via callback URL.
- Outbound payload contract uses JSON-RPC-compatible envelope with correlation fields.
- Delivery includes idempotency key, retries, timeout policy, and failure categorization.
- Revoked or blocked trust state must hard-block outbound trigger attempts.

Recommended reliability pattern:

- Broker-backed outbound worker for callback delivery
- Retry with bounded exponential backoff
- Dead-letter handling and operator-visible error classing

### 4.5 Inbound update closure loop

Target state:

- External agent status updates return through `/api/v1/task-update`.
- Pipeline publishes and consumes with traceable message/session identifiers.
- Status resolution maps to task lifecycle transition path with audit visibility.

## 5. Future UI and UX Design

### 5.1 Current release simplification UX

- A2A Settings page removed or hidden from primary Settings nav.
- A2A command palette shortcut removed or hidden while deferred.
- If any A2A visibility remains, it must be labeled as deferred or admin-only experimental.

### 5.2 Future release UI placement

Move A2A out of Settings into a dedicated integration surface:

- Proposed area: Integrations or Agent Integrations
- Rationale: A2A is an operational integration surface, not a general user preference.

### 5.3 Future A2A UI capabilities

A2A lifecycle panel:

- Register external agent
- Edit agent name and description
- Rotate key with clear consequences
- Revoke/reactivate (if reactivation is supported)
- Copy one-time key and acknowledgement of one-time visibility

A2A connection panel:

- Persisted callback URL
- Optional capability declaration
- Trust-status control and warnings
- Health and last-contact indicators

Canvas behavior:

- External A2A node remains visualized
- Inspector edits persist to backend
- Trigger controls are explicit and auditable

## 6. Security and Compliance Design

Required controls:

- Header-based API key authentication for task updates (`X-Agent-Api-Key`)
- At-rest hash storage only (no plaintext key persistence)
- URL validation and allowlist policy for outbound callbacks
- Per-agent and per-owner rate limits
- Structured audit events for register, rotate, revoke, trigger, and failure outcomes

## 7. Testing Design

### 7.1 Unit and contract tests

- Key lifecycle: issue, verify, rotate, revoke
- API parity tests between app-plane and runtime-plane endpoints (if both are retained)
- Payload schema validation for outbound and inbound JSON-RPC envelopes

### 7.2 Integration tests

- Runtime ingestion: `/api/v1/task-update` -> broker publish -> consumer path
- Trust-state enforcement on outbound trigger
- Retry and dead-letter paths for callback failures

### 7.3 Cockpit e2e tests

- Register/edit/rotate/revoke flows
- Callback URL persistence and validation
- Canvas A2A inspector persistence behavior
- Permission/feature-flag visibility behavior

### 7.4 Real external-agent simulation tests

Add a real-life test harness:

- Minimal external A2A service (FastAPI)
- Registration flow obtains real key
- Outbound trigger receives callback at external service
- External service sends inbound status updates to platform
- Verify task state and audit/trace artifacts

### 7.5 Load and resilience tests

- Throughput on task-update endpoint
- Callback retry storm protection
- Rate-limit and timeout behavior under degraded callback availability

## 8. Rollout Plan (Pending)

Phase A: Documentation and API strategy lock

- Decide canonical API approach
- Confirm simplification now and future implementation boundary

Phase B: Backend parity and key-plane alignment

- Unify key lifecycle behavior across cockpit and runtime
- Add parity contract tests

Phase C: Orchestrator discovery and outbound trigger

- Add A2A discovery context and trigger worker
- Add reliability and trust guardrails

Phase D: Cockpit future UI

- Introduce dedicated A2A integration surface
- Persist endpoint and lifecycle actions

Phase E: Full test hardening

- Real external-agent scenario in integration/e2e suites
- Load and chaos-style failure coverage

All phases remain pending.

## 9. Open Questions

1. Canonical API decision: single-plane canonicalization vs permanent dual-plane.
2. Outbound callback auth: mTLS, HMAC signature, or bearer token per registration.
3. Trust model: what states beyond `ACTIVE` and `REVOKED` are needed.
4. Trigger mode: synchronous callback from orchestrator vs async outbound worker only.
5. UI placement: dedicated Integrations hub location and permission model.

## 10. Acceptance Criteria for Future Implementation

Functional:

- Orchestrator can discover, reason about, and trigger eligible A2A agents.
- External A2A agents can send valid inbound status updates and affect task lifecycle as designed.
- Cockpit supports complete lifecycle management without split-behavior surprises.

Quality:

- Full traceability from trigger to update with message/session correlation.
- Security controls enforced and audited.
- Real external-agent simulation tests pass in release validation.

## 11. Implementation Status

- This is a design artifact only.
- No implementation changes are required by this document in current release.
- All items tracked here are pending and intended for future release pickup.

## 12. Source References

- `docs/prd/05-settings-panel.md`
- `docs/prd/11-api-contract.md`
- `docs/planning/build-plan.md`
- `docs/design-plan.md`
- `docs/testing/scenario-catalog.md`
- `src/features/settings/A2aPage.tsx`
- `src/features/canvas/PropertyInspector.tsx`
- `../graphclaw/src/graphclaw/a2a/routes.py`
- `../graphclaw/src/graphclaw/a2a/middleware.py`
- `../graphclaw/src/graphclaw/a2a/key_manager.py`
- `../graphclaw/src/graphclaw/agent/catalog.py`
- `../graphclaw/src/graphclaw/agent/main_orchestrator.py`
