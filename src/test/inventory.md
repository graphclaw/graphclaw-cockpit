# Test Inventory — src/test (unit + component)

| ID | Scenario (1 line) | File |
|---|---|---|
| GC-S-SCO-W50-001 | Scoring panel should show ranked action-queue tasks, allow sorting, and expos... | [../features/agent-monitor/components/ScoringTaskTable.test.tsx](../features/agent-monitor/components/ScoringTaskTable.test.tsx) |
| GC-S-SCO-W50-002 | The scoring side panel should stay empty until a task is selected, then load ... | [../features/agent-monitor/components/ScoreFactorBreakdown.test.tsx](../features/agent-monitor/components/ScoreFactorBreakdown.test.tsx) |
| GC-S-SCO-W50-003 | The what-if modal should expose all seven controls and send a debounced `/sco... | [../features/agent-monitor/components/WhatIfSimulator.test.tsx](../features/agent-monitor/components/WhatIfSimulator.test.tsx) |
| GC-S-SKL-W50-001 | Skills panel should show the most recent completed jobs and convert backend f... | [../features/agent-monitor/components/SkillsRecentJobsTable.test.tsx](../features/agent-monitor/components/SkillsRecentJobsTable.test.tsx) |
| GC-S-TSK-W50-001 | URL-driven navigation should render the expected panel components, including ... | [../features/agent-monitor/AgentMonitorPage.test.tsx](../features/agent-monitor/AgentMonitorPage.test.tsx) |
| GC-S-TSK-W50-010 | Timeline rows should render from runner payload, color stale heartbeats, and ... | [../features/agent-monitor/components/HeartbeatTimeline.test.tsx](../features/agent-monitor/components/HeartbeatTimeline.test.tsx) |
| GC-S-TSK-W50-011 | Agents delegations table should show key columns and row emphasis for stale h... | [../features/agent-monitor/components/ActiveDelegationsTable.test.tsx](../features/agent-monitor/components/ActiveDelegationsTable.test.tsx) |
| GC-S-TSK-W50-012 | Dispatch plan panel should resolve an active session from delegations, fetch ... | [../features/agent-monitor/components/DispatchPlanViz.test.tsx](../features/agent-monitor/components/DispatchPlanViz.test.tsx) |
| GC-S-TSK-W50-013 | Scheduling panel run history should render session rows from `/agent/sessions... | [../features/agent-monitor/components/SchedulingRunHistoryTable.test.tsx](../features/agent-monitor/components/SchedulingRunHistoryTable.test.tsx) |
| GC-S-WRK-W50-001 | Agents panel should show pool KPI cards from pool status data and gracefully ... | [../features/agent-monitor/components/AgentsPoolKpis.test.tsx](../features/agent-monitor/components/AgentsPoolKpis.test.tsx) |
| GC-U-SKL-W50-001 | Failed skill jobs should show concise human-readable error text in the skills... | [../features/agent-monitor/lib/formatSkillError.test.ts](../features/agent-monitor/lib/formatSkillError.test.ts) |
| TODO | (no header) ThemePicker.test.tsx | [../components/common/ThemePicker.test.tsx](../components/common/ThemePicker.test.tsx) |
| TODO | (no header) Sidebar.test.tsx | [../components/layout/Sidebar.test.tsx](../components/layout/Sidebar.test.tsx) |
| TODO | (no header) Topbar.test.tsx | [../components/layout/Topbar.test.tsx](../components/layout/Topbar.test.tsx) |
| TODO | (no header) AuditPage.test.tsx | [../features/admin/AuditPage.test.tsx](../features/admin/AuditPage.test.tsx) |
| TODO | (no header) FeaturesPage.test.tsx | [../features/admin/FeaturesPage.test.tsx](../features/admin/FeaturesPage.test.tsx) |
| TODO | (no header) MembersPage.test.tsx | [../features/admin/MembersPage.test.tsx](../features/admin/MembersPage.test.tsx) |
| TODO | (no header) ActivityFeed.test.tsx | [../features/agent-monitor/components/ActivityFeed.test.tsx](../features/agent-monitor/components/ActivityFeed.test.tsx) |
| TODO | (no header) AttentionStrip.test.tsx | [../features/agent-monitor/components/AttentionStrip.test.tsx](../features/agent-monitor/components/AttentionStrip.test.tsx) |
| TODO | (no header) ChannelBadge.test.tsx | [../features/agent-monitor/components/ChannelBadge.test.tsx](../features/agent-monitor/components/ChannelBadge.test.tsx) |
| TODO | (no header) CommsSummaryBanner.test.tsx | [../features/agent-monitor/components/CommsSummaryBanner.test.tsx](../features/agent-monitor/components/CommsSummaryBanner.test.tsx) |
| TODO | (no header) GlanceStrip.test.tsx | [../features/agent-monitor/components/GlanceStrip.test.tsx](../features/agent-monitor/components/GlanceStrip.test.tsx) |
| TODO | (no header) InboundCommsTable.test.tsx | [../features/agent-monitor/components/InboundCommsTable.test.tsx](../features/agent-monitor/components/InboundCommsTable.test.tsx) |
| TODO | (no header) LiveTicker.test.tsx | [../features/agent-monitor/components/LiveTicker.test.tsx](../features/agent-monitor/components/LiveTicker.test.tsx) |
| TODO | (no header) OutboundCommsTable.test.tsx | [../features/agent-monitor/components/OutboundCommsTable.test.tsx](../features/agent-monitor/components/OutboundCommsTable.test.tsx) |
| TODO | (no header) OverviewKpiStrip.test.tsx | [../features/agent-monitor/components/OverviewKpiStrip.test.tsx](../features/agent-monitor/components/OverviewKpiStrip.test.tsx) |
| TODO | (no header) PanelStates.test.tsx | [../features/agent-monitor/components/PanelStates.test.tsx](../features/agent-monitor/components/PanelStates.test.tsx) |
| TODO | (no header) SchedulingNextRunCard.test.tsx | [../features/agent-monitor/components/SchedulingNextRunCard.test.tsx](../features/agent-monitor/components/SchedulingNextRunCard.test.tsx) |
| TODO | (no header) SkillsWorkerPool.test.tsx | [../features/agent-monitor/components/SkillsWorkerPool.test.tsx](../features/agent-monitor/components/SkillsWorkerPool.test.tsx) |
| TODO | (no header) useActivityFeed.test.ts | [../features/agent-monitor/hooks/useActivityFeed.test.ts](../features/agent-monitor/hooks/useActivityFeed.test.ts) |
| TODO | (no header) formatEvent.test.ts | [../features/agent-monitor/lib/formatEvent.test.ts](../features/agent-monitor/lib/formatEvent.test.ts) |
| TODO | (no header) LoginPage.test.tsx | [../features/auth/LoginPage.test.tsx](../features/auth/LoginPage.test.tsx) |
| TODO | (no header) OrgSwitcher.test.tsx | [../features/auth/OrgSwitcher.test.tsx](../features/auth/OrgSwitcher.test.tsx) |
| TODO | (no header) RequireAuth.test.tsx | [../features/auth/RequireAuth.test.tsx](../features/auth/RequireAuth.test.tsx) |
| TODO | (no header) CanvasEditorPage.test.tsx | [../features/canvas/CanvasEditorPage.test.tsx](../features/canvas/CanvasEditorPage.test.tsx) |
| TODO | (no header) ChatView.test.tsx | [../features/chat/ChatView.test.tsx](../features/chat/ChatView.test.tsx) |
| TODO | (no header) GraphFilterPanel.test.tsx | [../features/graph-explorer/__tests__/GraphFilterPanel.test.tsx](../features/graph-explorer/__tests__/GraphFilterPanel.test.tsx) |
| TODO | (no header) NodeInspector.test.tsx | [../features/graph-explorer/__tests__/NodeInspector.test.tsx](../features/graph-explorer/__tests__/NodeInspector.test.tsx) |
| TODO | (no header) useGraphExplorerStore.test.ts | [../features/graph-explorer/__tests__/useGraphExplorerStore.test.ts](../features/graph-explorer/__tests__/useGraphExplorerStore.test.ts) |
| TODO | (no header) GoalViewPage.test.tsx | [../features/graph/GoalViewPage.test.tsx](../features/graph/GoalViewPage.test.tsx) |
| TODO | (no header) date-utils.test.ts | [../features/graph/timeline/date-utils.test.ts](../features/graph/timeline/date-utils.test.ts) |
| TODO | (no header) AgentProfilePage.test.tsx | [../features/intelligence/AgentProfilePage.test.tsx](../features/intelligence/AgentProfilePage.test.tsx) |
| TODO | (no header) EpisodicMemoryPage.test.tsx | [../features/intelligence/EpisodicMemoryPage.test.tsx](../features/intelligence/EpisodicMemoryPage.test.tsx) |
| TODO | (no header) PoliciesPanel.test.tsx | [../features/intelligence/PoliciesPanel.test.tsx](../features/intelligence/PoliciesPanel.test.tsx) |
| TODO | (no header) SemanticMemoryPage.test.tsx | [../features/intelligence/SemanticMemoryPage.test.tsx](../features/intelligence/SemanticMemoryPage.test.tsx) |
| TODO | (no header) SkillAuthoringPage.test.tsx | [../features/intelligence/SkillAuthoringPage.test.tsx](../features/intelligence/SkillAuthoringPage.test.tsx) |
| TODO | (no header) McpRegistryPage.test.tsx | [../features/mcp/McpRegistryPage.test.tsx](../features/mcp/McpRegistryPage.test.tsx) |
| TODO | (no header) ScoringPage.test.tsx | [../features/settings/ScoringPage.test.tsx](../features/settings/ScoringPage.test.tsx) |
| TODO | (no header) SkillsPage.test.tsx | [../features/skills/SkillsPage.test.tsx](../features/skills/SkillsPage.test.tsx) |
| TODO | (no header) CounterpartyConversations.test.tsx | [../features/tasks/components/CounterpartyConversations.test.tsx](../features/tasks/components/CounterpartyConversations.test.tsx) |
| TODO | (no header) TaskTable.test.tsx | [../features/tasks/TaskTable.test.tsx](../features/tasks/TaskTable.test.tsx) |
| TODO | (no header) WorkforceCard.test.tsx | [../features/workforce/components/WorkforceCard.test.tsx](../features/workforce/components/WorkforceCard.test.tsx) |
| TODO | (no header) useWorkforceData.test.tsx | [../features/workforce/hooks/useWorkforceData.test.tsx](../features/workforce/hooks/useWorkforceData.test.tsx) |
| TODO | (no header) WorkforcePage.test.tsx | [../features/workforce/WorkforcePage.test.tsx](../features/workforce/WorkforcePage.test.tsx) |
| TODO | (no header) errors.test.ts | [../lib/errors.test.ts](../lib/errors.test.ts) |
| TODO | (no header) auth.test.ts | [../stores/auth.test.ts](../stores/auth.test.ts) |
| TODO | (no header) theme.test.ts | [../stores/theme.test.ts](../stores/theme.test.ts) |
| TODO | (no header) timeline.test.ts | [../stores/timeline.test.ts](../stores/timeline.test.ts) |

_Last regenerated: 2026-05-05 by `scripts/regen-inventory.mjs`._
