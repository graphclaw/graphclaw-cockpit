# 05 — Open Risks and Known Limitations

> **Status:** Approved · **Date:** 2026-05-03

This document captures every known risk, gap, or open decision for Wave M. New risks discovered during implementation should be added here, not lost in PR comments.

---

## 1. Active risks

### R-1 — Plain-language formatter divergence
**Severity:** Medium
**Description:** The cockpit's `formatEvent.ts` mirrors the gateway's `activity_formatter.py`. If they drift, live SSE ticker shows different strings than the historical Activity table for the same event.
**Mitigation:** Shared `tests/fixtures/event_formatter_cases.json`, snapshot tested in both repos. CI fails on mismatch. Fixture file lives in gateway repo as source of truth; cockpit copies via build script (or manual sync at PR review).
**Owner:** Whoever ships M-B-3 + B-3.
**Status:** Open until both formatters merge.

### R-2 — MinIO write race (Gap 6 from brainstorm)
**Severity:** Low (B-7 delivered).
**Description:** `ObjectStorageHandler._append_to_s3` does GET-then-PUT without locking. Concurrent processes (multiple gateway workers) can clobber each other's batches. Activity feed reads from these files.
**Mitigation:** Fixed in B-7 by including `pid + 6-char uuid` in file path. Reader globs `{HH}00Z*.jsonl` and merges by timestamp.
**Owner:** Backend.
**Status:** Closed (B-7 merged on 2026-05-05).

### R-3 — Schema assumptions unverified
**Severity:** Medium
**Description:** v2 design assumes specific shapes for `TaskNode.update_log[]`, `CheckinNode`, `agent_channel_identities` table, `escalation_queue` table. None has been verified against current graph/migration code.
**Mitigation:** M-A pre-flight audit step:
```bash
# In graphclaw repo:
grep -rn "update_log" src/graphclaw/db/ src/graphclaw/agent/
grep -rn "CheckinNode\|create_checkin" src/graphclaw/db/
ls migrations/ | grep -i "channel_identities\|escalation_queue"
```
If any check fails, escalate as gateway change before consuming.
**Owner:** First engineer to start M-A.
**Status:** Open.

### R-4 — Activity range query performance
**Severity:** Low (Phase B), High (Phase C if data volume grows)
**Description:** Each `/agent/activity` request scans MinIO files for the time window. For "Last 7 days" with hourly files = 168 files per service per user. With 3 services that's 504 files.
**Mitigation:** Hard cap of 50 files scanned per request (returns 400 with `range_too_large` for larger). Cockpit suggests narrower range. Phase C: add Postgres summary index, or move to columnar storage.
**Owner:** Backend.
**Status:** Mitigated; revisit if user complaints.

### R-5 — No retention policy on MinIO logs
**Severity:** Low (cost), Medium (privacy/compliance)
**Description:** Logs accumulate forever. Gap 4 from brainstorm.
**Mitigation:** Phase C task — nightly worker that gzips files > 7 days old, deletes > 30 days. Track in Phase C backlog.
**Owner:** Backend.
**Status:** Deferred to Phase C.

### R-6 — `cost_usd = 0.0` across all LLM providers
**Severity:** Low (cosmetic), Medium (admin reporting)
**Description:** Gap 3 from brainstorm. Token counts work; cost calculation isn't implemented in any provider.
**Mitigation:** v2 deliberately doesn't surface cost columns anywhere. Tokens shown where available; cost columns not introduced until provider gap closed.
**Owner:** Backend / providers team.
**Status:** Deferred to Phase C.

### R-7 — `/scoring/simulate` and `/agents/delegations` may not exist
**Severity:** Medium
**Description:** v2 design references both. Existence not verified.
**Mitigation:** B-8 + B-9 verification gates before M-G-3 / M-H-4. If missing, add minimal implementations.
**Owner:** Backend (B-8/B-9), Frontend (escalation if blocking).
**Status:** Open until verified.

### R-8 — localStorage bridge for ticker may exceed quota
**Severity:** Low
**Description:** Ring buffer of 20 events × ~500 bytes = 10KB per day. Manageable, but if event count grows, could hit 5MB localStorage cap.
**Mitigation:** Cap stored array at 20 entries; clear keys older than today.
**Owner:** Frontend.
**Status:** Mitigated by design.

