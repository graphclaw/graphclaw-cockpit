# M-F-2 Requirements — Recent Jobs Table

## Requirement

Deliver the Skills panel "Recent jobs" table for Wave M-F-2 with plain-language failure messaging and stable browser selectors.

## Source References

- `build-plan.md` (Wave M, M-F-2)
- `docs/agent/02-wave-plan.md` (M-F-2 details)
- `TESTING.md`
- `docs/testing/test-strategy.md`
- `docs/testing/contributing-tests.md`

## Functional Requirements

1. Render a recent jobs table on `/agent-monitor/skills` under worker-pool metrics.
2. Data source is `/app/v1/skills/workers` `completed_jobs` when present.
3. Show up to 20 latest jobs.
4. Include status, skill, task, completion time, tokens, and result/error summary.
5. Render tokens as number when available, otherwise `—`.
6. Failed rows use error styling (red-tinted row) and plain-language mapping.
7. Error mapping logic is centralized in `src/features/agent-monitor/lib/formatSkillError.ts`:
   - `TimeoutError` -> "timed out after Xs"
   - `ToolNotFound` -> "skill setup is missing - check Settings"
   - `ValidationError` -> "input validation failed"
   - fallback -> first 80 chars
8. If `completed_jobs` is absent or empty, show explicit no-jobs state.
9. Add stable test ids for table root and key cells.

## Edge Cases

- Backend may omit `completed_jobs` entirely.
- Jobs can have malformed timestamps; do not crash rendering.
- Error payload may be object/string/null.
- Unknown statuses should still render a neutral badge.

## Verification Plan

- Unit/component tests (Vitest + RTL):
  - happy-path rendering with mixed statuses,
  - failure mapping assertions,
  - tokens fallback,
  - empty state for missing `completed_jobs`.
- Agent Monitor integration test:
  - skills route still renders worker pool + recent jobs section.
- Playwright E2E:
  - `/agent-monitor/skills` shows recent jobs table or explicit no-jobs copy.
- Quality gates for this requirement commit:
  - `npm run typecheck`
  - `npm run lint`
  - focused Vitest for touched files
  - targeted Playwright agent-monitor spec

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05

## Validation Results

- `npm test -- src/features/agent-monitor/lib/formatSkillError.test.ts src/features/agent-monitor/components/SkillsRecentJobsTable.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx` (pass)
- `npm run typecheck` (pass)
- `npx playwright test e2e/agent/agent-monitor.spec.ts` (pass)
- `node scripts/regen-inventory.mjs` executed after test header updates (inventory files refreshed)
