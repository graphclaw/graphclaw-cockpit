import { Activity, Clock3, Layers3, TimerReset } from 'lucide-react';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { useAgentPoolStatus, useAgents, useAgentStatus } from '@/lib/api-hooks';

function toNumber(...values: Array<unknown>): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function activeState(state: string | undefined): boolean {
  const normalized = (state ?? '').toUpperCase();
  return normalized === 'RUNNING' || normalized === 'WORKING' || normalized === 'BUSY';
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: JSX.Element;
  alert?: boolean;
  testId: string;
}

function KpiCard({ label, value, icon, alert = false, testId }: KpiCardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-3 ${alert ? 'border-[var(--state-blocked)]' : 'border-[var(--border-default)]'}`}
      data-testid={testId}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-[var(--text-tertiary)]">
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
        <span>{icon}</span>
      </div>
      <p className={`text-lg font-semibold ${alert ? 'text-[var(--state-blocked)]' : 'text-[var(--text-primary)]'}`}>{value}</p>
    </div>
  );
}

export function AgentsPoolKpis() {
  const poolQuery = useAgentPoolStatus();
  const agentsQuery = useAgents();
  const statusQuery = useAgentStatus();

  if (poolQuery.isLoading && agentsQuery.isLoading && statusQuery.isLoading) {
    return <PanelSkeleton rows={4} withHeader={false} />;
  }

  if (poolQuery.error && agentsQuery.error && statusQuery.error) {
    return <PanelError error={poolQuery.error as Error} onRetry={() => void poolQuery.refetch()} />;
  }

  const pool = poolQuery.data;
  const agents = agentsQuery.data ?? [];

  const activeFallback = agents.filter((agent) => activeState(agent.state)).length;
  const totalFallback = agents.length;

  const active =
    toNumber(pool?.active_runners, pool?.activeRunners) ?? activeFallback;
  const total =
    toNumber(pool?.total_runners, pool?.totalRunners) ?? totalFallback;

  const queueDepth =
    toNumber(pool?.queue_depth, pool?.queueDepth) ??
    toNumber(statusQuery.data?.queue_depth) ??
    0;

  const avgDurationSeconds =
    toNumber(
      pool?.avg_duration_seconds,
      pool?.avgDurationSeconds,
      pool?.average_duration_seconds,
      pool?.avg_run_duration_seconds,
    ) ?? null;

  const staleHeartbeats =
    toNumber(pool?.stale_heartbeats, pool?.staleHeartbeats) ?? 0;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" data-testid="agents-pool-kpis">
      <KpiCard
        label="Active runners"
        value={`${active}/${Math.max(total, 0)}`}
        icon={<Activity size={14} />}
        testId="agents-kpi-active"
      />
      <KpiCard
        label="Queue depth"
        value={String(queueDepth)}
        icon={<Layers3 size={14} />}
        testId="agents-kpi-queue"
      />
      <KpiCard
        label="Avg duration"
        value={avgDurationSeconds === null ? '--' : `${Math.round(avgDurationSeconds)}s`}
        icon={<Clock3 size={14} />}
        testId="agents-kpi-duration"
      />
      <KpiCard
        label="Stale heartbeats"
        value={String(staleHeartbeats)}
        icon={<TimerReset size={14} />}
        alert={staleHeartbeats > 0}
        testId="agents-kpi-stale"
      />
    </div>
  );
}
