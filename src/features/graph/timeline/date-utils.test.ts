// Unit tests for timeline date-utils (Wave 4b)
import { describe, expect, it } from 'vitest';
import { addDays } from 'date-fns';

import { resolveTaskDates, computeViewRange, dayOffset, barWidth } from './date-utils';

describe('resolveTaskDates', () => {
  it('returns null dates when no start info provided', () => {
    const result = resolveTaskDates({});
    expect(result.isDated).toBe(false);
    expect(result.startDate).toBeNull();
    expect(result.endDate).toBeNull();
  });

  it('uses started_at as start date when available', () => {
    const result = resolveTaskDates({ started_at: '2026-04-01' });
    expect(result.isDated).toBe(true);
    expect(result.startDate?.toISOString().slice(0, 10)).toBe('2026-04-01');
  });

  it('falls back to created_at when started_at is absent', () => {
    const result = resolveTaskDates({ created_at: '2026-03-15' });
    expect(result.isDated).toBe(true);
    expect(result.startDate?.toISOString().slice(0, 10)).toBe('2026-03-15');
  });

  it('uses deadline as end date when provided', () => {
    const result = resolveTaskDates({
      started_at: '2026-04-01',
      deadline: '2026-04-15',
    });
    expect(result.endDate?.toISOString().slice(0, 10)).toBe('2026-04-15');
  });

  it('uses estimated_effort_days when deadline absent', () => {
    const result = resolveTaskDates({
      started_at: '2026-04-01',
      estimated_effort_days: 5,
    });
    expect(result.endDate?.toISOString().slice(0, 10)).toBe('2026-04-06');
  });

  it('defaults to start + 7 days when no deadline or effort provided', () => {
    const result = resolveTaskDates({ started_at: '2026-04-01' });
    expect(result.endDate?.toISOString().slice(0, 10)).toBe('2026-04-08');
  });

  it('ensures end date is at least 1 day after start', () => {
    const result = resolveTaskDates({
      started_at: '2026-04-01',
      deadline: '2026-04-01',
    });
    expect(result.endDate!.getTime()).toBeGreaterThan(result.startDate!.getTime());
  });
});

describe('computeViewRange', () => {
  it('returns minimum 90-day range for month zoom', () => {
    const result = computeViewRange([], 'month');
    expect(result.totalDays).toBeGreaterThanOrEqual(90);
  });

  it('includes 14-day padding before earliest start', () => {
    const start = new Date('2026-05-01T00:00:00');
    const result = computeViewRange([{ startDate: start, endDate: addDays(start, 30) }], 'month');
    expect(result.start.getTime()).toBeLessThan(start.getTime());
  });
});

describe('dayOffset', () => {
  it('returns 0 for the view start date itself', () => {
    const viewStart = new Date('2026-04-01T00:00:00');
    expect(dayOffset(viewStart, viewStart, 28)).toBe(0);
  });

  it('returns dayWidth * days for a date 1 day after view start', () => {
    const viewStart = new Date('2026-04-01T00:00:00');
    const date = new Date('2026-04-02T00:00:00');
    expect(dayOffset(date, viewStart, 28)).toBe(28);
  });
});

describe('barWidth', () => {
  it('returns at least dayWidth for a zero-duration range', () => {
    const d = new Date('2026-04-01T00:00:00');
    expect(barWidth(d, d, 28)).toBe(28);
  });

  it('returns dayWidth * days for a multi-day range', () => {
    const start = new Date('2026-04-01T00:00:00');
    const end = new Date('2026-04-05T00:00:00');
    expect(barWidth(start, end, 28)).toBe(4 * 28);
  });
});
