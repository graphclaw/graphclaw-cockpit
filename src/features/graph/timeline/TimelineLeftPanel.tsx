// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// Timeline Hierarchical Gantt — Left Panel hierarchy tree (Wave 4b)
import { type RefObject } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { useTimelineStore } from '@/stores/timeline';
import { type TimelineRow } from './types';

const KIND_ICON: Record<string, string> = {
  goal: '🎯',
  composite: '📦',
  atomic: '⚡',
};

const KIND_ICON_FALLBACK: Record<string, string> = {
  MILESTONE: '💎',
  COMPOSITE: '📦',
  ATOMIC: '⚡',
};

const STATE_DOT_COLOR: Record<string, string> = {
  ACTIVE: 'var(--brand-primary)',
  IN_PROGRESS: 'var(--status-success, var(--state-success, #22c55e))',
  DONE: 'var(--text-tertiary)',
  COMPLETE: 'var(--text-tertiary)',
  BLOCKED: 'var(--status-error, var(--state-error, #ef4444))',
  DELAYED: 'var(--status-warning, var(--state-warning, #f59e0b))',
  IN_REVIEW: 'var(--status-info, var(--state-info, #6366f1))',
  PENDING: 'var(--text-muted, var(--text-tertiary))',
};

const ROW_HEIGHT = 44; // px

interface Props {
  rows: TimelineRow[];
  scrollRef: RefObject<HTMLDivElement | null>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function TimelineLeftPanel({ rows, scrollRef, onScroll }: Props) {
  const { expandedIds, toggleExpand, selectedRowId, setSelectedRowId } = useTimelineStore();

  return (
    <div
      className="tl-left flex-shrink-0 overflow-y-auto overflow-x-hidden"
      ref={scrollRef}
      onScroll={onScroll}
      style={{
        width: '320px',
        borderRight: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      {rows.map((row) => {
        const isExpanded = expandedIds.has(row.id);
        const isSelected = selectedRowId === row.id;
        const indent = row.depth * 20;
        const icon =
          row.taskType && KIND_ICON_FALLBACK[row.taskType]
            ? KIND_ICON_FALLBACK[row.taskType]
            : KIND_ICON[row.kind] ?? '📋';
        const dotColor = STATE_DOT_COLOR[row.state] ?? 'var(--text-tertiary)';

        return (
          <div
            key={row.id}
            data-row-id={row.id}
            className={`tl-row ${row.kind === 'goal' ? 'goal-row' : ''} flex cursor-pointer items-center gap-2 transition-colors`}
            style={{
              height: `${ROW_HEIGHT}px`,
              paddingLeft: `${8 + indent}px`,
              paddingRight: '8px',
              opacity: row.isDated ? 1 : 0.55,
              backgroundColor: isSelected
                ? 'var(--bg-selected, var(--bg-hover))'
                : row.kind === 'goal'
                ? 'var(--bg-surface-alt, var(--bg-inset))'
                : 'transparent',
              fontWeight: row.kind === 'goal' ? 600 : 400,
              borderBottom: '1px solid var(--border-subtle)',
            }}
            onClick={() => setSelectedRowId(isSelected ? null : row.id)}
          >
            {/* Expand/collapse chevron */}
            <span
              className="expand-toggle flex-shrink-0"
              style={{
                width: '16px',
                color: 'var(--text-tertiary)',
                visibility: row.hasChildren ? 'visible' : 'hidden',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (row.hasChildren) toggleExpand(row.id);
              }}
            >
              {row.hasChildren ? (
                isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )
              ) : null}
            </span>

            {/* Status dot */}
            <span
              className="flex-shrink-0 rounded-full"
              style={{ width: '8px', height: '8px', backgroundColor: dotColor }}
            />

            {/* Type icon */}
            <span className="flex-shrink-0 text-sm">{icon}</span>

            {/* Title */}
            <span
              className="min-w-0 flex-1 truncate text-sm"
              style={{ color: 'var(--text-primary)' }}
              title={row.title}
            >
              {row.title}
            </span>

            {/* Assignee avatar (initials) */}
            {row.assignee && (
              <span
                className="flex flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'var(--brand-primary)',
                  color: 'var(--text-on-brand, #fff)',
                  flexShrink: 0,
                }}
                title={row.assignee}
              >
                {row.assignee.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
