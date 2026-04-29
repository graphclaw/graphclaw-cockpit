import { useQuery } from '@tanstack/react-query';
import { useResources, type TaskItem, type ResourceItem } from '@/lib/api-hooks';

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

export interface WorkforceResource extends ResourceItem {
  type: 'HUMAN' | 'AI_AGENT';
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

export function useWorkforceData() {
  const resourcesQuery = useResources();

  const tasksQuery = useQuery({
    queryKey: ['graph', 'tasks', 'workforce-all'],
    queryFn: async (): Promise<TaskListRaw> => {
      const token = localStorage.getItem('gc-access-token') ?? '';
      const res = await fetch('/app/v1/graph/tasks?limit=500', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`tasks fetch failed: ${res.status}`);
      return res.json() as Promise<TaskListRaw>;
    },
  });

  const resources: ResourceItem[] = resourcesQuery.data?.items ?? [];
  const allTasks: TaskItem[] = tasksQuery.data?.items ?? [];

  // Group tasks by the `assignee` field (maps to assigned_to on the backend)
  const byResource: Record<string, TaskItem[]> = {};
  for (const t of allTasks) {
    const key = t.assignee;
    if (key) {
      byResource[key] = byResource[key] ?? [];
      byResource[key].push(t);
    }
  }

  const workforce: WorkforceResource[] = resources.map((r) => {
    const tasks = byResource[r.id] ?? [];
    const task_counts = computeTaskCounts(tasks);
    const capacity = r.capacity ?? 10;
    // In-flight = tasks actively consuming capacity
    const inFlight = task_counts.in_progress + task_counts.review + task_counts.blocked;
    const load_factor = capacity > 0 ? inFlight / capacity : 0;
    return {
      ...r,
      type: r.type === 'HUMAN' ? 'HUMAN' : 'AI_AGENT',
      task_counts,
      load_factor,
      tasks,
    };
  });

  return {
    workforce,
    isLoading: resourcesQuery.isLoading || tasksQuery.isLoading,
    isError: resourcesQuery.isError || tasksQuery.isError,
  };
}
