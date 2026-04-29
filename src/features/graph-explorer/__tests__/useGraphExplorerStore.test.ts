/**
 * Unit tests for useGraphExplorerStore.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGraphExplorerStore } from '../hooks/useGraphExplorerStore';

// Reset store state before each test
beforeEach(() => {
  useGraphExplorerStore.setState({
    filterPanelOpen: true,
    inspectorOpen: false,
    layout: 'dagre',
    mode: 'select',
    selection: null,
    filters: {
      preset: 'all',
      showTasks: true,
      showGoals: true,
      showResources: true,
      showConstraints: true,
      taskStates: new Set([
        'ACTIVE', 'IN_PROGRESS', 'BLOCKED', 'DELAYED', 'PENDING',
        'COMPLETE', 'CANCELLED', 'SNOOZED', 'NEEDS_REVIEW', 'INACTIVE_PENDING',
      ]),
      goalStates: new Set(['ACTIVE', 'IN_PROGRESS', 'COMPLETE', 'ARCHIVED']),
      taskTypes: new Set(),
      priorities: new Set(),
      dueThisWeek: false,
      dueThisMonth: false,
      overdueOnly: false,
      noDeadline: false,
      edgeTypes: new Set([
        'DEPENDS_ON', 'BLOCKS', 'PART_OF', 'FOLLOW_UP_FOR',
        'SPAWNED_FROM', 'ASSIGNED_TO', 'OWNED_BY', 'APPLIES_TO',
        'INFORMS', 'BRANCHED_FROM', 'BATCHED_IN', 'REFERRED_BY',
      ]),
      onCriticalPath: false,
      hasBlockingDep: false,
      scoreAbove: false,
      scoreBelow: false,
    },
    activeFilterCount: 0,
  });
});

describe('useGraphExplorerStore', () => {
  it('starts with all node types visible', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    expect(result.current.filters.showTasks).toBe(true);
    expect(result.current.filters.showGoals).toBe(true);
    expect(result.current.filters.showResources).toBe(true);
    expect(result.current.filters.showConstraints).toBe(true);
  });

  it('toggleNodeType hides tasks', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    act(() => {
      result.current.toggleNodeType('showTasks');
    });
    expect(result.current.filters.showTasks).toBe(false);
  });

  it('applyPreset(blocked) sets task states to BLOCKED only', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    act(() => {
      result.current.applyPreset('blocked');
    });
    expect(result.current.filters.preset).toBe('blocked');
    expect(result.current.filters.taskStates.has('BLOCKED')).toBe(true);
    expect(result.current.filters.taskStates.has('ACTIVE')).toBe(false);
    expect(result.current.filters.showGoals).toBe(false);
  });

  it('applyPreset(all) shows all node types', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    act(() => {
      result.current.applyPreset('blocked');
      result.current.applyPreset('all');
    });
    expect(result.current.filters.preset).toBe('all');
    expect(result.current.filters.showGoals).toBe(true);
    expect(result.current.filters.showTasks).toBe(true);
  });

  it('toggleTaskState removes a state from the set', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    act(() => {
      result.current.toggleTaskState('ACTIVE');
    });
    expect(result.current.filters.taskStates.has('ACTIVE')).toBe(false);
    expect(result.current.activeFilterCount).toBeGreaterThan(0);
  });

  it('toggleTaskState re-adds the state', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    act(() => {
      result.current.toggleTaskState('ACTIVE');
      result.current.toggleTaskState('ACTIVE');
    });
    expect(result.current.filters.taskStates.has('ACTIVE')).toBe(true);
  });

  it('resetFilters clears all filters', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    act(() => {
      result.current.applyPreset('blocked');
      result.current.toggleNodeType('showTasks');
      result.current.resetFilters();
    });
    expect(result.current.filters.preset).toBe('all');
    expect(result.current.filters.showTasks).toBe(true);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('setSelection opens inspector panel', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    act(() => {
      result.current.setSelection({ kind: 'node', id: 'TSK-123' });
    });
    expect(result.current.selection).toEqual({ kind: 'node', id: 'TSK-123' });
    expect(result.current.inspectorOpen).toBe(true);
  });

  it('clearSelection closes inspector panel', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    act(() => {
      result.current.setSelection({ kind: 'node', id: 'TSK-123' });
      result.current.clearSelection();
    });
    expect(result.current.selection).toBeNull();
    expect(result.current.inspectorOpen).toBe(false);
  });

  it('setAllEdgeTypes(false) empties edge types set', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    act(() => {
      result.current.setAllEdgeTypes(false);
    });
    expect(result.current.filters.edgeTypes.size).toBe(0);
  });

  it('toggleEdgeType removes then re-adds', () => {
    const { result } = renderHook(() => useGraphExplorerStore());
    act(() => { result.current.toggleEdgeType('BLOCKS'); });
    expect(result.current.filters.edgeTypes.has('BLOCKS')).toBe(false);
    act(() => { result.current.toggleEdgeType('BLOCKS'); });
    expect(result.current.filters.edgeTypes.has('BLOCKS')).toBe(true);
  });
});
