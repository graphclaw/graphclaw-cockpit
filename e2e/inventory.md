# Test Inventory — e2e

| ID | Scenario (1 line) | File |
|---|---|---|
| GC-E-CH-W11-001 | A user opens Settings → Channels, links their email and Telegram identities, ... | [settings/channels.spec.ts](settings/channels.spec.ts) |
| GC-E-CHT-W19-001 | User sends a message in /chat, the orchestrator streams tokens via SSE, the m... | [chat/chat-streaming.spec.ts](chat/chat-streaming.spec.ts) |
| GC-E-GRA-W19-001 | User navigates to /tasks, clicks a task row, sees the detail panel with title... | [graph/task-detail.spec.ts](graph/task-detail.spec.ts) |
| GC-E-GRA-W19-002 | User creates, edits, and deletes goals and tasks through the UI. | [graph/graph-editing.spec.ts](graph/graph-editing.spec.ts) |
| GC-E-MCP-W18-001 | Tests MCP server lifecycle: register, list, patch trust tier, disable, search... | [mcp/mcp-servers.spec.ts](mcp/mcp-servers.spec.ts) |
| GC-E-MEM-W17-001 | Proves the three-tier agent memory loop end-to-end through the cockpit and ba... | [memory/memory-lifecycle.spec.ts](memory/memory-lifecycle.spec.ts) |
| GC-E-NOT-W09-001 | User receives persistent notifications for domain events (task state changes,... | [notifications/notifications.spec.ts](notifications/notifications.spec.ts) |
| GC-E-OB-W11-001 | The test user's profile. | [onboarding/live-onboarding.spec.ts](onboarding/live-onboarding.spec.ts) |
| GC-E-OB-W11-007 | Verifies the OnboardingBanner shows only when needed, reflects the correct st... | [onboarding/onboarding-detection.spec.ts](onboarding/onboarding-detection.spec.ts) |
| GC-E-OB-W11-010 | Before onboarding the chat header shows the default "Main Orchestrator" label. | [onboarding/agent-naming.spec.ts](onboarding/agent-naming.spec.ts) |
| GC-E-OB-W11-012 | Backend-focused validation that the profile. | [onboarding/onboarding-minio-audit.spec.ts](onboarding/onboarding-minio-audit.spec.ts) |
| GC-E-PRF-W11-001 | The Settings profile page (or profile API) reflects the user's current name a... | [settings/profile.spec.ts](settings/profile.spec.ts) |
| GC-E-SCO-W50-001 | This suite creates deterministic scoring tasks, triggers live scoring cycles,... | [agent/scoring-reconciliation.spec.ts](agent/scoring-reconciliation.spec.ts) |
| GC-E-SKL-W18-001 | Tests skill lifecycle via /app/v1/skills: list, search, install, manage sourc... | [skills/skill-registry.spec.ts](skills/skill-registry.spec.ts) |
| GC-E-SKL-W18-002 | Tests the full Skills Marketplace UI: installed tab, browse remote, skill con... | [skills/skill-marketplace.spec.ts](skills/skill-marketplace.spec.ts) |
| GC-E-SKL-W50-001 | The Agent Monitor route shell resolves to the right section panel, and the sk... | [agent/agent-monitor.spec.ts](agent/agent-monitor.spec.ts) |
| TODO | (no header) a2a-keys.spec.ts | [a2a/a2a-keys.spec.ts](a2a/a2a-keys.spec.ts) |
| TODO | (no header) a2a-orchestrator-trigger.spec.ts | [a2a/a2a-orchestrator-trigger.spec.ts](a2a/a2a-orchestrator-trigger.spec.ts) |
| TODO | (no header) a2a-roundtrip.spec.ts | [a2a/a2a-roundtrip.spec.ts](a2a/a2a-roundtrip.spec.ts) |
| TODO | (no header) admin-panel.spec.ts | [admin/admin-panel.spec.ts](admin/admin-panel.spec.ts) |
| TODO | (no header) email-drafter-integration.spec.ts | [agent-workflow/email-drafter-integration.spec.ts](agent-workflow/email-drafter-integration.spec.ts) |
| TODO | (no header) scoring.spec.ts | [agent/scoring.spec.ts](agent/scoring.spec.ts) |
| TODO | (no header) canvas-editor.spec.ts | [canvas/canvas-editor.spec.ts](canvas/canvas-editor.spec.ts) |
| TODO | (no header) chat-fullpage.spec.ts | [chat/chat-fullpage.spec.ts](chat/chat-fullpage.spec.ts) |
| TODO | (no header) debug.spec.ts | [debug.spec.ts](debug.spec.ts) |
| TODO | (no header) auth-flow.spec.ts | [global/auth-flow.spec.ts](global/auth-flow.spec.ts) |
| TODO | (no header) dashboard.spec.ts | [global/dashboard.spec.ts](global/dashboard.spec.ts) |
| TODO | (no header) navigation.spec.ts | [global/navigation.spec.ts](global/navigation.spec.ts) |
| TODO | (no header) theme-toggle.spec.ts | [global/theme-toggle.spec.ts](global/theme-toggle.spec.ts) |
| TODO | (no header) goal-view.spec.ts | [graph/goal-view.spec.ts](graph/goal-view.spec.ts) |
| TODO | (no header) my-tasks.spec.ts | [graph/my-tasks.spec.ts](graph/my-tasks.spec.ts) |
| TODO | (no header) project-view.spec.ts | [graph/project-view.spec.ts](graph/project-view.spec.ts) |
| TODO | (no header) timeline-view.spec.ts | [graph/timeline-view.spec.ts](graph/timeline-view.spec.ts) |
| TODO | (no header) intelligence-hub.spec.ts | [intelligence/intelligence-hub.spec.ts](intelligence/intelligence-hub.spec.ts) |
| TODO | (no header) mcp-registry.spec.ts | [marketplace/mcp-registry.spec.ts](marketplace/mcp-registry.spec.ts) |
| TODO | (no header) google-oauth-onboarding.spec.ts | [onboarding/google-oauth-onboarding.spec.ts](onboarding/google-oauth-onboarding.spec.ts) |
| TODO | (no header) settings.spec.ts | [settings/settings.spec.ts](settings/settings.spec.ts) |
| TODO | (no header) aesthetic-baseline.spec.ts | [visual-audit/aesthetic-baseline.spec.ts](visual-audit/aesthetic-baseline.spec.ts) |

_Last regenerated: 2026-06-28 by `scripts/regen-inventory.mjs`._
