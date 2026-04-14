import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTasks } from '@/features/graph/hooks/useGraphData';
import { Badge } from '@/components/ui/badge';

const STATE_VARIANT_MAP: Record<string, string> = {
  IN_PROGRESS: 'progress',
  BLOCKED: 'blocked',
  DONE: 'complete',
  BACKLOG: 'outline',
  ACTIVE: 'active',
  DELAYED: 'delayed',
  SNOOZED: 'snoozed',
  REVIEW: 'review',
};

function getStateVariant(state: string) {
  return (STATE_VARIANT_MAP[state] ?? 'outline') as 'active' | 'progress' | 'blocked' | 'delayed' | 'complete' | 'snoozed' | 'review' | 'outline';
}

export function TaskTable() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useTasks();
  const items = data?.items ?? [];

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_80px_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        <span>Task</span>
        <span>State</span>
        <span className="text-right">Score</span>
        <span className="text-right">ID</span>
      </div>

      {/* Virtualized rows */}
      <div
        ref={parentRef}
        className="max-h-[500px] overflow-auto"
        data-testid="task-table"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const task = items[virtualRow.index];
            if (!task) return null;
            return (
              <div
                key={task.id}
                className="absolute left-0 top-0 grid w-full grid-cols-[1fr_100px_80px_80px] items-center gap-4 border-b border-[var(--border-subtle)] px-4 py-2 text-sm hover:bg-[var(--bg-inset)] transition-colors cursor-pointer"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <span className="truncate text-[var(--text-primary)]">{task.title}</span>
                <Badge variant={getStateVariant(task.state)}>{task.state}</Badge>
                <span className="text-right font-mono text-xs text-[var(--text-secondary)]">
                  {task.score.toFixed(2)}
                </span>
                <span className="text-right font-mono text-xs text-[var(--text-tertiary)]">
                  {task.id}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border-default)] px-4 py-2 text-xs text-[var(--text-tertiary)]">
        {data?.total ?? 0} task{(data?.total ?? 0) !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
