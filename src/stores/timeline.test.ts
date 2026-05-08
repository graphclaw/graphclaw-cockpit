// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// Unit tests for timeline Zustand store (Wave 4b)
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { addDays, startOfDay } from 'date-fns';

// Reset module between tests to get a fresh store
import { useTimelineStore } from './timeline';

describe('useTimelineStore', () => {
  beforeEach(() => {
    // Reset to defaults
    act(() => {
      useTimelineStore.setState({
        zoom: 'month',
        viewStartDate: addDays(startOfDay(new Date()), -14),
        viewEndDate: addDays(startOfDay(new Date()), 76),
        expandedIds: new Set<string>(),
        selectedRowId: null,
        activeFilters: ['all'],
      });
    });
  });

  it('setZoom changes zoom level', () => {
    act(() => useTimelineStore.getState().setZoom('week'));
    expect(useTimelineStore.getState().zoom).toBe('week');
  });

  it('toggleExpand adds an id to expandedIds', () => {
    act(() => useTimelineStore.getState().toggleExpand('goal-1'));
    expect(useTimelineStore.getState().expandedIds.has('goal-1')).toBe(true);
  });

  it('toggleExpand removes an already-expanded id', () => {
    act(() => {
      useTimelineStore.getState().toggleExpand('goal-1');
      useTimelineStore.getState().toggleExpand('goal-1');
    });
    expect(useTimelineStore.getState().expandedIds.has('goal-1')).toBe(false);
  });

  it('expandAll sets all provided ids as expanded', () => {
    act(() => useTimelineStore.getState().expandAll(['g1', 'g2', 'g3']));
    const { expandedIds } = useTimelineStore.getState();
    expect(expandedIds.has('g1')).toBe(true);
    expect(expandedIds.has('g2')).toBe(true);
    expect(expandedIds.has('g3')).toBe(true);
  });

  it('collapseAll empties expandedIds', () => {
    act(() => {
      useTimelineStore.getState().expandAll(['g1', 'g2']);
      useTimelineStore.getState().collapseAll();
    });
    expect(useTimelineStore.getState().expandedIds.size).toBe(0);
  });

  it('toggleFilter sets filter correctly and clears all when only-filter clicked', () => {
    act(() => useTimelineStore.getState().toggleFilter('blocked'));
    expect(useTimelineStore.getState().activeFilters).toContain('blocked');
    expect(useTimelineStore.getState().activeFilters).not.toContain('all');
  });

  it('toggleFilter("all") resets to all', () => {
    act(() => {
      useTimelineStore.getState().toggleFilter('blocked');
      useTimelineStore.getState().toggleFilter('all');
    });
    expect(useTimelineStore.getState().activeFilters).toEqual(['all']);
  });

  it('shiftView moves viewStartDate forward', () => {
    const before = useTimelineStore.getState().viewStartDate.getTime();
    act(() => useTimelineStore.getState().shiftView('next'));
    const after = useTimelineStore.getState().viewStartDate.getTime();
    expect(after).toBeGreaterThan(before);
  });

  it('jumpToToday resets view to 14 days before today', () => {
    act(() => useTimelineStore.getState().jumpToToday());
    const today = startOfDay(new Date()).getTime();
    const start = useTimelineStore.getState().viewStartDate.getTime();
    expect(start).toBe(addDays(new Date(today), -14).setHours(0, 0, 0, 0));
  });
});
