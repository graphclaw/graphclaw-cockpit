import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/common/KpiCard';
import { Activity, CheckCircle, Clock, AlertTriangle, Target } from 'lucide-react';
import { useAgentStatus, useActionQueue, useTasks, useGoals, useApprovals } from '@/lib/api-hooks';

export function DashboardPage() {
  const { data: agent } = useAgentStatus();
  const { data: queue = [] } = useActionQueue();
  const { data: tasks } = useTasks();
  const { data: goals } = useGoals();
  const { data: approvals = [] } = useApprovals();

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4" data-testid="dashboard-kpi">
        <KpiCard
          label="Agent State"
          value={agent?.running ? 'Running' : 'Idle'}
          icon={<Activity size={16} />}
        />
        <KpiCard
          label="Tasks"
          value={tasks?.total ?? 0}
          icon={<CheckCircle size={16} />}
        />
        <KpiCard
          label="Goals"
          value={goals?.total ?? 0}
          icon={<Target size={16} />}
        />
        <KpiCard
          label="Pending Approvals"
          value={approvals.length}
          icon={<AlertTriangle size={16} />}
        />
      </div>

      {/* Action Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No actions queued.</p>
          ) : (
            <div className="space-y-2" data-testid="action-queue">
              {queue.slice(0, 5).map((item, i) => (
                <div
                  key={item.node_id}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[var(--text-tertiary)]">#{i + 1}</span>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {item.node_id}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {item.recommended_action} · score {item.final_score.toFixed(3)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {item.autonomy_level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <div>
              <div className="text-[var(--text-tertiary)]">Running</div>
              <div className="font-semibold text-[var(--text-primary)]">
                {agent?.running ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <div className="text-[var(--text-tertiary)]">Queue Depth</div>
              <div className="font-semibold text-[var(--text-primary)]">
                {agent?.queue_depth ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[var(--text-tertiary)]">Version</div>
              <div className="font-mono text-xs text-[var(--text-primary)]">
                {agent?.agent_version ?? 'unknown'}
              </div>
            </div>
            <div>
              <div className="text-[var(--text-tertiary)]">Last Cycle</div>
              <div className="text-xs text-[var(--text-secondary)]">
                {agent?.last_cycle_at
                  ? new Date(agent.last_cycle_at).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      {approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock size={16} />
              Pending Approvals ({approvals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2" data-testid="approvals-list">
              {approvals.map((a) => (
                <div
                  key={a.task_id}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{a.title}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{a.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
