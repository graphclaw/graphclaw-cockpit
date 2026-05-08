// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// Timeline Hierarchical Gantt — shared TypeScript interfaces (Wave 4b)

export type ZoomLevel = 'week' | 'month' | 'quarter';

export type ActiveFilter = 'all' | 'active' | 'blocked' | 'delayed';

/** Day-column widths per zoom level (px) */
export const ZOOM_DAY_WIDTH: Record<ZoomLevel, number> = {
  week: 56,
  month: 28,
  quarter: 8,
};

export type RowKind = 'goal' | 'composite' | 'atomic';

/** A single row in the left-panel hierarchy tree + Gantt area */
export interface TimelineRow {
  id: string;
  title: string;
  kind: RowKind;
  depth: number;          // 0 = goal, 1 = composite, 2 = atomic
  state: string;
  priority?: string;
  assignee?: string;
  taskType?: string;      // COMPOSITE | ATOMIC | MILESTONE
  parentId?: string;
  childIds: string[];
  hasChildren: boolean;

  // Resolved dates (null = undated row)
  startDate: Date | null;
  endDate: Date | null;
  progress: number;       // 0–100
  isDated: boolean;

  // Source task fields for tooltip
  deadline?: string;
  createdAt?: string;
  score?: number;
  estimatedEffortDays?: number;
}

/** A rendered Gantt bar (derived from TimelineRow) */
export interface GanttBar {
  rowId: string;
  kind: RowKind;
  state: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  /** Left offset in pixels from view start */
  left: number;
  /** Width in pixels */
  width: number;
}

/** A dependency edge between two tasks */
export interface DependencyEdge {
  fromId: string;   // predecessor
  toId: string;     // successor
  edgeType: string; // e.g. DEPENDS_ON, BLOCKS
  isBlocking: boolean;
}

/** Computed time-axis view range */
export interface ViewRange {
  start: Date;
  end: Date;
  totalDays: number;
}
