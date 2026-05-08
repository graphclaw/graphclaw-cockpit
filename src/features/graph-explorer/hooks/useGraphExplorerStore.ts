// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * Graph Explorer — Zustand store.
 *
 * Manages: filter state, selection, interaction mode, layout, panel collapse.
 * Persists layout preference only (not filters — they reset on page load).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FilterPreset,
  GraphExplorerFilters,
  InteractionMode,
  LayoutName,
  ExplorerSelection,
  TaskState,
  GoalState,
  TaskType,
  Priority,
  EdgeType,
} from '../types';
import { ALL_EDGE_TYPES, TASK_STATES, GOAL_STATES } from '../types';

// ── Preset definitions ────────────────────────────────────────────────────────

function buildDefaultFilters(): GraphExplorerFilters {
  return {
    preset: 'all',
    showTasks: true,
    showGoals: true,
    showResources: true,
    showConstraints: true,
    taskStates: new Set(TASK_STATES),
    goalStates: new Set(GOAL_STATES),
    taskTypes: new Set(),
    priorities: new Set(),
    dueThisWeek: false,
    dueThisMonth: false,
    overdueOnly: false,
    noDeadline: false,
    edgeTypes: new Set(ALL_EDGE_TYPES),
    onCriticalPath: false,
    hasBlockingDep: false,
    scoreAbove: false,
    scoreBelow: false,
  };
}

function buildPresetFilters(preset: FilterPreset): GraphExplorerFilters {
  const base = buildDefaultFilters();
  switch (preset) {
    case 'active_work':
      return {
        ...base,
        preset: 'active_work',
        showGoals: false,
        showResources: false,
        showConstraints: false,
        taskStates: new Set(['ACTIVE', 'IN_PROGRESS'] as TaskState[]),
      };
    case 'blocked':
      return {
        ...base,
        preset: 'blocked',
        showGoals: false,
        showResources: false,
        showConstraints: false,
        taskStates: new Set(['BLOCKED'] as TaskState[]),
      };
    case 'critical_path':
      return {
        ...base,
        preset: 'critical_path',
        onCriticalPath: true,
      };
    case 'my_tasks':
      // My tasks — tasks only; backend filtering handled by useGraphExplorerData
      return {
        ...base,
        preset: 'my_tasks',
        showGoals: false,
        showResources: false,
        showConstraints: false,
      };
    case 'overdue':
      return {
        ...base,
        preset: 'overdue',
        showGoals: false,
        showResources: false,
        showConstraints: false,
        overdueOnly: true,
      };
    default:
      return { ...base, preset: 'all' };
  }
}

// ── Store interface ───────────────────────────────────────────────────────────

interface GraphExplorerState {
  // UI
  filterPanelOpen: boolean;
  inspectorOpen: boolean;
  layout: LayoutName;
  mode: InteractionMode;

  // Selection
  selection: ExplorerSelection;

  // Filters
  filters: GraphExplorerFilters;

  // Active filter count (derived, computed on set)
  activeFilterCount: number;

  // Actions
  toggleFilterPanel: () => void;
  setLayout: (layout: LayoutName) => void;
  setMode: (mode: InteractionMode) => void;
  setSelection: (sel: ExplorerSelection) => void;
  clearSelection: () => void;

  // Preset
  applyPreset: (preset: FilterPreset) => void;

  // Node type toggles
  toggleNodeType: (kind: 'showTasks' | 'showGoals' | 'showResources' | 'showConstraints') => void;

  // Task state chips
  toggleTaskState: (state: TaskState) => void;
  setAllTaskStates: (on: boolean) => void;

  // Goal state chips
  toggleGoalState: (state: GoalState) => void;

  // Task type chips
  toggleTaskType: (type: TaskType) => void;

  // Priority chips
  togglePriority: (priority: Priority) => void;

  // Timeline flags
  toggleTimelineFlag: (flag: 'dueThisWeek' | 'dueThisMonth' | 'overdueOnly' | 'noDeadline') => void;

  // Edge types
  toggleEdgeType: (type: EdgeType | string) => void;
  setAllEdgeTypes: (on: boolean) => void;

  // Risk flags
  toggleRiskFlag: (flag: 'onCriticalPath' | 'hasBlockingDep' | 'scoreAbove' | 'scoreBelow') => void;

  // Reset all
  resetFilters: () => void;
}

