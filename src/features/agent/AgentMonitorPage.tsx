import { KpiCard } from '@/components/common/KpiCard';
import { Activity, Clock, AlertTriangle, Zap } from 'lucide-react';
import { useAgentStatus, useActionQueue, useAgents } from '@/lib/api-hooks';
import { Badge } from '@/components/ui/badge';

export function AgentMonitorPage() {
  const { data: agent, isLoading } = useAgentStatus();
  const { data: queue = [] } = useActionQueue();
  const { data: subAgents = [] } = useAgents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Agent Monitor</h1>
        <p className="text-sm text-[var(--text-tertiary)]">Real-time agent status and performance metrics.</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4" data-testid="kpi-strip">
        <KpiCard
          label="Agent Running"
          value={agent?.running ? 'Yes' : 'No'}
          icon={<Activity size={16} />}
        />
        <KpiCard
          label="Queue Depth"
          value={agent?.queue_depth ?? 0}
          icon={<Clock size={16} />}
        />
        <KpiCard
          label="Action Queue"
          value={queue.length}
          icon={<Zap size={16} />}
        />
        <KpiCard
          label="Sub-Agents"
          value={subAgents.length}
          icon={<AlertTriangle size={16} />}
        />
      </div>

      {/* Action Queue */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Action Queue</h2>
        <div
          className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
          data-testid="action-queue-panel"
        >
          <div className="grid grid-cols-[40px_1fr_120px_100px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Rank</span>
            <span>Task</span>
            <span>Action</span>
            <span className="text-right">Score</span>
          </div>
          {queue.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--text-tertiary)] text-center">
              No actions in queue.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {queue.slice(0, 10).map((item) => (
                <div
                  key={item.node_id}
                  className="grid grid-cols-[40px_1fr_120px_100px] items-center gap-4 px-4 py-2 text-sm"
                >
                  <span className="text-xs font-mono text-[var(--text-tertiary)]">#{item.rank}</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{item.node_id}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{item.autonomy_level}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.recommended_action}
                  </Badge>
                  <span className="text-right font-mono text-xs text-[var(--text-secondary)]">
                    {item.final_score.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Agents */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Active Agents</h2>
        {subAgents.length === 0 ? (
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
            data-testid="active-agents"
          >
            <div className="flex items-center gap-3">
              <Activity size={16} className="text-[var(--state-active)]" />
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">Main Agent</div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  v{agent?.agent_version ?? 'unknown'} ·{' '}
                  {agent?.running ? 'Running' : 'Idle'}
                </div>
              </div>
              <Badge variant={agent?.running ? 'active' : 'outline'} className="ml-auto">
                {agent?.running ? 'Running' : 'Idle'}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subAgents.map((a) => (
              <div
                key={a.agent_id}
                className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {a.name ?? a.agent_id}
                  </div>
                  <Badge variant={a.state === 'running' ? 'active' : 'outline'}>{a.state}</Badge>
                </div>
                {a.skill && (
                  <div className="mt-1 text-xs text-[var(--text-tertiary)]">Skill: {a.skill}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Log (static — real SSE events would stream here) */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Event Log</h2>
        <div
          className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
          data-testid="event-log"
        >
          <div className="grid grid-cols-[80px_1fr_120px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Severity</span>
            <span>Message</span>
            <span>Time</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {agent?.running ? (
              <div className="grid grid-cols-[80px_1fr_120px] gap-4 px-4 py-2 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">INFO</span>
                <span className="text-[var(--text-primary)]">Agent heartbeat received</span>
                <span className="text-xs text-[var(--text-tertiary)]">Just now</span>
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-[var(--text-tertiary)] text-center">
                No events yet. Start the agent to see activity.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
