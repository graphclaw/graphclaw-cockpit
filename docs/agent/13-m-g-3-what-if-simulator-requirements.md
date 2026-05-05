# M-G-3 Requirements - What-if Simulator Modal

## Requirement

Deliver the Scoring panel What-if Simulator modal for Wave M-G-3, with debounced score preview from `/app/v1/scoring/simulate`.

## Source References

- `build-plan.md` (Wave M, M-G-3)
- `docs/agent/02-wave-plan.md` (M-G-3 details)
- `docs/agent/03-component-spec.md` (WhatIfSimulator contract)
- `docs/prd/03-agent-monitor.md` (Section 7.3)
- Backend contract: `graphclaw/src/graphclaw/api/scoring.py` (`SimulateRequest`, `/simulate`)

## Functional Requirements

1. Add a What-if simulator modal in the Scoring panel (invoked from factor side panel).
2. Modal exposes 7 controls (one per factor):
   - timeline urgency (days),
   - dependency weight (count),
   - critical path (toggle),
   - blocker (toggle),
   - human override priority,
   - resource risk,
   - constraint pressure.
3. Trigger `POST /app/v1/scoring/simulate` with 300ms debounce after control changes.
4. Request payload uses `task_id` and normalized `modified_factors` keys matching backend.
5. Modal shows preview-only banner: `Preview only - no changes are saved.`
6. Show score delta text: `Score would change from X -> Y (+/-Z)`.
7. Handle loading/error states in modal without leaving stale values.

## Edge Cases

- Selected task may not have complete baseline factors.
- Slider/toggle normalization must keep values in valid numeric ranges.
- Debounced requests should not run when modal is closed.
- Simulation endpoint can return 404/500; error should be visible in modal.

## Verification Plan

- Component tests (`WhatIfSimulator.test.tsx`):
  - renders all 7 controls,
  - debounced simulate call payload mapping,
  - score delta and preview banner rendering,
  - error state rendering.
- Integration test (`ScoreFactorBreakdown.test.tsx`):
  - selected task shows open-simulator control.
- Playwright (`e2e/agent/agent-monitor.spec.ts`):
  - scoring panel exposes factor breakdown state and simulator entrypoint when tasks exist.

## Status

- Planned: 2026-05-05
- Completed: 2026-05-05

## Validation Results

- `npm test -- src/features/agent-monitor/components/WhatIfSimulator.test.tsx src/features/agent-monitor/components/ScoreFactorBreakdown.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx` (pass)
- `npm run typecheck` (pass)
- `npx playwright test e2e/agent/agent-monitor.spec.ts` (pass)
- `node scripts/check-test-headers.mjs --files src/features/agent-monitor/components/WhatIfSimulator.test.tsx src/features/agent-monitor/components/ScoreFactorBreakdown.test.tsx src/features/agent-monitor/AgentMonitorPage.test.tsx e2e/agent/agent-monitor.spec.ts` (pass)
