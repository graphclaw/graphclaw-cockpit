// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import {
  useAgentSessions,
  useAgentStatus,
  useCommsSummary,
  useSkillWorkers,
  type AgentStatus,
  type SkillWorkerJob,
} from '@/lib/api-hooks';

export interface GlanceMetrics {
  messagesReceived: number | null;
  repliesSent: number | null;
  skillsRun: { ok: number; failed: number };
  tasksScored: number | null;
  runsToday: number | null;
  isLoading: boolean;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getUtcDateString(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function getTimestampForJob(job: SkillWorkerJob): string | undefined {
  return job.completed_at ?? job.completedAt ?? job.ended_at ?? job.finished_at;
}

function isWithinTodayUtc(timestamp: string | undefined, now = new Date()): boolean {
  if (!timestamp) {
    return false;
  }

  const ts = Date.parse(timestamp);
  if (Number.isNaN(ts)) {
    return false;
  }

  const startOfDayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endOfDayUtc = startOfDayUtc + 24 * 60 * 60 * 1000;

  return ts >= startOfDayUtc && ts < endOfDayUtc;
}

function isFailedStatus(status: string | undefined): boolean {
  if (!status) {
    return false;
  }

  const normalized = status.toUpperCase();
  return normalized === 'FAILED' || normalized === 'ERROR' || normalized === 'TIMEOUT';
}

function getTasksScored(status: AgentStatus | undefined): number | null {
  if (!status) {
    return null;
  }

  return (
    toNumber(status.tasks_scored) ??
    toNumber(status.tasksScored) ??
    toNumber(status.last_cycle_tasks_scored) ??
    toNumber(status.tasks_completed)
  );
}

export function useGlanceMetrics(): GlanceMetrics {
  const today = getUtcDateString();

  const statusQuery = useAgentStatus();
  const commsQuery = useCommsSummary(today);
  const skillsQuery = useSkillWorkers();
  const sessionsQuery = useAgentSessions(100);

  const messagesReceived = useMemo(() => {
    const payload = commsQuery.data;
    if (!payload) {
      return null;
    }

    return (
      toNumber(payload.received) ??
      toNumber(payload.messages_received) ??
      toNumber(payload.messagesReceived)
    );
  }, [commsQuery.data]);

  const repliesSent = useMemo(() => {
    const payload = commsQuery.data;
    if (!payload) {
      return null;
    }

    return (
      toNumber(payload.sent) ??
      toNumber(payload.replies_sent) ??
      toNumber(payload.repliesSent)
    );
  }, [commsQuery.data]);

  const skillsRun = useMemo(() => {
    const payload = skillsQuery.data;
    const jobs = payload?.completed_jobs ?? payload?.jobs ?? [];

    let ok = 0;
    let failed = 0;

    jobs.forEach((job) => {
      if (!isWithinTodayUtc(getTimestampForJob(job))) {
        return;
      }

      if (isFailedStatus(job.status)) {
        failed += 1;
      } else {
        ok += 1;
      }
    });

    return { ok, failed };
  }, [skillsQuery.data]);

  const tasksScored = useMemo(() => getTasksScored(statusQuery.data), [statusQuery.data]);

  const runsToday = useMemo(() => {
    const payload = sessionsQuery.data;
    if (!payload) {
      return null;
    }

    if (typeof payload.total === 'number') {
      return payload.total;
    }

    if (Array.isArray(payload.items)) {
      return payload.items.filter((session) => isWithinTodayUtc(session.startedAt)).length;
    }

    return null;
  }, [sessionsQuery.data]);

  return {
    messagesReceived,
    repliesSent,
    skillsRun,
    tasksScored,
    runsToday,
    isLoading:
      statusQuery.isLoading ||
      commsQuery.isLoading ||
      skillsQuery.isLoading ||
      sessionsQuery.isLoading,
  };
}
