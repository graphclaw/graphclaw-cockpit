import { useState } from 'react';
import { Bot } from 'lucide-react';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { type SkillWorkerStatus, useSkillWorkerStatuses } from '@/lib/api-hooks';

const STALE_SECONDS = 900;

function readWorkerId(worker: SkillWorkerStatus, index: number): string {
  return worker.worker_id ?? worker.workerId ?? `worker-${index + 1}`;
}

function readCurrentJob(worker: SkillWorkerStatus): string | null {
  return worker.current_job_id ?? worker.currentJobId ?? null;
}

function readLastHeartbeat(worker: SkillWorkerStatus): string | null {
  return worker.last_heartbeat ?? worker.lastHeartbeat ?? null;
}

function readJobsCompleted(worker: SkillWorkerStatus): number {
  return worker.jobs_completed ?? worker.jobsCompleted ?? 0;
}

function readJobsFailed(worker: SkillWorkerStatus): number {
  return worker.jobs_failed ?? worker.jobsFailed ?? 0;
}

function isActiveWorker(worker: SkillWorkerStatus): boolean {
  const state = worker.state?.toUpperCase() ?? '';
  return state === 'RUNNING' || state === 'BUSY' || state === 'WORKING';
}

function isStaleWorker(worker: SkillWorkerStatus): boolean {
  const lastHeartbeat = readLastHeartbeat(worker);
  if (!lastHeartbeat) {
    return false;
  }

  const parsed = Date.parse(lastHeartbeat);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return (Date.now() - parsed) / 1000 > STALE_SECONDS;
}

function utilizationTone(percent: number): 'green' | 'amber' | 'red' {
  if (percent > 90) {
    return 'red';
  }

  if (percent >= 75) {
    return 'amber';
  }

  return 'green';
}

function sparklineBars(worker: SkillWorkerStatus): Array<'ok' | 'warn' | 'bad' | 'empty'> {
  const completed = readJobsCompleted(worker);
  const failed = readJobsFailed(worker);
  const total = completed + failed;

  if (total <= 0) {
    return Array.from({ length: 10 }).map(() => 'empty');
  }

  const failedRatio = Math.min(1, failed / total);
  const badCount = Math.min(10, Math.round(failedRatio * 10));
  const warnCount = badCount > 0 ? 1 : 0;
  const okCount = Math.max(0, 10 - badCount - warnCount);

  return [
    ...Array.from({ length: okCount }).map(() => 'ok' as const),
    ...Array.from({ length: warnCount }).map(() => 'warn' as const),
    ...Array.from({ length: badCount }).map(() => 'bad' as const),
  ].slice(0, 10);
}

function barClass(bar: 'ok' | 'warn' | 'bad' | 'empty'): string {
  if (bar === 'ok') {
    return 'bg-[var(--state-progress)]';
  }

  if (bar === 'warn') {
    return 'bg-[var(--state-delayed)]';
  }

  if (bar === 'bad') {
    return 'bg-[var(--state-blocked)]';
  }

  return 'bg-[var(--bg-inset)]';
}

function utilClass(tone: 'green' | 'amber' | 'red'): string {
  if (tone === 'red') {
    return 'bg-[var(--state-blocked)]';
  }

  if (tone === 'amber') {
    return 'bg-[var(--state-delayed)]';
  }

  return 'bg-[var(--state-progress)]';
}

export function SkillsWorkerPool() {
  const [expanded, setExpanded] = useState(false);
  const query = useSkillWorkerStatuses();

  if (query.isLoading) {
    return <PanelSkeleton rows={4} withHeader={false} />;
  }

  if (query.error) {
    return <PanelError error={query.error as Error} onRetry={() => void query.refetch()} />;
  }

  const workers = query.data ?? [];

  if (workers.length === 0) {
    return (
      <div data-testid="skills-worker-pool">
        <EmptyPanel
          icon={Bot}
          title="No skill workers are active."
          subtitle="Worker pool details will appear here when skills are running."
        />
      </div>
    );
  }

  const activeWorkers = workers.filter(isActiveWorker).length;
  const utilization = Math.round((activeWorkers / workers.length) * 100);
  const tone = utilizationTone(utilization);

  const visibleWorkers = expanded ? workers : workers.slice(0, 4);

  return (
    <div className="space-y-3" data-testid="skills-worker-pool">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Worker pool utilization</p>
          <span className="text-xs font-semibold text-[var(--text-secondary)]" data-testid="skills-util-value">
            {activeWorkers}/{workers.length} active ({utilization}%)
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-inset)]" data-testid="skills-util-bar">
          <div
            className={`h-full transition-all ${utilClass(tone)}`}
            style={{ width: `${utilization}%` }}
            data-testid={`skills-util-tone-${tone}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {visibleWorkers.map((worker, index) => {
          const workerId = readWorkerId(worker, index);
          const currentJob = readCurrentJob(worker);
          const stale = isStaleWorker(worker);
          const bars = sparklineBars(worker);

          return (
            <div
              key={workerId}
              className={`rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-3 ${stale ? 'border-[var(--state-delayed)]' : 'border-[var(--border-default)]'}`}
              data-testid="skills-worker-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{workerId}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">State: {worker.state ?? 'UNKNOWN'}</p>
                </div>

                {stale && (
                  <span className="rounded-full border border-[var(--state-delayed)] bg-[var(--state-delayed-light)] px-2 py-0.5 text-[11px] font-semibold text-[var(--state-delayed)]">
                    Stale
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-[var(--text-tertiary)]">Job:</span>
                {currentJob ? (
                  <span className="inline-flex rounded-full border border-[var(--border-default)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
                    {currentJob}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--text-tertiary)]">-</span>
                )}
              </div>

              <div className="mt-3 flex items-end gap-1">
                {bars.map((bar, barIndex) => (
                  <span
                    key={`${workerId}-bar-${barIndex}`}
                    className={`h-1.5 w-2 rounded-sm ${barClass(bar)}`}
                    data-testid="skills-worker-spark-segment"
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {workers.length > 4 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-xs font-semibold text-[var(--text-link)] hover:text-[var(--text-link-hover)]"
          data-testid="skills-show-all"
        >
          {expanded ? 'Show less' : `Show all (${workers.length})`}
        </button>
      )}
    </div>
  );
}
