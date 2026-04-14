import { useQuery } from '@tanstack/react-query';

export interface GoalItem {
  id: string;
  title: string;
  state: string;
  priority: string;
}

export interface GoalListResponse {
  items: GoalItem[];
  next_cursor: string | null;
  total: number;
}

export function useGoals(cursor?: string) {
  return useQuery({
    queryKey: ['graph', 'goals', { cursor }],
    queryFn: async () => {
      const res = await fetch('/app/v1/graph/goals' + (cursor ? `?cursor=${cursor}` : ''));
      if (!res.ok) throw new Error('Failed to fetch goals');
      return (await res.json()) as GoalListResponse;
    },
  });
}

export interface TaskItem {
  id: string;
  title: string;
  state: string;
  score: number;
  priority?: string;
  assignee?: string;
  goal_id?: string;
}

export interface TaskListResponse {
  items: TaskItem[];
  next_cursor: string | null;
  total: number;
}

export function useTasks(cursor?: string) {
  return useQuery({
    queryKey: ['graph', 'tasks', { cursor }],
    queryFn: async () => {
      const res = await fetch('/app/v1/graph/tasks' + (cursor ? `?cursor=${cursor}` : ''));
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return (await res.json()) as TaskListResponse;
    },
  });
}
