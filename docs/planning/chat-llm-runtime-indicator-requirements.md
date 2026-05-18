# Chat LLM Runtime Indicator Requirements (2026-05-18)

## References
- docs/prd/05-settings-panel.md (Section 5.3 LLM Provider Configuration)
- docs/prd/13-chat-interface.md (Chat header/real-time UX expectations)
- docs/planning/build-plan.md (active task tracking)

## Problem Statement
Users can enter LLM provider API keys in Settings, but it is unclear how those keys affect live chat execution.
In Chat, users also cannot see which provider/model is currently used by the backend agent.

## Requirements
1. Expose runtime LLM metadata from backend chat API:
- Provider name
- Model name
- Connection availability flag

2. Display runtime LLM metadata in Chat header:
- Show provider and model next to the existing Online badge
- Keep UI concise and readable on desktop and mobile

3. Keep behavior safe for degraded environments:
- If agent loop is unavailable, return a stable payload with connected=false
- Frontend must render a fallback label (not crash)

4. Clarify current BYOK behavior:
- User-level BYOK key storage remains secrets-only unless separately wired into LLM client construction
- Runtime indicator should reflect actual runtime client, not only user preference

## Edge Cases
- Agent loop exists but model/provider cannot be introspected -> show unknown fallback values
- Tests without runtime endpoint mocks -> avoid hard failures (optional rendering)

## Validation
- Frontend unit tests for Chat continue passing
- Backend endpoint returns JSON in both connected and disconnected states
- Manual check: /chat header includes provider/model badge