### R-9 — Wave 5 stub may have unexpected consumers
**Severity:** Medium
**Description:** Old `src/features/agent/` and `src/features/scoring/` may be imported from places not surfaced by simple grep (dynamic imports, route lazy-loading).
**Mitigation:** M-A-0 audit checks:
```bash
grep -rn "from '@/features/agent\b" src/
grep -rn "lazy.*agent\|lazy.*scoring" src/
grep -rn "ScoreExplainer\|AgentMonitorPage" src/ e2e/
```
Verify all e2e tests still pass after migration.
**Owner:** First engineer to start M-A.
**Status:** Open.

### R-10 — SSE reconnect storms during gateway restarts
**Severity:** Low
**Description:** When gateway restarts, all clients reconnect simultaneously. Existing `src/lib/sse.ts` should already handle exponential backoff; verify before relying on it for live ticker.
**Mitigation:** Read `sse.ts` to confirm reconnect strategy. If absent, add jittered exponential backoff (already a known pattern in the codebase).
**Owner:** Frontend.
**Status:** Verify during M-B-3.

### R-11 — `update_log[]` may grow unboundedly per task
**Severity:** Medium long-term
**Description:** Every inbound message appends to `TaskNode.update_log[]`. Long-running tasks could have hundreds of entries. Inbound log query unwinds this and may slow.
**Mitigation:** Phase B: add Cypher `LIMIT` early in query. Phase C: add task-level archival of old update_log entries.
**Owner:** Backend.
**Status:** Mitigated for Phase B; long-term watch.

### R-12 — Channel display name resolution may fail
**Severity:** Low
**Description:** `agent_channel_identities` may not have an entry for every counterparty. Fallback to `User-{lastFour}` is ugly.
**Mitigation:** Fallback chain documented in B-6. UI shows fallback gracefully (no error). Phase C: nightly job to backfill identity rows from CheckinNode history.
**Owner:** Backend.
**Status:** Mitigated.

---

## 2. Closed / mitigated risks

### C-1 — Existing Wave 5 IA collision
**Resolved by:** M-A-0 retirement plan + build-plan.md supersession marker.

### C-2 — Phase A activity panel had no data source
**Resolved by:** Moving `GET /agent/activity` from Phase B to Phase A (per user decision 2026-05-03).

### C-3 — Tool calls only logged in main_orchestrator
**Resolved by:** B-1 expansion to all 5 agent files (main_orchestrator, sub_agent_runner, comms_agent, inbound_agent, outbound_agent).

---

## 3. Open decisions (need resolution before implementation)

| Decision | Default if not addressed | Owner | Deadline |
|----------|--------------------------|-------|----------|
| Migration number for `agent_session_log` | Use next available (B-0) | Backend at B-2 start | Before B-2 |
| Should attention dismissals be per-user-server-side? | localStorage 24h TTL (current design) | Product | Before M-A-3 |
| Deep-link from Activity row → trace view? | No (Phase C) | Product | Phase C |
| Should `Run Now` require confirmation? | No (single click, toast on success) | Product | Before M-E-1 |
| Comms 30-day filter — feasible with current MinIO scan limits? | Cap at 7d for Phase B; revisit | Product+Backend | Before M-D-1 |
| Should the user be able to edit a task's autonomy level from the Scoring panel? | No (read-only here; edit via Settings) | Product | Before M-G-1 |

---

## 4. Things explicitly NOT in scope

(Repeated from `00-design-overview.md` for emphasis.)

- Admin observability surfaces (CloudWatch viewers, structured log browser).
- Cost monitoring — blocked by provider gap.
- Distributed trace waterfall.
- Mobile / tablet polish below 768px.
- Chat / agent persona configuration.
- Memory / skills catalog editing.

---

## 5. How to add a risk

When you find a new risk during implementation:
1. Add an `R-XX` entry above with severity, description, mitigation, owner, status.
2. Cross-reference from the affected wave doc / commit message.
3. Don't put risks in PR comments — they get lost.
4. When mitigated, move to "Closed / mitigated" section. Do not delete.
