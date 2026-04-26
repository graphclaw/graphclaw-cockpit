# Skills Reliability Design Plan

## Scope
Stabilize end-to-end Skills workflows in Cockpit and Gateway:
- Skill authoring create/update/fork/delete
- Add external skill sources
- Persistent storage and retrieval from MinIO
- UI resilience under stale auth/session drift
- Deterministic E2E validation for regression prevention

## Problem Statement
User-facing symptoms:
- Add Source appeared to do nothing
- Skill save/fork actions intermittently failed
- Authored-skill list and editor state desynced
- E2E checks were not reliably proving MinIO persistence

Observed runtime blockers:
- Frequent `401 Unauthorized` with `Signature verification failed`
- Auth drift between persisted frontend tokens and backend restart/keys
- API contract mismatch between authored-skill backend payload and frontend expectations
- E2E paths/flows that allowed false positives

## Root Cause Analysis
1. Frontend auth recovery gap:
- Some critical requests used raw fetch helpers without robust 401 recovery/retry.
- Stale local tokens survived backend restarts and caused persistent 401 loops.

2. Over-aggressive session teardown:
- Background refresh behavior could clear session state on transient refresh failures.

3. Authored-skill contract mismatch:
- Backend list/detail/fork responses lacked metadata fields the UI relied on.
- Fork response shape was not consistently compatible with frontend selection logic.

4. E2E validation gaps:
- MinIO checks previously tolerated failures in some paths.
- UI automation used brittle editor mutation and had weak synchronization.
- Puppeteer runtime needed VM module compatibility for AWS SDK-based MinIO checks.

## Design Goals
- Make auth failure handling deterministic and recoverable.
- Align authored-skill request/response contracts across backend and frontend.
- Guarantee MinIO persistence is asserted in CI-representative tests.
- Keep UX stable under transient backend/auth turbulence.

## Solution Architecture
### A. Session Recovery and Auth Stability (Cockpit)
- Introduce shared session utility: `src/lib/auth-session.ts`.
- Recovery order:
  1) try refresh token exchange
  2) dev-token fallback when enabled
  3) hard logout + redirect if unrecoverable at request level
- Apply centralized recovery in:
  - API middleware path (`src/lib/api-client.ts`)
  - fetch hook wrappers (`src/lib/api-hooks.ts`) with one retry on 401
- Background refresh behavior:
  - Preserve active session on transient refresh failure; rely on request-level 401 handling for forced logout.

### B. Authored-Skill Contract Alignment (Gateway)
- Enrich authored-skill models and responses to include:
  - `name`, `description`, `version`, `content`, `path`, timestamps, and compatible IDs.
- Normalize skill IDs and parse metadata from SKILL.md.
- Ensure fork response includes both compatibility and lineage fields:
  - `skill_id`, `forked_skill_id`, `original_skill_id`.
- Keep storage path canonical for authored skills:
  - `{user}/skills/authored/{skillId}/SKILL.md`.

### C. UI Behavior Hardening (Cockpit)
- Skill Authoring page:
  - robust remote-to-local mapping with safe fallbacks
  - stable auto-selection of first available skill
  - update payload includes metadata + content
  - fork selection handles either `skill_id` or `forked_skill_id`
  - explicit error surface for failed operations
- Skills/Sources views:
  - deterministic test IDs for tab/select/add flows

### D. E2E Reliability Improvements (Puppeteer)
- MinIO helper path alignment to canonical SKILL.md location.
- Strict MinIO assertions (no skip-on-error fallback).
- UI authored-skill save flow uses real keyboard interaction and waits for enabled Save state.
- Puppeteer auth bootstrap stores both access and refresh tokens in localStorage persist shape.
- Jest runner uses VM module mode for AWS SDK MinIO operations:
  - `node --experimental-vm-modules ...jest...`

## Rollout Plan
1. Deploy gateway + cockpit together to avoid contract skew.
2. Verify smoke paths manually:
- `/skills` Add Source
- `/intelligence/skill-authoring` create/save/fork
3. Run targeted backend tests for intelligence routes.
4. Run targeted Puppeteer specs for authored skills + registry source flow.
5. Monitor gateway auth errors and authored-skill operation logs.

## Observability and Diagnostics
Add/retain structured logs for:
- `api.auth.expired`, `api.auth.refreshed`, `api.auth.refresh_failed`
- authored skill create/update/fork/delete with `skill_id` and `user_id`
- MinIO write/read path and object existence in E2E diagnostics

Key signals:
- 401 rate on `/app/v1/skills*` and `/app/v1/intelligence/skills/authored*`
- authored-skill operation success/error counts
- source-add success/error counts

## Risk Assessment
1. Mixed-version deployment risk:
- Mitigation: deploy backend/frontend pair atomically.

2. Dev-auth fallback overuse risk:
- Mitigation: guarded by `VITE_ENABLE_DEV_AUTH`; production disables fallback path.

3. E2E runtime variability risk:
- Mitigation: stronger selectors, explicit waits, and strict MinIO checks.

## Test Matrix
### Backend
- `tests/test_api/test_intelligence_routes.py`
  - authored create/get/list/update/delete/fork
  - metadata/content/path response validation

### Frontend Unit
- `src/features/intelligence/SkillAuthoringPage.test.tsx`
- `src/features/skills/SkillsPage.test.tsx`

### Puppeteer E2E
- `e2e-puppeteer/specs/intelligence/skill-authored.spec.ts`
- `e2e-puppeteer/specs/skills/skill-registry.spec.ts`

Required assertions:
- UI create/save and Add Source produce successful API responses
- authored skill object exists at MinIO canonical key and contains saved content
- authored skill remains retrievable after refresh/list fetch

## Success Criteria
- No reproducible no-op behavior for Add Source or skill save in local stack.
- Authored skill data persists and is fetched correctly from MinIO-backed API.
- Targeted backend and frontend tests pass.
- Targeted Puppeteer specs pass with strict MinIO checks enabled.
