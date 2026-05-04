# M-D-3 Requirements - Outbound Comms Tab

Status: Completed
Date: 2026-05-03
Wave: M-D-3

## References
- Build tracker: ../../build-plan.md (Wave M checklist)
- Wave detail: ./02-wave-plan.md (M-D-3)
- Component contract: ./03-component-spec.md (useOutboundLog + comms panel)
- API contract: ./04-api-contract.md (GET /app/v1/tasks/outbound-log)
- Product requirement: ../prd/03-agent-monitor.md
- Wireframe: ../../wireframes-v2/pages/agent-monitor-v2.html

## Objective
Ship the outbound communication audit tab at /agent-monitor/comms/outbound with production API data and graceful fallbacks.

## Functional Requirements
1. Render outbound table on outbound route using URL-driven tab state.
2. Query data from GET /app/v1/tasks/outbound-log with from/to/limit parameters.
3. Display columns: Time, Channel, To, Subject/Summary, Task, Status.
4. Show empty state copy when no outbound items are returned.
5. Show panel error state with retry on fetch failure.
6. Make task chip clickable only when task id exists.

## Data/Mapping Requirements
1. Support both snake_case and camelCase response keys for compatibility.
2. Time format is HH:MM:SS 24-hour; invalid/missing timestamps show --:--:--.
3. To display fallback order: toDisplay, to_display, to, then -.
4. Subject/Summary fallback order: subject, summary, then -.
5. Status fallback is Logged when value is missing.

## Test Requirements
1. Unit test for normal outbound row rendering.
2. Unit test for empty-state rendering.
3. Page test assertion for outbound panel wiring.
4. Playwright assertion that outbound route renders outbound-specific content.

## Edge Cases and Failure Modes
- Missing optional fields in response payload.
- Mixed response key casing.
- Rows without task id.
- Endpoint unavailable in partial environments.

## Validation Plan
1. Focused unit and integration tests for new outbound components.
2. Focused Playwright run for Agent Monitor comms routes.
3. Browser check against wireframe behavior for tab routing and table visibility.
