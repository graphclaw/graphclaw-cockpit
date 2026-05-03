import { Activity, AlertTriangle, CalendarClock, Clock3 } from 'lucide-react';
import { KpiCard } from '@/components/common/KpiCard';
import { useAgentStatus, useAgentTriggers, type AgentTrigger } from '@/lib/api-hooks';
import { useAttentionItems } from '@/features/agent-monitor/hooks/useAttentionItems';

function formatRelativeMinutes(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return 'Never';
  }

  const timestampMs = Date.parse(timestamp);
  if (Number.isNaN(timestampMs)) {
    return 'Unknown';
  }

  const minutes = Math.max(0, Math.floor((Date.now() - timestampMs) / 60_000));
  if (minutes === 0) {
    return 'Just now';
  }

  return `${minutes}m ago`;
}

function getNextFireAt(trigger: AgentTrigger): string | undefined {
  return trigger.next_fire_at ?? trigger.nextFireAt;
}

function selectNextTrigger(triggers: AgentTrigger[]): AgentTrigger | null {
  const datedTriggers = triggers
    .map((trigger) => ({
      trigger,
      nextFireAt: getNextFireAt(trigger),
    }))
    .filter((entry) => Boolean(entry.nextFireAt));

  if (datedTriggers.length === 0) {
    return triggers[0] ?? null;
  }

  datedTriggers.sort((a, b) => {
    const aTs = Date.parse(a.nextFireAt as string);
    const bTs = Date.parse(b.nextFireAt as string);

    if (Number.isNaN(aTs) && Number.isNaN(bTs)) {
      return 0;
    }

    if (Number.isNaN(aTs)) {
      return 1;
    }

    if (Number.isNaN(bTs)) {
      return -1;
    }

    return aTs - bTs;
  });

  return datedTriggers[0]?.trigger ?? null;
}

function formatNextRunValue(trigger: AgentTrigger | null): string {
  if (!trigger) {
    return 'No schedule';
  }

  const nextFireAt = getNextFireAt(trigger);
  if (!nextFireAt) {
    return 'Scheduled';
  }

  const timestampMs = Date.parse(nextFireAt);
  if (Number.isNaN(timestampMs)) {
    return 'Scheduled';
  }

  const deltaMinutes = Math.max(0, Math.ceil((timestampMs - Date.now()) / 60_000));
  return deltaMinutes === 0 ? 'Now' : `In ${deltaMinutes}m`;
}

function KpiErrorCard({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--state-blocked)] bg-[var(--state-blocked-light)] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--state-blocked)]">{label}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">Failed to load</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function KpiSkeletonCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      <div className="h-3 w-24 animate-pulse rounded bg-[var(--bg-inset)]" />
      <div className="mt-3 h-6 w-20 animate-pulse rounded bg-[var(--bg-inset)]" />
    </div>
  );
}

export function OverviewKpiStrip() {
  const agentStatusQuery = useAgentStatus();
  const triggerQuery = useAgentTriggers();
  const attentionQuery = useAttentionItems();

  const nextTrigger = selectNextTrigger(triggerQuery.data ?? []);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" data-testid="agent-monitor-kpi-strip">
      {agentStatusQuery.isLoading ? (
        <KpiSkeletonCard />
      ) : agentStatusQuery.error ? (
        <KpiErrorCard label="Agent Status" onRetry={() => void agentStatusQuery.refetch()} />
      ) : (
        <KpiCard
          label="Agent Status"
          value={agentStatusQuery.data?.running ? 'Running' : 'Idle'}
          icon={<Activity size={16} />}
        />
      )}

      {agentStatusQuery.isLoading ? (
        <KpiSkeletonCard />
      ) : agentStatusQuery.error ? (
        <KpiErrorCard label="Last Run" onRetry={() => void agentStatusQuery.refetch()} />
      ) : (
        <KpiCard
          label="Last Run"
          value={formatRelativeMinutes(agentStatusQuery.data?.last_cycle_at)}
          icon={<Clock3 size={16} />}
        />
      )}

      {triggerQuery.isLoading ? (
        <KpiSkeletonCard />
      ) : triggerQuery.error ? (
        <KpiErrorCard label="Next Run" onRetry={() => void triggerQuery.refetch()} />
      ) : (
        <KpiCard
          label="Next Run"
          value={formatNextRunValue(nextTrigger)}
          icon={<CalendarClock size={16} />}
        />
      )}

      {attentionQuery.isLoading ? (
        <KpiSkeletonCard />
      ) : (
        <KpiCard
          label="Needs Attention"
          value={attentionQuery.count}
          icon={<AlertTriangle size={16} />}
        />
      )}
    </div>
  );
}
