// Timeline Hierarchical Gantt — Bar Tooltip (Wave 4b)
import { useState, useRef, type ReactNode } from 'react';
import { format } from 'date-fns';

import { type TimelineRow } from './types';

const STATE_BADGE: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: 'var(--brand-primary)', color: 'var(--text-on-brand, #fff)' },
  IN_PROGRESS: { bg: 'var(--status-success, #22c55e)', color: '#fff' },
  BLOCKED: { bg: 'var(--status-error, #ef4444)', color: '#fff' },
  DELAYED: { bg: 'var(--status-warning, #f59e0b)', color: '#fff' },
  IN_REVIEW: { bg: 'var(--status-info, #6366f1)', color: '#fff' },
  DONE: { bg: 'var(--text-tertiary)', color: '#fff' },
  COMPLETE: { bg: 'var(--text-tertiary)', color: '#fff' },
  PENDING: { bg: 'var(--bg-muted, #94a3b8)', color: '#fff' },
};

interface TooltipTriggerProps {
  row: TimelineRow;
  children: ReactNode;
}

export function TimelineBarTooltip({ row, children }: TooltipTriggerProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const badge = STATE_BADGE[row.state] ?? { bg: 'var(--text-tertiary)', color: '#fff' };
  const startStr = row.startDate ? format(row.startDate, 'MMM d, yyyy') : '—';
  const endStr = row.endDate ? format(row.endDate, 'MMM d, yyyy') : '—';

  const handleMouseMove = (e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'contents' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
      {visible && (
        <div
          style={{
            position: 'fixed',
            left: pos.x + 12,
            top: pos.y - 10,
            zIndex: 9999,
            minWidth: '220px',
            maxWidth: '320px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md, 6px)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-md, 0 4px 16px rgba(0,0,0,0.15))',
            pointerEvents: 'none',
          }}
        >
          {/* Title */}
          <div
            className="mb-1 text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {row.title}
          </div>

          {/* State badge */}
          <span
            className="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {row.state}
          </span>

          {/* Dates */}
          <div className="mt-1 space-y-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>Start: </span>
              {startStr}
            </div>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>End: </span>
              {endStr}
            </div>
            {row.progress > 0 && (
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Progress: </span>
                {row.progress}%
              </div>
            )}
            {row.assignee && (
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Assignee: </span>
                {row.assignee}
              </div>
            )}
            {row.score !== undefined && row.score > 0 && (
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Score: </span>
                {row.score.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
