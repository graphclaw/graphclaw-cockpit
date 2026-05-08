// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// Timeline Hierarchical Gantt — main page (Wave 4b)
import { useCallback, useRef, useState } from 'react';

import { useTimelineStore } from '@/stores/timeline';
import { computeViewRange } from './timeline/date-utils';
import { useTimelineData } from './timeline/useTimelineData';
import { TimelineGanttArea } from './timeline/TimelineGanttArea';
import { TimelineLeftPanel } from './timeline/TimelineLeftPanel';
import { TimelineLegend } from './timeline/TimelineLegend';
import { TimelineToolbar } from './timeline/TimelineToolbar';

export function TimelinePage() {
  const { zoom, viewStartDate, viewEndDate } = useTimelineStore();
  const { rows, visibleRows, allIds, isLoading, isError } = useTimelineData();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Scroll sync (DR-10) ──────────────────────────────────────────────────────
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const onLeftScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (syncing.current) return;
    syncing.current = true;
    const scrollTop = (e.currentTarget as HTMLDivElement).scrollTop;
    if (rightScrollRef.current) rightScrollRef.current.scrollTop = scrollTop;
    requestAnimationFrame(() => { syncing.current = false; });
  }, []);

  const onRightScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (syncing.current) return;
    syncing.current = true;
    const scrollTop = (e.currentTarget as HTMLDivElement).scrollTop;
    if (leftScrollRef.current) leftScrollRef.current.scrollTop = scrollTop;
    requestAnimationFrame(() => { syncing.current = false; });
  }, []);

  // ── View range ───────────────────────────────────────────────────────────────
  const viewRange = computeViewRange(
    rows.length > 0 ? rows : [{ startDate: viewStartDate, endDate: viewEndDate }],
    zoom,
  );

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-full flex-col" style={{ height: 'calc(100vh - 120px)' }}>
        <div
          className="mb-2 h-10 rounded"
          style={{ backgroundColor: 'var(--bg-inset)', animation: 'pulse 1.5s infinite' }}
        />
        <div className="flex flex-1 gap-0">
          <div
            className="w-80 rounded"
            style={{ backgroundColor: 'var(--bg-inset)', animation: 'pulse 1.5s infinite' }}
          />
          <div
            className="flex-1 rounded"
            style={{ backgroundColor: 'var(--bg-inset)', animation: 'pulse 1.5s infinite', marginLeft: '1px' }}
          />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--status-error, #ef4444)' }}>
        Failed to load timeline data. Please try refreshing.
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Timeline
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No goals or tasks found.
          </p>
        </div>
        <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Create goals and tasks to see them here.
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      data-testid="timeline-page"
      style={{
        height: isFullscreen ? '100vh' : 'calc(100vh - 120px)',
        ...(isFullscreen
          ? { position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'var(--bg-surface)' }
          : {}),
      }}
    >
      {/* Page heading */}
      <div className="mb-1 flex-shrink-0 px-0 pb-1">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Timeline
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {rows.length} item{rows.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Main Gantt layout */}
      <div
        className="flex flex-1 flex-col overflow-hidden rounded-lg border"
        style={{ borderColor: 'var(--border-default)' }}
      >
        {/* Toolbar */}
        <TimelineToolbar
          allExpandableIds={allIds}
          onFullscreen={() => setIsFullscreen((v) => !v)}
        />

        {/* Panels */}
        <div className="flex flex-1 overflow-hidden">
          <TimelineLeftPanel
            rows={visibleRows}
            scrollRef={leftScrollRef}
            onScroll={onLeftScroll}
          />
          <TimelineGanttArea
            rows={visibleRows}
            viewRange={viewRange}
            scrollRef={rightScrollRef}
            onScroll={onRightScroll}
          />
        </div>

        {/* Legend */}
        <TimelineLegend />
      </div>
    </div>
  );
}

