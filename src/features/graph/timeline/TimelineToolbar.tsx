// Timeline Hierarchical Gantt — Toolbar (Wave 4b)
import { ChevronDown, ChevronRight, Maximize2 } from 'lucide-react';

import { useTimelineStore } from '@/stores/timeline';
import { type ActiveFilter, type ZoomLevel } from './types';

const ZOOM_LABELS: { value: ZoomLevel; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

const FILTER_LABELS: { value: ActiveFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'delayed', label: 'Delayed' },
];

interface Props {
  allExpandableIds: string[];
  onFullscreen?: () => void;
}

export function TimelineToolbar({ allExpandableIds, onFullscreen }: Props) {
  const { zoom, activeFilters, setZoom, shiftView, jumpToToday, expandAll, collapseAll, toggleFilter } =
    useTimelineStore();

  return (
    <div
      className="tl-toolbar flex items-center gap-3 border-b px-4 py-2"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      {/* Zoom controls */}
      <div
        className="flex items-center overflow-hidden rounded"
        style={{ border: '1px solid var(--border-default)' }}
      >
        {ZOOM_LABELS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setZoom(value)}
            className={`zoom-btn px-3 py-1 text-xs font-medium transition-colors${zoom === value ? ' active' : ''}`}
            style={{
              backgroundColor: zoom === value ? 'var(--brand-primary)' : 'transparent',
              color: zoom === value ? 'var(--text-on-brand)' : 'var(--text-secondary)',
              borderRight: '1px solid var(--border-default)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => shiftView('prev')}
          className="rounded px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Previous period"
        >
          ‹
        </button>
        <button
          onClick={jumpToToday}
          className="rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--brand-primary)' }}
        >
          Today
        </button>
        <button
          onClick={() => shiftView('next')}
          className="rounded px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Next period"
        >
          ›
        </button>
      </div>

      {/* Separator */}
      <div className="h-5 w-px" style={{ backgroundColor: 'var(--border-subtle)' }} />

      {/* Filter chips */}
      <div className="flex items-center gap-1">
        {FILTER_LABELS.map(({ value, label }) => {
          const isActive =
            value === 'all'
              ? activeFilters.includes('all') || activeFilters.length === 0
              : activeFilters.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggleFilter(value)}
              className={`filter-chip rounded-full px-3 py-0.5 text-xs font-medium transition-colors${isActive ? ' active' : ''}`}
              style={{
                backgroundColor: isActive ? 'var(--brand-primary)' : 'var(--bg-inset)',
                color: isActive ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--brand-primary)' : 'var(--border-default)'}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div className="h-5 w-px" style={{ backgroundColor: 'var(--border-subtle)' }} />

      {/* Expand / Collapse all */}
      <button
        onClick={() => expandAll(allExpandableIds)}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)]"
        style={{ color: 'var(--text-secondary)' }}
        title="Expand all"
      >
        <ChevronDown size={12} />
        Expand
      </button>
      <button
        onClick={collapseAll}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)]"
        style={{ color: 'var(--text-secondary)' }}
        title="Collapse all"
      >
        <ChevronRight size={12} />
        Collapse
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Fullscreen */}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="rounded p-1.5 transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-tertiary)' }}
          title="Fullscreen"
        >
          <Maximize2 size={14} />
        </button>
      )}
    </div>
  );
}
