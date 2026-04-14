import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TaskItem } from '@/features/graph/hooks/useGraphData';

interface TaskDetailProps {
  task: TaskItem;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  return (
    <div className="flex h-full flex-col overflow-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
        <h3 className="font-semibold text-[var(--text-primary)]">{task.title}</h3>
        <button
          onClick={onClose}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          &times;
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 p-4">
        {/* Status */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            State
          </label>
          <Badge variant={task.state === 'IN_PROGRESS' ? 'progress' : 'outline'}>{task.state}</Badge>
        </div>

        {/* Score */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Score
          </label>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-[var(--bg-inset)]">
              <div
                className="h-full rounded-full bg-[var(--brand-primary)]"
                style={{ width: `${task.score * 100}%` }}
              />
            </div>
            <span className="font-mono text-sm text-[var(--text-primary)]">
              {task.score.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ID */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            ID
          </label>
          <span className="font-mono text-sm text-[var(--text-secondary)]">{task.id}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="default">
            Approve
          </Button>
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
