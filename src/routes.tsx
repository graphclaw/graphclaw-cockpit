import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/features/auth';
import { SkeletonPage } from '@/components/feedback/SkeletonPage';

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
const AgentMonitorPage = lazy(() =>
  import('@/features/agent/AgentMonitorPage').then((m) => ({ default: m.AgentMonitorPage })),
);

// Skeleton page factory for unbuilt routes
function skeleton(title: string) {
  return <SkeletonPage title={title} />;
}

function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route
          element={
            <RequireAuth>
              <AppShell>
                <Suspense fallback={<SuspenseFallback />}>
                  <Routes>
                    {/* Workspace */}
                    <Route index element={<DashboardPage />} />
                    <Route path="tasks" element={<MyTasksPage />} />
                    <Route path="goals" element={<GoalViewPage />} />
                    <Route path="projects" element={skeleton('Projects')} />
                    <Route path="timeline" element={skeleton('Timeline')} />
                    <Route path="people" element={skeleton('People')} />

                    {/* Intelligence */}
                    <Route path="agent-monitor" element={<AgentMonitorPage />} />
                    <Route path="chat" element={skeleton('Chat')} />
                    <Route path="skills" element={skeleton('Skills')} />
                    <Route path="mcp" element={skeleton('MCP Registry')} />
                    <Route path="canvas" element={skeleton('Canvas Editor')} />
                    <Route path="intelligence/*" element={skeleton('Intelligence Hub')} />

                    {/* Settings */}
                    <Route path="settings" element={<SettingsLayout />}>
                      <Route index element={<Navigate to="channels" replace />} />
                      <Route path="channels" element={skeleton('Channels')} />
                      <Route path="llm" element={skeleton('LLM Providers')} />
                      <Route path="scoring" element={skeleton('Scoring Weights')} />
                      <Route path="briefing" element={skeleton('Briefing Schedule')} />
                      <Route path="triggers" element={skeleton('Triggers')} />
                      <Route path="a2a" element={skeleton('Agent-to-Agent Keys')} />
                      <Route path="danger" element={skeleton('Danger Zone')} />
                    </Route>

                    {/* Admin */}
                    <Route
                      path="admin/*"
                      element={
                        <RequireAuth requiredRole="ADMIN">
                          {skeleton('Admin Panel')}
                        </RequireAuth>
                      }
                    />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </AppShell>
            </RequireAuth>
          }
          path="/*"
        />
      </Routes>
    </Suspense>
  );
}
