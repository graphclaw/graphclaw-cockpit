# M-G-2 Requirements - Factor Breakdown Side Panel

## Requirement

Deliver the scoring factor breakdown side panel for Wave M-G-2 on `/agent-monitor/scoring` with lazy task-detail loading from `/app/v1/scoring/tasks/{task_id}`.

## Source References

- `build-plan.md` (Wave M, M-G-2)
- `docs/agent/02-wave-plan.md` (M-G-2 details)
- `docs/agent/03-component-spec.md` (ScoringPanel and ScoreFactorBreakdown contracts)
- `docs/prd/03-agent-monitor.md` (Section 7.2)
- `TESTING.md`

## Functional Requirements

1. Scoring right panel renders `ScoreFactorBreakdown` tied to selected row from scoring table.
2. The panel lazy loads task score detail with `useTaskScore(taskId)` only when a task is selected.
3. Render all factor rows from the backend payload with:
   - factor label,
   - weight,
   - raw score,
   - weighted contribution,
   - mini progress bar.
4. Render plain-language explanation sentence above factors.
5. When no task is selected, show explicit placeholder empty state.
6. Handle loading and error states with panel primitives.
7. Keep split layout behavior: side panel below table under narrow viewports.

## Edge Cases

- Selected task can return missing/empty factors.
- Factor names may vary by formatting (snake_case/title case).
- Explanation field may be absent; provide fallback sentence.
- Scores/weights outside expected range should not crash rendering.

## Verification Plan

- Component tests (`ScoreFactorBreakdown.test.tsx`):
  - empty state with no task selected,
  - loading + error handling,
  - mapped factor rows and explanation rendering.
- Route test (`AgentMonitorPage.test.tsx`):
  - scoring route renders both table and factor panel component.
- Playwright (`e2e/agent/agent-monitor.spec.ts`):
  - scoring route shows scoring table state and side panel state.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05

## Validation Results

- `npm test -- src/features/agent-monitor/components/ScoreFactorBreakdown.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx` (pass)
- `npm run typecheck` (pass)
- `npx playwright test e2e/agent/agent-monitor.spec.ts` (pass)
- `node scripts/check-test-headers.mjs --files src/features/agent-monitor/components/ScoreFactorBreakdown.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx e2e/agent/agent-monitor.spec.ts` (pass)
