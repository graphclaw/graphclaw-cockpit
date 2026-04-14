import { KpiCard } from '@/components/common/KpiCard';
import { AgentCard } from './components/AgentCard';
import { useAgentStatus } from './hooks/useAgentData';
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export function AgentMonitorPage() {
  const { data: agent, isLoading } = useAgentStatus();

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
          label="Tasks Completed"
          value={agent?.tasks_completed ?? 0}
          trend={{ value: 12, positive: true }}
          icon={<CheckCircle size={16} />}
        />
        <KpiCard
          label="Tasks Pending"
          value={agent?.tasks_pending ?? 0}
          icon={<Clock size={16} />}
        />
        <KpiCard
          label="Agent State"
          value={agent?.state ?? 'UNKNOWN'}
          icon={<Activity size={16} />}
        />
        <KpiCard
          label="Errors (24h)"
          value={0}
          trend={{ value: 5, positive: false }}
          icon={<AlertTriangle size={16} />}
        />
      </div>

      {/* Agent Cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Active Agents</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agent && <AgentCard agent={agent} />}
        </div>
      </div>

      {/* Event Log */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Event Log</h2>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="grid grid-cols-[80px_1fr_120px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Severity</span>
            <span>Message</span>
            <span>Time</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {[
              { severity: 'INFO', message: 'Agent heartbeat received', time: 'Just now' },
              { severity: 'INFO', message: 'Task TSK-001 started', time: '2m ago' },
              { severity: 'WARN', message: 'API rate limit approaching', time: '5m ago' },
              { severity: 'INFO', message: 'Agent resumed from idle', time: '10m ago' },
            ].map((event, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_120px] gap-4 px-4 py-2 text-sm">
                <span
                  className={`text-xs font-medium ${
                    event.severity === 'WARN'
                      ? 'text-[var(--state-delayed)]'
                      : event.severity === 'ERROR'
                        ? 'text-[var(--state-blocked)]'
                        : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  {event.severity}
                </span>
                <span className="text-[var(--text-primary)]">{event.message}</span>
                <span className="text-xs text-[var(--text-tertiary)]">{event.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
