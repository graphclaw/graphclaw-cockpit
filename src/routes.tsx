import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/features/auth';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

// Lazy-loaded page components
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const SettingsLayout = lazy(() =>
  import('@/features/settings/SettingsLayout').then((m) => ({ default: m.SettingsLayout })),
);
const GoalViewPage = lazy(() =>
  import('@/features/graph/GoalViewPage').then((m) => ({ default: m.GoalViewPage })),
);
const MyTasksPage = lazy(() =>
  import('@/features/tasks/MyTasksPage').then((m) => ({ default: m.MyTasksPage })),
);
const ProjectsPage = lazy(() =>
  import('@/features/graph/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
);
const TimelinePage = lazy(() =>
  import('@/features/graph/TimelinePage').then((m) => ({ default: m.TimelinePage })),
);
const WorkforcePage = lazy(() =>
  import('@/features/workforce/WorkforcePage').then((m) => ({ default: m.WorkforcePage })),
);
const AgentMonitorPage = lazy(() =>
  import('@/features/agent/AgentMonitorPage').then((m) => ({ default: m.AgentMonitorPage })),
);
const ChannelsPage = lazy(() =>
  import('@/features/settings/ChannelsPage').then((m) => ({ default: m.ChannelsPage })),
);
const LlmPage = lazy(() =>
  import('@/features/settings/LlmPage').then((m) => ({ default: m.LlmPage })),
);
const ScoringPage = lazy(() =>
  import('@/features/settings/ScoringPage').then((m) => ({ default: m.ScoringPage })),
);
const BriefingPage = lazy(() =>
  import('@/features/settings/BriefingPage').then((m) => ({ default: m.BriefingPage })),
);
const TriggersPage = lazy(() =>
  import('@/features/settings/TriggersPage').then((m) => ({ default: m.TriggersPage })),
);
const A2aPage = lazy(() =>
  import('@/features/settings/A2aPage').then((m) => ({ default: m.A2aPage })),
);
const DangerZonePage = lazy(() =>
  import('@/features/settings/DangerZonePage').then((m) => ({ default: m.DangerZonePage })),
);
const SkillsPage = lazy(() =>
  import('@/features/skills/SkillsPage').then((m) => ({ default: m.SkillsPage })),
);
const McpRegistryPage = lazy(() =>
  import('@/features/mcp/McpRegistryPage').then((m) => ({ default: m.McpRegistryPage })),
);
const CanvasEditorPage = lazy(() =>
  import('@/features/canvas/CanvasEditorPage').then((m) => ({ default: m.CanvasEditorPage })),
);
const IntelligenceLayout = lazy(() =>
  import('@/features/intelligence/IntelligenceLayout').then((m) => ({
    default: m.IntelligenceLayout,
  })),
);
const AgentProfilePage = lazy(() =>
  import('@/features/intelligence/AgentProfilePage').then((m) => ({
    default: m.AgentProfilePage,
  })),
);
const WorkingMemoryPage = lazy(() =>
  import('@/features/intelligence/WorkingMemoryPage').then((m) => ({
    default: m.WorkingMemoryPage,
  })),
);
const EpisodicMemoryPage = lazy(() =>
  import('@/features/intelligence/EpisodicMemoryPage').then((m) => ({
    default: m.EpisodicMemoryPage,
  })),
);
const SemanticMemoryPage = lazy(() =>
  import('@/features/intelligence/SemanticMemoryPage').then((m) => ({
    default: m.SemanticMemoryPage,
  })),
);
const SkillAuthoringPage = lazy(() =>
  import('@/features/intelligence/SkillAuthoringPage').then((m) => ({
    default: m.SkillAuthoringPage,
  })),
);
const PoliciesPanel = lazy(() =>
  import('@/features/intelligence/PoliciesPanel').then((m) => ({
    default: m.PoliciesPanel,
  })),
);
const ChatPage = lazy(() =>
  import('@/features/chat/ChatPage').then((m) => ({ default: m.ChatPage })),
);
const AdminLayout = lazy(() =>
  import('@/features/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const MembersPage = lazy(() =>
  import('@/features/admin/MembersPage').then((m) => ({ default: m.MembersPage })),
);
const FeaturesPage = lazy(() =>
  import('@/features/admin/FeaturesPage').then((m) => ({ default: m.FeaturesPage })),
);
const LlmConfigPage = lazy(() =>
  import('@/features/admin/LlmConfigPage').then((m) => ({ default: m.LlmConfigPage })),
);
const JudgePage = lazy(() =>
  import('@/features/admin/JudgePage').then((m) => ({ default: m.JudgePage })),
);
const GuardrailsPage = lazy(() =>
  import('@/features/admin/GuardrailsPage').then((m) => ({ default: m.GuardrailsPage })),
);
const SsoPage = lazy(() =>
  import('@/features/admin/SsoPage').then((m) => ({ default: m.SsoPage })),
);
const AuditPage = lazy(() =>
  import('@/features/admin/AuditPage').then((m) => ({ default: m.AuditPage })),
);
const InfraPage = lazy(() =>
  import('@/features/admin/InfraPage').then((m) => ({ default: m.InfraPage })),
);
const ConnectorsPage = lazy(() =>
  import('@/features/admin/ConnectorsPage').then((m) => ({ default: m.ConnectorsPage })),
);
const MarketplacePolicyPage = lazy(() =>
  import('@/features/admin/MarketplacePolicyPage').then((m) => ({ default: m.MarketplacePolicyPage })),
);
const GraphExplorerPage = lazy(() =>
  import('@/features/graph-explorer/GraphExplorerPage').then((m) => ({ default: m.GraphExplorerPage })),
);

function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route
            element={
              <RequireAuth>
                <AppShell>
                  <ErrorBoundary>
                    <Suspense fallback={<SuspenseFallback />}>
                      <Routes>
                        {/* Workspace */}
                        <Route index element={<DashboardPage />} />
                        <Route path="tasks" element={<MyTasksPage />} />
                        <Route path="goals" element={<GoalViewPage />} />
                        <Route path="projects" element={<ProjectsPage />} />
                        <Route path="timeline" element={<TimelinePage />} />
                        <Route path="people" element={<Navigate to="/workforce" replace />} />
                        <Route path="workforce" element={<WorkforcePage />} />
                        <Route path="graph-explorer" element={<GraphExplorerPage />} />

                        {/* Intelligence */}
                        <Route path="agent-monitor" element={<AgentMonitorPage />} />
                        <Route path="chat" element={<ChatPage />} />
                        <Route path="skills" element={<SkillsPage />} />
                        <Route path="mcp" element={<McpRegistryPage />} />
                        <Route path="canvas" element={<CanvasEditorPage />} />
                        <Route path="intelligence" element={<IntelligenceLayout />}>
                          <Route path="profile" element={<AgentProfilePage />} />
                          <Route path="working-memory" element={<WorkingMemoryPage />} />
                          <Route path="episodic-memory" element={<EpisodicMemoryPage />} />
                          <Route path="semantic-memory" element={<SemanticMemoryPage />} />
                          <Route path="skill-authoring" element={<SkillAuthoringPage />} />
                          <Route path="policies" element={<PoliciesPanel />} />
                        </Route>

                        {/* Settings */}
                        <Route path="settings" element={<SettingsLayout />}>
                          <Route index element={<Navigate to="channels" replace />} />
                          <Route path="channels" element={<ChannelsPage />} />
                          <Route path="llm" element={<LlmPage />} />
                          <Route path="scoring" element={<ScoringPage />} />
                          <Route path="briefing" element={<BriefingPage />} />
                          <Route path="triggers" element={<TriggersPage />} />
                          <Route path="a2a" element={<A2aPage />} />
                          <Route path="danger" element={<DangerZonePage />} />
                        </Route>

                        {/* Admin */}
                        <Route
                          path="admin"
                          element={
                            <RequireAuth requiredRole="ADMIN">
                              <AdminLayout />
                            </RequireAuth>
                          }
                        >
                          <Route path="members" element={<MembersPage />} />
                          <Route path="features" element={<FeaturesPage />} />
                          <Route path="llm-config" element={<LlmConfigPage />} />
                          <Route path="judge" element={<JudgePage />} />
                          <Route path="guardrails" element={<GuardrailsPage />} />
                          <Route path="sso" element={<SsoPage />} />
                          <Route path="audit" element={<AuditPage />} />
                          <Route path="infra" element={<InfraPage />} />
                          <Route path="connectors" element={<ConnectorsPage />} />
                          <Route path="marketplace" element={<MarketplacePolicyPage />} />
                        </Route>

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </AppShell>
              </RequireAuth>
            }
            path="/*"
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
