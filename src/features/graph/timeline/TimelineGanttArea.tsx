// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// Timeline Hierarchical Gantt — Gantt Area (time axis + bars) (Wave 4b)
import { type RefObject, useMemo } from 'react';

import { useTimelineStore } from '@/stores/timeline';
import { buildDayHeaders, barWidth as calcBarWidth, dayOffset, todayOffset } from './date-utils';
import {
  type GanttBar,
  type TimelineRow,
  type ViewRange,
  ZOOM_DAY_WIDTH,
} from './types';
import { TimelineBarTooltip } from './TimelineBarTooltip';
import { TimelineDependencyArrows } from './TimelineDependencyArrows';

// ── State bar colors (DR-3, all var(--*)) ────────────────────────────────────

function barColor(state: string): { bg: string; progress: string } {
  const s = state.toUpperCase();
  const colors: Record<string, { bg: string; progress: string }> = {
    ACTIVE: {
      bg: 'var(--brand-primary)',
      progress: 'var(--brand-primary-dark, color-mix(in srgb, var(--brand-primary), #000 20%))',
    },
    IN_PROGRESS: {
      bg: 'var(--status-success, var(--state-success, #22c55e))',
      progress: '#16a34a',
    },
    BLOCKED: {
      bg: 'var(--status-error, var(--state-error, #ef4444))',
      progress: '#dc2626',
    },
    DELAYED: {
      bg: 'var(--status-warning, var(--state-warning, #f59e0b))',
      progress: '#d97706',
    },
    IN_REVIEW: {
      bg: 'var(--status-info, var(--state-info, #6366f1))',
      progress: '#4f46e5',
    },
    DONE: {
      bg: 'var(--text-tertiary)',
      progress: 'var(--text-secondary)',
    },
    COMPLETE: {
      bg: 'var(--text-tertiary)',
      progress: 'var(--text-secondary)',
    },
    PENDING: {
      bg: 'var(--bg-muted, #94a3b8)',
      progress: '#64748b',
    },
  };
  return colors[s] ?? { bg: 'var(--bg-muted, #94a3b8)', progress: '#64748b' };
}

