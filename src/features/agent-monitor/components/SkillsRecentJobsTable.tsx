// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import { ListChecks } from 'lucide-react';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { formatSkillError } from '@/features/agent-monitor/lib/formatSkillError';
import { type SkillWorkerJob, useSkillWorkers } from '@/lib/api-hooks';

const MAX_RECENT_JOBS = 20;

interface DisplayJob {
  rowKey: string;
  status: string;
  skill: string;
  task: string | null;
  completedAt: string | null;
  tokens: number | null;
  summary: string;
  failed: boolean;
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

function readFirstValue(...values: Array<unknown>): unknown {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string' && value.trim() === '') {
      continue;
    }

    return value;
  }

  return null;
}

function readStatus(job: SkillWorkerJob): string {
  return readFirstString(job.status)?.toUpperCase() ?? 'UNKNOWN';
}

function isFailedStatus(status: string): boolean {
  return ['FAILED', 'ERROR', 'TIMEOUT'].includes(status);
}

function readTimestamp(job: SkillWorkerJob): string | null {
  return readFirstString(job.completed_at, job.completedAt, job.ended_at, job.finished_at);
}

function formatCompletedAt(value: string | null): string {
  if (!value) {
    return '--';
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return '--';
  }

  return new Date(parsed).toLocaleString([], {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function statusClass(status: string, failed: boolean): string {
  if (failed) {
    return 'border-[var(--state-blocked)] bg-[var(--state-blocked-light)] text-[var(--state-blocked)]';
  }

  if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'OK') {
    return 'border-[var(--state-progress)] bg-[var(--state-progress-light)] text-[var(--state-progress)]';
  }

  if (status === 'RUNNING' || status === 'IN_PROGRESS') {
    return 'border-[var(--state-running)] bg-[var(--state-running-light)] text-[var(--state-running)]';
  }

  return 'border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-[var(--text-secondary)]';
}

function jobsToDisplay(jobs: SkillWorkerJob[]): DisplayJob[] {
  const sorted = [...jobs]
    .sort((left, right) => {
      const leftTs = Date.parse(readTimestamp(left) ?? '');
      const rightTs = Date.parse(readTimestamp(right) ?? '');

      const safeLeft = Number.isNaN(leftTs) ? -1 : leftTs;
      const safeRight = Number.isNaN(rightTs) ? -1 : rightTs;

      return safeRight - safeLeft;
    })
    .slice(0, MAX_RECENT_JOBS);

  return sorted.map((job, index) => {
    const status = readStatus(job);
    const failed = isFailedStatus(status);

    const errorValue = readFirstValue(job.error, job.error_message, job.errorMessage);
    const resultValue = readFirstValue(job.summary, job.result, job.message, status);

    return {
      rowKey:
        readFirstString(job.job_id, job.jobId, readTimestamp(job)) ??
        `job-${index + 1}`,
      status,
      skill: readFirstString(job.skill_name, job.skillName, job.skill_id, job.skillId) ?? 'Unknown skill',
      task: readFirstString(job.task_id, job.taskId),
      completedAt: readTimestamp(job),
      tokens: readFirstNumber(job.tokens, job.tokens_used, job.token_count, job.total_tokens),
      summary: failed ? formatSkillError(errorValue ?? resultValue) : readFirstString(resultValue) ?? '-',
      failed,
    };
  });
}

export function SkillsRecentJobsTable() {
  const query = useSkillWorkers();

  const jobs = useMemo(() => {
    const payload = query.data;
    const allJobs = payload?.completed_jobs ?? payload?.jobs ?? [];
    return jobsToDisplay(allJobs);
  }, [query.data]);

  if (query.isLoading) {
    return <PanelSkeleton rows={5} withHeader={false} />;
  }

  if (query.error) {
    return <PanelError error={query.error as Error} onRetry={() => void query.refetch()} />;
  }

  if (jobs.length === 0) {
    return (
      <div data-testid="skills-recent-jobs-empty">
        <EmptyPanel
          icon={ListChecks}
          title="No recent skill jobs."
          subtitle="Completed and failed executions will appear here when workers finish jobs."
        />
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      data-testid="skills-recent-jobs"
    >
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Recent jobs</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Skill</th>
              <th className="px-3 py-2 font-semibold">Task</th>
              <th className="px-3 py-2 font-semibold">Completed</th>
              <th className="px-3 py-2 font-semibold">Tokens</th>
              <th className="px-3 py-2 font-semibold">Result</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.rowKey}
                className={`border-b border-[var(--border-subtle)] align-top last:border-b-0 ${job.failed ? 'bg-[var(--state-blocked-light)]' : ''}`}
                data-testid={job.failed ? 'skills-job-row-failed' : 'skills-job-row'}
              >
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(job.status, job.failed)}`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{job.skill}</td>
                <td className="px-3 py-2 text-xs">
                  {job.task ? (
                    <span className="inline-flex rounded-full border border-[var(--border-default)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
                      {job.task}
                    </span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">-</span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{formatCompletedAt(job.completedAt)}</td>
                <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{job.tokens ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{job.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
