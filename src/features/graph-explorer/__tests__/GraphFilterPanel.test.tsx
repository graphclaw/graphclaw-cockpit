/**
 * Unit tests for GraphFilterPanel component.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphFilterPanel } from '../components/GraphFilterPanel';
import { useGraphExplorerStore } from '../hooks/useGraphExplorerStore';

// Reset Zustand store before each test
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

describe('GraphFilterPanel', () => {
  it('renders without crashing', () => {
    render(<GraphFilterPanel />);
    expect(screen.getByTestId('graph-filter-panel')).toBeTruthy();
  });

  it('shows all preset chips', () => {
    render(<GraphFilterPanel />);
    expect(screen.getByTestId('preset-all')).toBeTruthy();
    expect(screen.getByTestId('preset-active_work')).toBeTruthy();
    expect(screen.getByTestId('preset-blocked')).toBeTruthy();
    expect(screen.getByTestId('preset-critical_path')).toBeTruthy();
    expect(screen.getByTestId('preset-my_tasks')).toBeTruthy();
    expect(screen.getByTestId('preset-overdue')).toBeTruthy();
  });

  it('clicking a preset chip applies it to the store', () => {
    render(<GraphFilterPanel />);
    fireEvent.click(screen.getByTestId('preset-blocked'));
    const state = useGraphExplorerStore.getState();
    expect(state.filters.preset).toBe('blocked');
  });

  it('does not show active filter count badge when no filters active', () => {
    render(<GraphFilterPanel />);
    expect(screen.queryByTestId('active-filter-count')).toBeNull();
  });

  it('shows filter count badge after applying non-all preset', () => {
    render(<GraphFilterPanel />);
    fireEvent.click(screen.getByTestId('preset-blocked'));
    expect(screen.getByTestId('active-filter-count')).toBeTruthy();
  });

  it('reset button clears all filters', () => {
    render(<GraphFilterPanel />);
    fireEvent.click(screen.getByTestId('preset-blocked'));
    // Reset button should appear
    const resetBtn = screen.getByTestId('reset-filters');
    fireEvent.click(resetBtn);
    const state = useGraphExplorerStore.getState();
    expect(state.filters.preset).toBe('all');
    expect(state.activeFilterCount).toBe(0);
  });

  it('node type toggle button toggles tasks visibility', () => {
    render(<GraphFilterPanel />);
    fireEvent.click(screen.getByTestId('node-type-showTasks'));
    expect(useGraphExplorerStore.getState().filters.showTasks).toBe(false);
    // Count badge should appear
    expect(screen.getByTestId('active-filter-count')).toBeTruthy();
  });

  it('task state chip toggles state off', () => {
    render(<GraphFilterPanel />);
    fireEvent.click(screen.getByTestId('state-chip-BLOCKED'));
    expect(useGraphExplorerStore.getState().filters.taskStates.has('BLOCKED')).toBe(false);
  });

  it('collapsible section toggles open/closed', () => {
    render(<GraphFilterPanel />);
    // Task Filters section is open by default; toggle it closed
    const toggle = screen.getByTestId('section-toggle-task-filters');
    fireEvent.click(toggle);
    // Priority chips should be hidden now (not rendered)
    expect(screen.queryByTestId('priority-chip-CRITICAL')).toBeNull();
    // Click again to re-open
    fireEvent.click(toggle);
    expect(screen.getByTestId('priority-chip-CRITICAL')).toBeTruthy();
  });

  it('goal state chip toggles goal state', () => {
    render(<GraphFilterPanel />);
    fireEvent.click(screen.getByTestId('goal-state-ACTIVE'));
    expect(useGraphExplorerStore.getState().filters.goalStates.has('ACTIVE')).toBe(false);
  });
});
