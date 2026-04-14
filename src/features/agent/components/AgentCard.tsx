import { Badge } from '@/components/ui/badge';
import type { AgentStatus } from '../hooks/useAgentData';

interface AgentCardProps {
  agent: AgentStatus;
}

const STATE_VARIANTS: Record<string, 'active' | 'progress' | 'blocked' | 'snoozed' | 'outline'> = {
  IDLE: 'snoozed',
  RUNNING: 'progress',
  PAUSED: 'blocked',
  ERROR: 'blocked',
};

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium text-[var(--text-primary)]">{agent.agent_id}</span>
        <Badge variant={STATE_VARIANTS[agent.state] ?? 'outline'}>{agent.state}</Badge>
      </div>

      {/* Heartbeat indicator */}
      <div className="mb-3 flex gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-1 rounded-full"
            style={{
              backgroundColor:
                agent.state === 'RUNNING'
                  ? `var(--state-progress)`
                  : agent.state === 'IDLE'
                    ? `var(--text-tertiary)`
                    : `var(--state-blocked)`,
              opacity: 0.3 + (i / 20) * 0.7,
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-xs text-[var(--text-tertiary)]">Completed</span>
          <div className="font-semibold text-[var(--text-primary)]">{agent.tasks_completed}</div>
        </div>
        <div>
          <span className="text-xs text-[var(--text-tertiary)]">Pending</span>
          <div className="font-semibold text-[var(--text-primary)]">{agent.tasks_pending}</div>
        </div>
      </div>

      <div className="mt-2 text-xs text-[var(--text-tertiary)]">
        Last heartbeat: {new Date(agent.last_heartbeat).toLocaleTimeString()}
      </div>
    </div>
  );
}
