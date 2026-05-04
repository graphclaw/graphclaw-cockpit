# M-F-1 Requirements - Skills Worker Pool

Status: Completed
Date: 2026-05-03
Wave: M-F-1

## References
- Build tracker: ../../build-plan.md (Wave M checklist)
- Wave detail: ./02-wave-plan.md (M-F-1)
- Data source: ./01-data-sources.md (/app/v1/skills/workers)
- Product requirement: ../prd/03-agent-monitor.md
- Wireframe: ../../wireframes-v2/pages/agent-monitor-v2.html

## Objective
Ship the Skills panel worker-pool visibility surface with utilization health, worker cards, stale indicators, and expand/collapse behavior.

## Functional Requirements
1. Render skills worker panel on /agent-monitor/skills.
2. Compute utilization from worker statuses and render threshold color:
   - green: < 75%
   - amber: 75-90%
   - red: > 90%
3. Render up to 4 worker mini-cards (2x2) by default.
4. Add Show all / Show less toggle when workers exceed 4.
5. Render per-worker card with worker label, current job chip, and stale pill.
6. Mark stale when last heartbeat is older than 900s.
7. Preserve forward placeholder for M-F-2 recent jobs table.

## Data Notes
Current backend /skills/workers returns worker status snapshots (worker_id, state, current_job_id, last_heartbeat, jobs_completed, jobs_failed).
Heartbeat history buckets are not currently provided; sparkline bars will use deterministic status/counter-derived fallback in this phase.

## Test Requirements
1. Unit test for utilization color thresholds.
2. Unit test for stale-worker pill and visual marker.
3. Unit test for Show all toggle behavior.
4. Page integration test for skills route wiring.
5. Playwright assertion for skills route panel rendering.

## Validation Plan
1. Focused vitest run for Skills panel component and AgentMonitor page tests.
2. Playwright run for e2e/agent/agent-monitor.spec.ts.
3. Typecheck and scoped lint on changed files.
