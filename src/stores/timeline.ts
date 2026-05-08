// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// Timeline Gantt — Zustand store (Wave 4b)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type ActiveFilter, type ZoomLevel } from '@/features/graph/timeline/types';
import { addDays, startOfDay } from 'date-fns';

interface TimelineState {
  zoom: ZoomLevel;
  viewStartDate: Date;
  viewEndDate: Date;
  expandedIds: Set<string>;
  selectedRowId: string | null;
  activeFilters: ActiveFilter[];

  setZoom: (zoom: ZoomLevel) => void;
  shiftView: (direction: 'prev' | 'next') => void;
  jumpToToday: () => void;
  toggleExpand: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
  setSelectedRowId: (id: string | null) => void;
  setFilters: (filters: ActiveFilter[]) => void;
  toggleFilter: (filter: ActiveFilter) => void;
}

const DEFAULT_ZOOM: ZoomLevel = 'month';
const today = startOfDay(new Date());

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      zoom: DEFAULT_ZOOM,
      viewStartDate: addDays(today, -14),
      viewEndDate: addDays(today, 76),
      expandedIds: new Set<string>(),
      selectedRowId: null,
      activeFilters: ['all'],

      setZoom: (zoom) => set({ zoom }),

      shiftView: (direction) => {
        const { zoom, viewStartDate, viewEndDate } = get();
        const shiftDays = zoom === 'week' ? 7 : zoom === 'month' ? 30 : 90;
        const delta = direction === 'next' ? shiftDays : -shiftDays;
        set({
          viewStartDate: addDays(viewStartDate, delta),
          viewEndDate: addDays(viewEndDate, delta),
        });
      },

      jumpToToday: () => {
        const t = startOfDay(new Date());
        set({
          viewStartDate: addDays(t, -14),
          viewEndDate: addDays(t, 76),
        });
      },

      toggleExpand: (id) => {
        const expanded = new Set(get().expandedIds);
        if (expanded.has(id)) {
          expanded.delete(id);
        } else {
          expanded.add(id);
        }
        set({ expandedIds: expanded });
      },

      expandAll: (ids) => set({ expandedIds: new Set(ids) }),

      collapseAll: () => set({ expandedIds: new Set<string>() }),

      setSelectedRowId: (id) => set({ selectedRowId: id }),

      setFilters: (filters) => set({ activeFilters: filters }),

      toggleFilter: (filter) => {
        const { activeFilters } = get();
        if (filter === 'all') {
          set({ activeFilters: ['all'] });
          return;
        }
        const without = activeFilters.filter((f) => f !== 'all' && f !== filter);
        const next = activeFilters.includes(filter) ? without : [...without, filter];
        set({ activeFilters: next.length === 0 ? ['all'] : next });
      },
    }),
    {
      name: 'gc-timeline',
      // Serialize/deserialize Set and Date properly
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          const parsed = JSON.parse(raw) as {
            state: {
              expandedIds?: string[];
              viewStartDate?: string;
              viewEndDate?: string;
              zoom?: ZoomLevel;
              activeFilters?: ActiveFilter[];
              selectedRowId?: string | null;
            };
            version: number;
          };
          const s = parsed.state;
          return {
            state: {
              ...s,
              expandedIds: new Set<string>(s.expandedIds ?? []),
              viewStartDate: s.viewStartDate ? new Date(s.viewStartDate) : addDays(startOfDay(new Date()), -14),
              viewEndDate: s.viewEndDate ? new Date(s.viewEndDate) : addDays(startOfDay(new Date()), 76),
            },
            version: parsed.version,
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              expandedIds: [...(value.state.expandedIds as Set<string>)],
              viewStartDate: (value.state.viewStartDate as Date).toISOString(),
              viewEndDate: (value.state.viewEndDate as Date).toISOString(),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
