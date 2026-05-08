// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// Timeline Hierarchical Gantt — date math utilities using date-fns (Wave 4b)
import {
  addDays,
  differenceInDays,
  format,
  isSameDay,
  isWeekend,
  parseISO,
  startOfDay,
} from 'date-fns';

import { type ViewRange, type ZoomLevel } from './types';

// ── Date resolution (DR-11) ──────────────────────────────────────────────────

interface RawTaskDates {
  started_at?: string | null;
  created_at?: string | null;
  deadline?: string | null;
  estimated_effort_days?: number | null;
}

export interface ResolvedDates {
  startDate: Date | null;
  endDate: Date | null;
  isDated: boolean;
}

/**
 * Resolves a task's start and end dates using the DR-11 fallback chain:
 * - start: started_at → created_at → null
 * - end:   deadline → start + estimated_effort_days → start + 7d → null
 */
export function resolveTaskDates(task: RawTaskDates): ResolvedDates {
  const startRaw = task.started_at ?? task.created_at ?? null;
  if (!startRaw) {
    return { startDate: null, endDate: null, isDated: false };
  }

  const startDate = startOfDay(parseISO(startRaw));

  let endDate: Date;
  if (task.deadline) {
    endDate = startOfDay(parseISO(task.deadline));
  } else if (task.estimated_effort_days && task.estimated_effort_days > 0) {
    endDate = addDays(startDate, task.estimated_effort_days);
  } else {
    endDate = addDays(startDate, 7);
  }

  // Ensure end >= start (defensive)
  if (endDate <= startDate) {
    endDate = addDays(startDate, 1);
  }

  return { startDate, endDate, isDated: true };
}

// ── View range computation ───────────────────────────────────────────────────

/** Pads the view 14 days before the earliest start and after the latest end */
export function computeViewRange(
  rows: Array<{ startDate: Date | null; endDate: Date | null }>,
  zoom: ZoomLevel,
): ViewRange {
  const today = startOfDay(new Date());

  const starts = rows
    .map((r) => r.startDate)
    .filter((d): d is Date => d !== null);
  const ends = rows
    .map((r) => r.endDate)
    .filter((d): d is Date => d !== null);

  // Minimum 90-day view (DR-2)
  const minDays = zoom === 'week' ? 42 : zoom === 'month' ? 90 : 180;

  const earliest = starts.length > 0 ? starts.reduce((a, b) => (a < b ? a : b)) : today;
  const latest = ends.length > 0 ? ends.reduce((a, b) => (a > b ? a : b)) : addDays(today, minDays);

  const rangeStart = addDays(Math.min(earliest.getTime(), today.getTime()) > 0 ? earliest : today, -14);
  const rangeEnd = addDays(latest, 14);

  const totalDays = Math.max(differenceInDays(rangeEnd, rangeStart) + 1, minDays);
  const adjustedEnd = addDays(rangeStart, totalDays - 1);

  return { start: rangeStart, end: adjustedEnd, totalDays };
}

// ── Pixel offset helpers ─────────────────────────────────────────────────────

/** Left pixel offset of a date from the view start */
export function dayOffset(date: Date, viewStart: Date, dayWidth: number): number {
  return Math.max(0, differenceInDays(date, viewStart)) * dayWidth;
}

/** Pixel width of a date range */
export function barWidth(startDate: Date, endDate: Date, dayWidth: number): number {
  return Math.max(dayWidth, differenceInDays(endDate, startDate) * dayWidth);
}

// ── Header label helpers ─────────────────────────────────────────────────────

export interface DayHeader {
  date: Date;
  dayNum: string;
  isToday: boolean;
  isWeekendDay: boolean;
  monthLabel: string | null; // Non-null only on first day of each month
}

/**
 * Builds the day-by-day header descriptor array for the Gantt time axis.
 */
export function buildDayHeaders(viewStart: Date, totalDays: number): DayHeader[] {
  const today = startOfDay(new Date());
  const headers: DayHeader[] = [];

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(viewStart, i);
    const isFirst = date.getDate() === 1;
    headers.push({
      date,
      dayNum: format(date, 'd'),
      isToday: isSameDay(date, today),
      isWeekendDay: isWeekend(date),
      monthLabel: isFirst || i === 0 ? format(date, 'MMMM yyyy') : null,
    });
  }

  return headers;
}

/** Returns the pixel offset of today's line from the view start. Returns null if today is out of range. */
export function todayOffset(viewStart: Date, viewEnd: Date, dayWidth: number): number | null {
  const today = startOfDay(new Date());
  if (today < viewStart || today > viewEnd) return null;
  return dayOffset(today, viewStart, dayWidth);
}

// Re-export isWeekend for use in components
export { isWeekend };
