import { Badge } from '@/components/ui/badge';
import { useTasks } from './hooks/useGraphData';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'var(--brand-primary)',
  IN_PROGRESS: 'var(--brand-primary)',
  DONE: 'var(--state-success)',
  BLOCKED: 'var(--state-error)',
  PENDING: 'var(--text-tertiary)',
  REVIEW: 'var(--state-warning)',
};

export function TimelinePage() {
  const { data: tasksData, isLoading } = useTasks();
  const tasks = (tasksData?.items ?? []).filter((t) => t.state !== 'CANCELLED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Timeline</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          {isLoading ? 'Loading…' : `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm text-[var(--text-tertiary)]">
          No tasks found.
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="grid grid-cols-[1fr_120px_100px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Task</span>
            <span>State</span>
            <span>Priority</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-[1fr_120px_100px] items-center gap-4 px-4 py-3 text-sm"
              >
                <span className="font-medium text-[var(--text-primary)]">{task.title}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[task.state] ?? 'var(--text-tertiary)' }}
                  />
                  <Badge variant="outline">{task.state}</Badge>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{task.priority ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