const ROW_HEIGHT = 44;
const BAR_HEIGHT = 24;
const BAR_TOP = (ROW_HEIGHT - BAR_HEIGHT) / 2;
const BRACKET_GOAL_HEIGHT = 8;
const BRACKET_COMPOSITE_HEIGHT = 6;
const MILESTONE_SIZE = 14;
const HEADER_HEIGHT = 68; // 30px month + 38px day

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  rows: TimelineRow[];
  viewRange: ViewRange;
  scrollRef: RefObject<HTMLDivElement | null>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function TimelineGanttArea({ rows, viewRange, scrollRef, onScroll }: Props) {
  const { zoom } = useTimelineStore();
  const dayWidth = ZOOM_DAY_WIDTH[zoom];
  const totalWidth = viewRange.totalDays * dayWidth;

  const dayHeaders = useMemo(
    () => buildDayHeaders(viewRange.start, viewRange.totalDays),
    [viewRange.start, viewRange.totalDays],
  );

  const todayX = useMemo(
    () => todayOffset(viewRange.start, viewRange.end, dayWidth),
    [viewRange.start, viewRange.end, dayWidth],
  );

  // Build bar map from rows (for dependency arrows)
  const barMap = useMemo(() => {
    const map = new Map<string, GanttBar>();
    rows.forEach((row) => {
      if (!row.isDated || !row.startDate || !row.endDate) return;
      const left = dayOffset(row.startDate, viewRange.start, dayWidth);
      const width = calcBarWidth(row.startDate, row.endDate, dayWidth);
      map.set(row.id, {
        rowId: row.id,
        kind: row.kind,
        state: row.state,
        startDate: row.startDate,
        endDate: row.endDate,
        progress: row.progress,
        left,
        width,
      });
    });
    return map;
  }, [rows, viewRange.start, dayWidth]);

  return (
    <div
      className="tl-right min-w-0 flex-1 overflow-x-auto overflow-y-auto"
      ref={scrollRef}
      onScroll={onScroll}
      style={{ position: 'relative' }}
      data-testid="gantt-area"
    >
      <div style={{ width: `${totalWidth}px`, minWidth: '100%', position: 'relative' }}>
        {/* ── Sticky header ── */}
        <div
          className="tl-right-scroll sticky top-0 z-20"
          style={{
            height: `${HEADER_HEIGHT}px`,
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          {/* Month row (30px) */}
          <div style={{ height: '30px', display: 'flex', position: 'relative' }}>
            {dayHeaders.map((h, i) =>
              h.monthLabel ? (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${i * dayWidth}px`,
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none',
                  }}
                >
                  {h.monthLabel}
                </div>
              ) : null,
            )}
          </div>

          {/* Day row (38px) */}
          <div style={{ height: '38px', display: 'flex', position: 'relative', alignItems: 'center' }}>
            {dayHeaders.map((h, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${i * dayWidth}px`,
                  width: `${dayWidth}px`,
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: h.isWeekendDay
                    ? 'var(--bg-inset)'
                    : h.isToday
                    ? 'color-mix(in srgb, var(--brand-primary) 12%, transparent)'
                    : 'transparent',
                  fontSize: dayWidth >= 20 ? '11px' : '9px',
                  color: h.isToday
                    ? 'var(--brand-primary)'
                    : h.isWeekendDay
                    ? 'var(--text-tertiary)'
                    : 'var(--text-secondary)',
                  fontWeight: h.isToday ? 700 : 400,
                  borderLeft: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                }}
              >
                {dayWidth >= 12 ? h.dayNum : ''}
              </div>
            ))}
          </div>
        </div>

        {/* ── Row content area ── */}
        <div style={{ position: 'relative' }}>
          {/* Today vertical line */}
          {todayX !== null && (
            <div
              className="gantt-today-line"
              data-testid="gantt-today-line"
              style={{
                position: 'absolute',
                left: `${todayX}px`,
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: 'var(--brand-primary)',
                zIndex: 15,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '-20px',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                Today
              </div>
            </div>
          )}

          {/* SVG dependency arrows layer */}
          <TimelineDependencyArrows edges={[]} barMap={barMap} rowHeight={ROW_HEIGHT} />

          {/* Gantt rows */}
          {rows.map((row) => {
            const bar = barMap.get(row.id);
            const isMilestone =
              row.taskType === 'MILESTONE' ||
              (row.startDate && row.endDate && row.startDate.getTime() === row.endDate.getTime());

            return (
              <div
                key={row.id}
                className="gantt-row"
                style={{
                  height: `${ROW_HEIGHT}px`,
                  position: 'relative',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'transparent',
                }}
              >
                {/* Weekend column background stripes */}
                {dayHeaders.map((h, i) =>
                  h.isWeekendDay ? (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${i * dayWidth}px`,
                        top: 0,
                        width: `${dayWidth}px`,
                        height: '100%',
                        backgroundColor: 'var(--bg-inset)',
                        opacity: 0.5,
                        pointerEvents: 'none',
                      }}
                    />
                  ) : null,
                )}

                {/* Grid lines */}
                {dayHeaders.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${i * dayWidth}px`,
                      top: 0,
                      width: '1px',
                      height: '100%',
                      backgroundColor: h.monthLabel
                        ? 'var(--border-default)'
                        : 'var(--border-subtle)',
                      opacity: 0.5,
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {/* Task bar / bracket / milestone */}
                {bar && renderBar(row, bar, isMilestone ?? false)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Bar rendering helpers ──────────────────────────────────────────────────────

function renderBar(row: TimelineRow, bar: GanttBar, isMilestone: boolean): React.ReactNode {
  const { bg, progress: progressColor } = barColor(row.state);

  // Goal bracket (DR-4)
  if (row.kind === 'goal') {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${bar.left}px`,
          width: `${bar.width}px`,
          top: `${(ROW_HEIGHT - BRACKET_GOAL_HEIGHT) / 2}px`,
          height: `${BRACKET_GOAL_HEIGHT}px`,
          backgroundColor: 'var(--brand-primary)',
          opacity: 0.25,
          borderRadius: '2px',
          pointerEvents: 'none',
        }}
      />
    );
  }

  // Composite bracket (DR-4)
  if (row.kind === 'composite') {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${bar.left}px`,
          width: `${bar.width}px`,
          top: `${(ROW_HEIGHT - BRACKET_COMPOSITE_HEIGHT) / 2}px`,
          height: `${BRACKET_COMPOSITE_HEIGHT}px`,
          backgroundColor: 'var(--text-tertiary)',
          opacity: 0.35,
          borderRadius: '2px',
          pointerEvents: 'none',
        }}
      />
    );
  }

  // Milestone diamond (DR-5)
  if (isMilestone) {
    return (
      <TimelineBarTooltip row={row}>
        <div
          className="task-bar"
          style={{
            position: 'absolute',
            left: `${bar.left - MILESTONE_SIZE / 2}px`,
            top: `${(ROW_HEIGHT - MILESTONE_SIZE) / 2}px`,
            width: `${MILESTONE_SIZE}px`,
            height: `${MILESTONE_SIZE}px`,
            backgroundColor: bg,
            transform: 'rotate(45deg)',
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'rotate(45deg) scale(1.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'rotate(45deg)';
          }}
        />
      </TimelineBarTooltip>
    );
  }

  // Regular task bar (DR-3)
  return (
    <TimelineBarTooltip row={row}>
      <div
        className="task-bar"
        style={{
          position: 'absolute',
          left: `${bar.left}px`,
          top: `${BAR_TOP}px`,
          width: `${bar.width}px`,
          height: `${BAR_HEIGHT}px`,
          borderRadius: 'var(--radius-md, 4px)',
          backgroundColor: bg,
          overflow: 'hidden',
          cursor: 'pointer',
          opacity: ['DONE', 'COMPLETE'].includes(row.state.toUpperCase()) ? 0.6 : 1,
        }}
      >
        {/* Progress fill */}
        {row.progress > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${row.progress}%`,
              backgroundColor: progressColor,
              opacity: 0.4,
            }}
          />
        )}
      </div>
    </TimelineBarTooltip>
  );
}
