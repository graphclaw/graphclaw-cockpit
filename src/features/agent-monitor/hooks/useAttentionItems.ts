import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

const STALE_HEARTBEAT_SECONDS = 300;
const LAST_24_HOURS_MS = 24 * 60 * 60 * 1000;

interface SkillJob {
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
  last_heartbeat?: string | null;
  last_heartbeat_at?: string | null;
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
      return undefined;
    }

    return (await response.json()) as unknown;
  } catch {
    return undefined;
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

  return {
    count: failedSkillCount + staleRunnerCount,
    failedSkillCount,
    staleRunnerCount,
    isLoading: skillWorkersQuery.isLoading || runnersQuery.isLoading,
  };
}
