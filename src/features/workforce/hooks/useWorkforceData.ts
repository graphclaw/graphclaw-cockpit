// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useQuery } from '@tanstack/react-query';
import { useAdminMembers, useAgents, type TaskItem } from '@/lib/api-hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskCounts {
  pending: number;
  in_progress: number;
  review: number;
  blocked: number;
  done: number;
  total: number;
}

export interface WorkforceResource {
  id: string;
  name: string;
  type: 'HUMAN' | 'AI_AGENT';
  capacity?: number;
  allocated?: number;
  task_counts: TaskCounts;
  /** Ratio of in-flight tasks to capacity (0–1.5+). >1 = over capacity. */
  load_factor: number;
  tasks: TaskItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categorizeState(state: string): keyof Omit<TaskCounts, 'total'> {
  const s = state.toUpperCase();
  if (s === 'BLOCKED' || s === 'STALLED' || s === 'FAILED') return 'blocked';
  if (s === 'REVIEW' || s === 'UNDER_REVIEW') return 'review';
  if (s === 'COMPLETE' || s === 'DONE' || s === 'COMPLETED' || s === 'CLOSED') return 'done';
  if (s === 'ACTIVE' || s === 'IN_PROGRESS' || s === 'DELEGATED') return 'in_progress';
  return 'pending';
}

function computeTaskCounts(tasks: TaskItem[]): TaskCounts {
  const counts: TaskCounts = {
    pending: 0,
    in_progress: 0,
    review: 0,
    blocked: 0,
    done: 0,
    total: 0,
  };
  for (const task of tasks) {
    const bucket = categorizeState(task.state);
    counts[bucket]++;
    counts.total++;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface TaskListRaw {
  items: TaskItem[];
  total?: number;
}

const DEFAULT_CAPACITY = 10;

function buildResource(
  id: string,
  name: string,
  type: 'HUMAN' | 'AI_AGENT',
  tasks: TaskItem[],
): WorkforceResource {
  const task_counts = computeTaskCounts(tasks);
  const inFlight = task_counts.in_progress + task_counts.review + task_counts.blocked;
  const load_factor = DEFAULT_CAPACITY > 0 ? inFlight / DEFAULT_CAPACITY : 0;
  return { id, name, type, capacity: DEFAULT_CAPACITY, task_counts, load_factor, tasks };
}

export function useWorkforceData() {
  const membersQuery = useAdminMembers();
  const agentsQuery = useAgents();

  const tasksQuery = useQuery({
    queryKey: ['graph', 'tasks', 'workforce-all'],
    queryFn: async (): Promise<TaskListRaw> => {
      const token = localStorage.getItem('gc-access-token') ?? '';
      const res = await fetch('/app/v1/graph/tasks?limit=200', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`tasks fetch failed: ${res.status}`);
      return res.json() as Promise<TaskListRaw>;
    },
  });

  const allTasks: TaskItem[] = tasksQuery.data?.items ?? [];

  const byAssignee: Record<string, TaskItem[]> = {};
  for (const t of allTasks) {
    const key = t.assigned_to;
    if (key) {
      byAssignee[key] = byAssignee[key] ?? [];
      byAssignee[key].push(t);
    }
  }

  // Human resources — workspace members from /admin/members.
  // Each member's user_id matches the assigned_to field on tasks.
  const humanResources: WorkforceResource[] = (membersQuery.data ?? []).map((m) => {
    const displayName = m.email.includes('@')
      ? m.email.split('@')[0]!.replace(/[._-]/g, ' ')
      : m.email;
    const name = displayName.replace(/\b\w/g, (c) => c.toUpperCase());
    return buildResource(m.user_id, name, 'HUMAN', byAssignee[m.user_id] ?? []);
  });

  // AI agent resources — canvas agent definitions from /agents.
  // Each agent's agent_id matches the assigned_to field on tasks.
  const agentResources: WorkforceResource[] = (agentsQuery.data ?? []).map((a) => {
    return buildResource(a.agent_id, a.name, 'AI_AGENT', byAssignee[a.agent_id] ?? []);
  });

  const workforce = [...humanResources, ...agentResources];

  return {
    workforce,
    isLoading: membersQuery.isLoading || agentsQuery.isLoading || tasksQuery.isLoading,
    isError: membersQuery.isError || agentsQuery.isError || tasksQuery.isError,
  };
}
