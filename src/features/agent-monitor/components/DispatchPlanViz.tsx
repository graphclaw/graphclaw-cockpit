import { GitBranchPlus } from 'lucide-react';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { useAgentDelegations, useAgentDispatchPlan } from '@/lib/api-hooks';

interface DisplayJob {
  rowKey: string;
  agentId: string;
  taskId: string;
  status: string;
}

interface DisplayTier {
  rowKey: string;
  tier: number;
  status: string;
  jobs: DisplayJob[];
}

function readFirstString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
}

function readFirstNumber(...values: Array<unknown>): number | null {
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

function normalizeState(raw: string | null): string {
  const normalized = (raw ?? 'UNKNOWN').toUpperCase();

  if (normalized === 'FAILED' || normalized === 'TIMED_OUT' || normalized === 'ERROR') {
    return 'BLOCKED';
  }

  if (normalized === 'WORKING' || normalized === 'BUSY') {
    return 'RUNNING';
  }

  if (normalized === 'DONE' || normalized === 'SUCCESS') {
    return 'COMPLETED';
  }

  return normalized;
}

function statusClass(status: string): string {
  if (status === 'RUNNING') {
    return 'border-[var(--state-progress)] bg-[var(--state-progress-light)] text-[var(--state-progress)]';
  }

  if (status === 'COMPLETED') {
    return 'border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-[var(--text-tertiary)]';
  }

  if (status === 'PENDING') {
    return 'border-dashed border-[var(--state-delayed)] bg-[var(--state-delayed-light)] text-[var(--state-delayed)]';
  }

  if (status === 'BLOCKED') {
    return 'border-[var(--state-blocked)] bg-[var(--state-blocked-light)] text-[var(--state-blocked)]';
  }

  return 'border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-[var(--text-secondary)]';
}

function pickActiveSessionId(rows: unknown[]): string | null {
  for (const row of rows) {
    const entry = (row ?? {}) as Record<string, unknown>;
    const status = normalizeState(readFirstString(entry.status));
    if (status !== 'COMPLETED') {
      const sessionId = readFirstString(entry.session_id, entry.sessionId);
      if (sessionId) {
        return sessionId;
      }
    }
  }

  return null;
}

function normalizeTiers(rows: unknown[]): DisplayTier[] {
  return rows
    .map((row, index) => {
      const entry = (row ?? {}) as Record<string, unknown>;
      const tier = readFirstNumber(entry.tier) ?? index + 1;
      const status = normalizeState(readFirstString(entry.status));

      const jobsRaw = Array.isArray(entry.jobs) ? entry.jobs : [];
      const jobs: DisplayJob[] = jobsRaw.map((job, jobIndex) => {
        const item = (job ?? {}) as Record<string, unknown>;
        const agentId = readFirstString(item.agent_id, item.agentId) ?? 'unknown-agent';
        const taskId = readFirstString(item.task_id, item.taskId) ?? 'unknown-task';
        const jobStatus = normalizeState(readFirstString(item.status));

        return {
          rowKey: `${agentId}-${taskId}-${jobIndex + 1}`,
          agentId,
          taskId,
          status: jobStatus,
        };
      });

      return {
        rowKey: readFirstString(entry.batch_id, entry.batchId) ?? `tier-${tier}`,
        tier: Math.max(1, Math.floor(tier)),
        status,
        jobs,
      };
    })
    .sort((left, right) => left.tier - right.tier);
}

export function DispatchPlanViz() {
  const delegationsQuery = useAgentDelegations();
  const activeSessionId = pickActiveSessionId(delegationsQuery.data ?? []);
  const dispatchQuery = useAgentDispatchPlan(activeSessionId);

  if (delegationsQuery.isLoading || (activeSessionId && dispatchQuery.isLoading)) {
    return <PanelSkeleton rows={3} withHeader={false} />;
  }

  if (delegationsQuery.error) {
    return <PanelError error={delegationsQuery.error as Error} onRetry={() => void delegationsQuery.refetch()} />;
  }

  if (dispatchQuery.error && activeSessionId) {
    return <PanelError error={dispatchQuery.error as Error} onRetry={() => void dispatchQuery.refetch()} />;
  }

  if (!activeSessionId) {
    return (
      <div data-testid="dispatch-plan-viz-empty">
        <EmptyPanel
          icon={GitBranchPlus}
          title="No active dispatch session."
          subtitle="Swim-lanes will appear here when a delegation session is running."
        />
      </div>
    );
  }

  const tiers = normalizeTiers(dispatchQuery.data ?? []);
  if (tiers.length === 0) {
    return (
      <div data-testid="dispatch-plan-viz-empty">
        <EmptyPanel
          icon={GitBranchPlus}
          title="No dispatch tiers available yet."
          subtitle="The selected session has not published dispatch tiers."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="dispatch-plan-viz">
      <div className="flex items-center justify-between gap-2 text-xs">
        <p className="font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Dispatch plan</p>
        <span className="font-mono text-[var(--text-secondary)]" data-testid="dispatch-plan-session">{activeSessionId}</span>
      </div>

      <div className="space-y-2">
        {tiers.map((tier) => (
          <div
            key={tier.rowKey}
            className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2"
            data-testid="dispatch-plan-tier"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Tier {tier.tier}</p>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(tier.status)}`}>
                {tier.status}
              </span>
            </div>

            {tier.jobs.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)]">No jobs in this tier.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tier.jobs.map((job) => (
                  <div
                    key={job.rowKey}
                    className={`rounded-[var(--radius-sm)] border px-2 py-1 text-xs ${statusClass(job.status)}`}
                    data-testid={`dispatch-plan-job-${job.status.toLowerCase()}`}
                  >
                    <p className="font-semibold">{job.agentId}</p>
                    <p className="font-mono">{job.taskId}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