function countActiveFilters(f: GraphExplorerFilters): number {
  if (f.preset !== 'all') return 1;
  let count = 0;
  if (!f.showTasks || !f.showGoals || !f.showResources || !f.showConstraints) count++;
  if (f.taskStates.size < TASK_STATES.length) count++;
  if (f.goalStates.size < GOAL_STATES.length) count++;
  if (f.taskTypes.size > 0) count++;
  if (f.priorities.size > 0) count++;
  if (f.dueThisWeek || f.dueThisMonth || f.overdueOnly || f.noDeadline) count++;
  if (f.edgeTypes.size < ALL_EDGE_TYPES.length) count++;
  if (f.onCriticalPath || f.hasBlockingDep || f.scoreAbove || f.scoreBelow) count++;
  return count;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGraphExplorerStore = create<GraphExplorerState>()(
  persist(
    (set, get) => {
      const updateFilters = (updater: (f: GraphExplorerFilters) => GraphExplorerFilters) => {
        set((s) => {
          const filters = updater(s.filters);
          return { filters, activeFilterCount: countActiveFilters(filters) };
        });
      };

      return {
        // UI
        filterPanelOpen: true,
        inspectorOpen: false,
        layout: 'dagre',
        mode: 'select',
        selection: null,
        filters: buildDefaultFilters(),
        activeFilterCount: 0,

        toggleFilterPanel: () =>
          set((s) => ({ filterPanelOpen: !s.filterPanelOpen })),

        setLayout: (layout) => set({ layout }),

        setMode: (mode) => set({ mode }),

        setSelection: (selection) =>
          set({ selection, inspectorOpen: selection !== null }),

        clearSelection: () => set({ selection: null, inspectorOpen: false }),

        applyPreset: (preset) => {
          const filters = buildPresetFilters(preset);
          set({ filters, activeFilterCount: countActiveFilters(filters) });
        },

        toggleNodeType: (key) => {
          updateFilters((f) => ({ ...f, [key]: !f[key] }));
        },

        toggleTaskState: (state) => {
          updateFilters((f) => {
            const s = new Set(f.taskStates);
            if (s.has(state)) {
              s.delete(state);
            } else {
              s.add(state);
            }
            return { ...f, taskStates: s };
          });
        },

        setAllTaskStates: (on) => {
          updateFilters((f) => ({
            ...f,
            taskStates: on ? new Set(TASK_STATES) : new Set(),
          }));
        },

        toggleGoalState: (state) => {
          updateFilters((f) => {
            const s = new Set(f.goalStates);
            if (s.has(state)) {
              s.delete(state);
            } else {
              s.add(state);
            }
            return { ...f, goalStates: s };
          });
        },

        toggleTaskType: (type) => {
          updateFilters((f) => {
            const s = new Set(f.taskTypes);
            if (s.has(type)) {
              s.delete(type);
            } else {
              s.add(type);
            }
            return { ...f, taskTypes: s };
          });
        },

        togglePriority: (priority) => {
          updateFilters((f) => {
            const s = new Set(f.priorities);
            if (s.has(priority)) {
              s.delete(priority);
            } else {
              s.add(priority);
            }
            return { ...f, priorities: s };
          });
        },

        toggleTimelineFlag: (flag) => {
          updateFilters((f) => ({ ...f, [flag]: !f[flag] }));
        },

        toggleEdgeType: (type) => {
          updateFilters((f) => {
            const s = new Set(f.edgeTypes);
            if (s.has(type)) {
              s.delete(type);
            } else {
              s.add(type);
            }
            return { ...f, edgeTypes: s };
          });
        },

        setAllEdgeTypes: (on) => {
          updateFilters((f) => ({
            ...f,
            edgeTypes: on ? new Set(ALL_EDGE_TYPES) : new Set(),
          }));
        },

        toggleRiskFlag: (flag) => {
          updateFilters((f) => ({ ...f, [flag]: !f[flag] }));
        },

        resetFilters: () => {
          const filters = buildDefaultFilters();
          set({ filters, activeFilterCount: 0 });
        },

        // Suppress TS unused warning
        _get: get,
      } as GraphExplorerState & { _get: typeof get };
    },
    {
      name: 'gc-graph-explorer',
      partialize: (s) => ({ layout: s.layout, filterPanelOpen: s.filterPanelOpen }),
    },
  ),
);
