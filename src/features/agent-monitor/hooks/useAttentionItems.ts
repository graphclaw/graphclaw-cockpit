import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isAttentionItemDismissed, pruneDismissedAttentionItems } from '../lib/attentionDismiss';

const STALE_HEARTBEAT_SECONDS = 300;
const LAST_24_HOURS_MS = 24 * 60 * 60 * 1000;

interface SkillJob {
  job_id?: string;
  task_id?: string;
  taskId?: string;
  skill_name?: string;
  skillName?: string;
  attempts?: number;
  attempt_count?: number;
  retries?: number;
  retry_count?: number;
  status?: string;
  completed_at?: string;
  ended_at?: string;
  finished_at?: string;
}

interface SkillWorkersPayload {
  completed_jobs?: SkillJob[];
  jobs?: SkillJob[];
}

interface Runner {
  runner_id?: string;
  agent_id?: string;
  last_heartbeat?: string | null;
  last_heartbeat_at?: string | null;
}

export type AttentionSeverity = 'critical' | 'warning';
export type AttentionIcon = 'alert-circle' | 'clock';

export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  icon: AttentionIcon;
  text: string;
  taskId?: string;
  actionHref?: string;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('gc-access-token');

  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function fetchOptionalJson(path: string): Promise<unknown> {
  try {
    const response = await fetch(path, { headers: authHeaders() });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function isFailedStatus(status: string | undefined): boolean {
  if (!status) {
    return false;
  }

  const normalizedStatus = status.toUpperCase();
  return normalizedStatus === 'FAILED' || normalizedStatus === 'ERROR' || normalizedStatus === 'TIMEOUT';
}

function happenedWithinLast24Hours(timestamp: string | undefined): boolean {
  if (!timestamp) {
    return true;
  }

  const timestampMs = Date.parse(timestamp);
  if (Number.isNaN(timestampMs)) {
    return false;
  }

  return Date.now() - timestampMs <= LAST_24_HOURS_MS;
}

function extractRunners(payload: unknown): Runner[] {
  if (Array.isArray(payload)) {
    return payload as Runner[];
  }

  if (payload && typeof payload === 'object') {
    const value = (payload as { runners?: unknown }).runners;
    if (Array.isArray(value)) {
      return value as Runner[];
    }
  }

  return [];
}

function formatAttempts(job: SkillJob): number {
  const attempts = job.attempts ?? job.attempt_count ?? job.retries ?? job.retry_count;
  if (typeof attempts === 'number' && Number.isFinite(attempts) && attempts > 0) {
    return attempts;
  }

  return 1;
}

function buildFailedSkillAttentionItem(job: SkillJob, index: number): AttentionItem | null {
  const completedAt = job.completed_at ?? job.ended_at ?? job.finished_at;
  if (!isFailedStatus(job.status) || !happenedWithinLast24Hours(completedAt)) {
    return null;
  }

  const taskId = job.task_id ?? job.taskId;
  const skillName = job.skill_name ?? job.skillName ?? 'Skill';
  const attempts = formatAttempts(job);
  const attemptsSuffix = attempts === 1 ? 'time' : 'times';
  const taskPrefix = taskId ? ` on #${taskId}` : '';

  return {
    id: `skill:${job.job_id ?? skillName}:${taskId ?? 'none'}:${completedAt ?? 'unknown'}:${index}`,
    severity: 'critical',
    icon: 'alert-circle',
    text: `${skillName} failed${taskPrefix} - tried ${attempts} ${attemptsSuffix} and could not complete.`,
    taskId,
    actionHref: taskId ? `/tasks/${taskId}` : undefined,
  };
}

function buildStaleRunnerAttentionItem(runner: Runner, index: number): AttentionItem | null {
  const lastHeartbeat = runner.last_heartbeat ?? runner.last_heartbeat_at;
  if (!lastHeartbeat) {
    return null;
  }

  const heartbeatMs = Date.parse(lastHeartbeat);
  if (Number.isNaN(heartbeatMs)) {
    return null;
  }

  const staleForSeconds = Math.floor((Date.now() - heartbeatMs) / 1000);
  if (staleForSeconds <= STALE_HEARTBEAT_SECONDS) {
    return null;
  }

  const runnerLabel = runner.runner_id ?? runner.agent_id ?? `runner-${index + 1}`;
  const staleForMinutes = Math.max(1, Math.floor(staleForSeconds / 60));

  return {
    id: `runner:${runnerLabel}:${lastHeartbeat}`,
    severity: 'warning',
    icon: 'clock',
    text: `Heartbeat for ${runnerLabel} is stale (${staleForMinutes}m since last update).`,
  };
}

export function useAttentionItems() {
  const skillWorkersQuery = useQuery({
    queryKey: ['agent-monitor', 'attention', 'skills-workers'],
    queryFn: () => fetchOptionalJson('/app/v1/skills/workers'),
    refetchInterval: 30_000,
    retry: false,
  });

  const runnersQuery = useQuery({
    queryKey: ['agent-monitor', 'attention', 'pool-runners'],
    queryFn: () => fetchOptionalJson('/app/v1/agents/pool/runners'),
    refetchInterval: 30_000,
    retry: false,
  });

  const failedSkillCount = useMemo(() => {
    const payload = (skillWorkersQuery.data ?? {}) as SkillWorkersPayload;
    const completedJobs = payload.completed_jobs ?? payload.jobs ?? [];

    return completedJobs.filter((job) => {
      const completedAt = job.completed_at ?? job.ended_at ?? job.finished_at;
      return isFailedStatus(job.status) && happenedWithinLast24Hours(completedAt);
    }).length;
  }, [skillWorkersQuery.data]);

  const staleRunnerCount = useMemo(() => {
    const runners = extractRunners(runnersQuery.data);

    return runners.filter((runner) => {
      const lastHeartbeat = runner.last_heartbeat ?? runner.last_heartbeat_at;
      if (!lastHeartbeat) {
        return false;
      }

      const heartbeatMs = Date.parse(lastHeartbeat);
      if (Number.isNaN(heartbeatMs)) {
        return false;
      }

      const staleForSeconds = (Date.now() - heartbeatMs) / 1000;
      return staleForSeconds > STALE_HEARTBEAT_SECONDS;
    }).length;
  }, [runnersQuery.data]);

  const items = useMemo(() => {
    pruneDismissedAttentionItems();

    const skillPayload = (skillWorkersQuery.data ?? {}) as SkillWorkersPayload;
    const completedJobs = skillPayload.completed_jobs ?? skillPayload.jobs ?? [];
    const failedSkillItems = completedJobs
      .map((job, index) => buildFailedSkillAttentionItem(job, index))
      .filter((item): item is AttentionItem => Boolean(item));

    const staleRunnerItems = extractRunners(runnersQuery.data)
      .map((runner, index) => buildStaleRunnerAttentionItem(runner, index))
      .filter((item): item is AttentionItem => Boolean(item));

    return [...failedSkillItems, ...staleRunnerItems].filter((item) => !isAttentionItemDismissed(item.id));
  }, [runnersQuery.data, skillWorkersQuery.data]);

  return {
    count: items.length,
    items,
    failedSkillCount,
    staleRunnerCount,
    isLoading: skillWorkersQuery.isLoading || runnersQuery.isLoading,
  };
}
