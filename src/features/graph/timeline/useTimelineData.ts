// Timeline Hierarchical Gantt — composite data hook (Wave 4b)
import { useMemo } from 'react';

import { useGoals, useTasks, type TaskItem } from '@/lib/api-hooks';
import { resolveTaskDates } from './date-utils';
import { type ActiveFilter, type RowKind, type TimelineRow } from './types';
import { useTimelineStore } from '@/stores/timeline';

// ── Build flat row list from goals + tasks ───────────────────────────────────

function taskToRow(task: TaskItem, depth: number, kind: RowKind): TimelineRow {
  const { startDate, endDate, isDated } = resolveTaskDates({
    started_at: task.started_at,
    created_at: task.created_at,
    deadline: task.deadline,
    estimated_effort_days: task.estimated_effort_days,
  });

  return {
    id: task.id,
    title: task.title,
    kind,
    depth,
    state: task.state,
    priority: task.priority,
    assignee: task.assigned_to,
    taskType: task.task_type,
    parentId: task.parent_id ?? task.goal_id,
    childIds: [],
    hasChildren: false,
    startDate,
    endDate,
    progress: task.progress ?? 0,
    isDated,
    deadline: task.deadline,
    createdAt: task.created_at,
    score: task.score,
    estimatedEffortDays: task.estimated_effort_days,
  };
}

function matchesFilter(row: TimelineRow, filters: ActiveFilter[]): boolean {
  if (filters.includes('all')) return true;
  const state = row.state.toUpperCase();
  if (filters.includes('active') && ['ACTIVE', 'IN_PROGRESS'].includes(state)) return true;
  if (filters.includes('blocked') && state === 'BLOCKED') return true;
  if (filters.includes('delayed') && state === 'DELAYED') return true;
  return false;
}

// ── Main hook ────────────────────────────────────────────────────────────────

export interface TimelineData {
  rows: TimelineRow[];
  visibleRows: TimelineRow[];
  allIds: string[];
  goalIds: string[];
  isLoading: boolean;
  isError: boolean;
}

export function useTimelineData(): TimelineData {
  const { expandedIds, activeFilters } = useTimelineStore();

  const goalsQuery = useGoals();
  const tasksQuery = useTasks();

  const isLoading = goalsQuery.isLoading || tasksQuery.isLoading;
  const isError = goalsQuery.isError || tasksQuery.isError;

  const rows = useMemo<TimelineRow[]>(() => {
    if (!goalsQuery.data || !tasksQuery.data) return [];

    const goals = goalsQuery.data.items;
    const tasks = tasksQuery.data.items;

    // Separate out goals (COMPOSITE with no parent) vs composites vs atomics
    // Goals = items from the goals endpoint
    const goalIds = new Set(goals.map((g) => g.id));

    // Find composite tasks that belong to goals (parent_id or goal_id is a goal)
    // Find atomic tasks that belong to composites or directly to goals
    const rowMap = new Map<string, TimelineRow>();
    const goalRows: TimelineRow[] = [];

    // 1. Add all goals as depth-0 rows
    for (const goal of goals) {
      const asTask: TaskItem = {
        id: goal.id,
        title: goal.title,
        state: goal.state,
        score: 0,
        priority: goal.priority,
        assigned_to: goal.assignee,
        task_type: 'COMPOSITE',
        progress: goal.progress,
        started_at: goal.started_at,
        created_at: goal.created_at,
        deadline: goal.deadline,
        estimated_effort_days: goal.estimated_effort_days,
        parent_id: undefined,
        goal_id: undefined,
      };
      const row = taskToRow(asTask, 0, 'goal');
      rowMap.set(row.id, row);
      goalRows.push(row);
    }

    // 2. Add tasks, determining depth based on parent relationships
    for (const task of tasks) {
      if (goalIds.has(task.id)) continue; // already added as goal row

      const parentId = task.parent_id ?? task.goal_id;
      const parentRow = parentId ? rowMap.get(parentId) : undefined;
      const kind: RowKind = task.task_type === 'COMPOSITE' ? 'composite' : 'atomic';
      const depth = parentRow ? parentRow.depth + 1 : 1;

      const row = taskToRow(task, Math.min(depth, 2) as 0 | 1 | 2, kind);
      rowMap.set(row.id, row);

      if (parentRow) {
        parentRow.childIds.push(row.id);
        parentRow.hasChildren = true;
      }
    }

    // Compute hasChildren for goal rows based on whether any task has that goal_id
    for (const task of tasks) {
      const gid = task.goal_id;
      if (gid && rowMap.has(gid)) {
        const goalRow = rowMap.get(gid)!;
        goalRow.hasChildren = true;
        if (!goalRow.childIds.includes(task.id)) {
          goalRow.childIds.push(task.id);
        }
      }
    }

    // 3. Compute goal/composite span dates from children
    const updateSpanFromChildren = (row: TimelineRow) => {
      if (row.childIds.length === 0) return;
      const childRows = row.childIds.map((id) => rowMap.get(id)).filter(Boolean) as TimelineRow[];
      childRows.forEach(updateSpanFromChildren);
      const starts = childRows.map((r) => r.startDate).filter(Boolean) as Date[];
      const ends = childRows.map((r) => r.endDate).filter(Boolean) as Date[];
      if (starts.length > 0 && !row.startDate) {
        row.startDate = starts.reduce((a, b) => (a < b ? a : b));
        row.isDated = true;
      }
      if (ends.length > 0 && !row.endDate) {
        row.endDate = ends.reduce((a, b) => (a > b ? a : b));
      }
    };

    for (const goalRow of goalRows) {
      updateSpanFromChildren(goalRow);
    }

    // 4. Produce DFS ordered row list (goals first, then their children, etc.)
    const orderedRows: TimelineRow[] = [];
    const visited = new Set<string>();

    const dfs = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const row = rowMap.get(id);
      if (!row) return;
      orderedRows.push(row);
      for (const childId of row.childIds) {
        dfs(childId);
      }
    };

    for (const goalRow of goalRows) {
      dfs(goalRow.id);
    }

    // Also add orphan tasks (no goal_id or parent) at depth 1
    for (const task of tasks) {
      if (!visited.has(task.id)) {
        const row = rowMap.get(task.id);
        if (row) orderedRows.push(row);
      }
    }

    return orderedRows;
  }, [goalsQuery.data, tasksQuery.data]);

  const allIds = useMemo(() => rows.filter((r) => r.hasChildren).map((r) => r.id), [rows]);
  const goalIds = useMemo(() => rows.filter((r) => r.kind === 'goal').map((r) => r.id), [rows]);

  const visibleRows = useMemo(() => {
    // Determine which rows to show based on expanded state and filters
    const visible: TimelineRow[] = [];
    const hiddenParents = new Set<string>();

    for (const row of rows) {
      // Check if any ancestor is collapsed
      if (row.parentId && hiddenParents.has(row.parentId)) {
        hiddenParents.add(row.id);
        continue;
      }

      // For non-goal rows: check if parent is expanded
      if (row.depth > 0 && row.parentId) {
        if (!expandedIds.has(row.parentId)) {
          hiddenParents.add(row.id);
          continue;
        }
      }

      // Filter check — apply filters to leaf rows only; parent rows always show if they have visible children
      if (!matchesFilter(row, activeFilters) && row.kind === 'atomic') {
        continue;
      }

      visible.push(row);
    }

    return visible;
  }, [rows, expandedIds, activeFilters]);

  return { rows, visibleRows, allIds, goalIds, isLoading, isError };
}
