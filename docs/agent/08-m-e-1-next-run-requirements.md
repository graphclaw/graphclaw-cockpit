# M-E-1 Requirements - Scheduling Next Run Card

Status: Completed
Date: 2026-05-03
Wave: M-E-1

## References
- Build tracker: ../../build-plan.md (Wave M checklist)
- Wave detail: ./02-wave-plan.md (M-E-1)
- Component contract: ./03-component-spec.md
- API contract: ./04-api-contract.md (GET /agent/triggers/schedule, POST /agent/triggers/{id}/fire)
- Product requirement: ../prd/03-agent-monitor.md
- Wireframe: ../../wireframes-v2/pages/agent-monitor-v2.html

## Objective
Ship scheduling panel Next Run card with manual Run Now action and clear user feedback.

## Functional Requirements
1. Render a scheduling card on /agent-monitor/scheduling.
2. Read trigger schedule via useAgentTriggers and select next trigger by earliest next fire timestamp.
3. Display trigger name and upcoming run time details.
4. Trigger Run Now using POST /app/v1/agent/triggers/{id}/fire.
5. Disable Run Now while mutation is pending.
6. Show success and failure toast feedback for action outcome.
7. Preserve placeholder state for not-yet-shipped M-E-2/M-E-3 content.

## Data and UX Requirements
1. Empty triggers: render "No schedule configured" state with helper copy.
2. Invalid/missing next-fire timestamp: render "Scheduled" fallback.
3. Run Now requires a valid trigger id.
4. After success, invalidate agent status and trigger schedule queries.

## Test Requirements
1. Unit test for populated schedule card.
2. Unit test for empty trigger schedule fallback.
3. Unit test for Run Now click behavior and pending state.
4. Page integration test asserting scheduling panel content.
5. Playwright assertion for scheduling route panel + Run Now control.

## Validation Plan
1. Focused vitest run for scheduling component and page route tests.
2. Playwright browser run for e2e/agent/agent-monitor.spec.ts.
3. Typecheck and scoped lint for changed files.
