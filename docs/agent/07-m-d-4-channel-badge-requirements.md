# M-D-4 Requirements - Channel Badge Component

Status: Completed
Date: 2026-05-03
Wave: M-D-4

## References
- Build tracker: ../../build-plan.md (Wave M checklist)
- Wave detail: ./02-wave-plan.md (M-D-4)
- Component contract: ./03-component-spec.md (ChannelBadge)
- API contract: ./04-api-contract.md (channel fields in inbound/outbound logs)
- Product requirement: ../prd/03-agent-monitor.md (Comms inbound/outbound columns)
- Wireframe: ../../wireframes-v2/pages/agent-monitor-v2.html

## Objective
Add a reusable channel badge component and tokenized channel colors so inbound/outbound comms tables render consistent channel labels in light and dark themes.

## Functional Requirements
1. Add ChannelBadge component in src/features/agent-monitor/components.
2. Support known channels: email, cli, api, web.
3. Support unknown channel fallback with neutral style and text.
4. Replace plain channel text in inbound and outbound tables with ChannelBadge.
5. Preserve existing table behavior and route navigation.

## Styling Requirements
1. Add CSS variables in themes.css for root and dark theme:
   - --ch-email-bg, --ch-email-fg
   - --ch-cli-bg, --ch-cli-fg
   - --ch-api-bg, --ch-api-fg
   - --ch-web-bg, --ch-web-fg
2. Add neutral fallback variables for unknown channels.
3. Component must consume CSS variables, not hardcoded color values.

## Test Requirements
1. Unit test for ChannelBadge known and unknown channels.
2. Update inbound and outbound table tests to assert badge rendering.
3. Keep comms route page and E2E assertions green.

## Edge Cases and Failure Modes
- Mixed case channel values from API payload.
- Missing channel field.
- Dark theme contrast regressions.

## Validation Plan
1. Unit tests for ChannelBadge, inbound, outbound, and page route wiring.
2. Playwright run for Agent Monitor comms routes.
3. Visual browser check that channel badges render in both inbound and outbound routes.
