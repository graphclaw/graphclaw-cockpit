# M-G-1 Requirements - Task Score Table

## Requirement

Deliver the Scoring panel task table for Wave M-G-1 on `/agent-monitor/scoring` using live `/app/v1/agent/action-queue` data.

## Source References

- `build-plan.md` (Wave M, M-G-1)
- `docs/agent/02-wave-plan.md` (M-G-1 details)
- `TESTING.md`
- `docs/testing/test-strategy.md`
- `docs/testing/contributing-tests.md`

## Functional Requirements

1. Render a scoring table in the left column of the scoring split layout.
2. Fetch rows from `useActionQueue()` (`/app/v1/agent/action-queue`).
3. Table columns:
   - Rank
   - Task (task id/title fallback) + context chip
   - Score bar (`0` to `1`) and numeric score
   - Recommended action badge
   - Autonomy badge
4. Highlight top ranked row.
5. Support sorting by rank, score, and autonomy.
6. Clicking a row should mark it selected for factor drill-down handoff (state prepared for M-G-2).
7. Include empty/error/loading states with existing panel primitives.
8. Add stable test ids for table root and sortable headers.

## Edge Cases

- Empty queue should show explicit empty state.
- Unknown autonomy values should still be sortable and rendered with neutral badge.
- Missing/invalid scores should not crash rendering; normalize to `0`.
- Tie scores should remain deterministic via secondary rank sort.

## Verification Plan

- Unit/component tests:
  - renders sorted queue rows,
  - toggles sort direction,
  - highlights top row and selected row,
  - handles empty queue.
- Agent Monitor route test:
  - scoring route renders score table component.
- Playwright E2E:
  - `/agent-monitor/scoring` shows table or explicit empty copy.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05

## Validation Results

- `npm test -- src/features/agent-monitor/components/ScoringTaskTable.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx` (pass)
- `npm run typecheck` (pass)
- `npx playwright test e2e/agent/agent-monitor.spec.ts` (pass)
- `node scripts/check-test-headers.mjs --files src/features/agent-monitor/components/ScoringTaskTable.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx e2e/agent/agent-monitor.spec.ts` (pass)
