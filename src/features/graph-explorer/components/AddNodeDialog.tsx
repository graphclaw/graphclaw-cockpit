/**
 * Graph Explorer — Add Node dialog.
 *
 * Stepped dialog: select node type → fill fields → POST to backend.
 * Uses React Hook Form + Zod validation.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateTask } from '../hooks/useGraphMutations';

type NodeTypeChoice = 'task' | 'goal';

interface Props {
  open: boolean;
  onClose: () => void;
  onNodeCreated: (id: string) => void;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  task_type: z.string().min(1, 'Task type is required'),
  priority: z.string(),
  description: z.string(),
  deadline: z.string(),
  tags: z.string(),
});
type CreateTaskForm = z.infer<typeof createTaskSchema>;

const TASK_TYPES = [
  'ATOMIC', 'COMPOSITE', 'DELEGATED', 'FOLLOWUP', 'APPROVAL',
  'MILESTONE', 'REVIEW', 'RECURRING', 'DECISION', 'CHECKIN', 'RESEARCH',
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AddNodeDialog({ open, onClose, onNodeCreated }: Props) {
  const [nodeType, setNodeType] = useState<NodeTypeChoice | null>(null);
  const createTask = useCreateTask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { task_type: 'ATOMIC', priority: 'MEDIUM', description: '', deadline: '', tags: '' },
  });

  const handleClose = () => {
    setNodeType(null);
    reset();
    onClose();
  };

  const onSubmit = (data: CreateTaskForm) => {
    if (nodeType !== 'task') return;

    const payload = {
      task_type: data.task_type,
      title: data.title,
      description: data.description || undefined,
      priority: data.priority || undefined,
      deadline: data.deadline || undefined,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    };

    createTask.mutate(payload, {
      onSuccess: (created) => {
        toast.success(`Task "${created.title}" created`);
        handleClose();
        onNodeCreated(created.id);
      },
      onError: (err) => toast.error(`Failed to create: ${err.message}`),
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={handleClose}
        data-testid="add-node-backdrop"
      />

      {/* Dialog */}
      <div
        className="fixed left-1/2 top-[20%] z-50 w-full max-w-md -translate-x-1/2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-4)]"
        data-testid="add-node-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Add Node</h2>
          <button
            onClick={handleClose}
            className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Step 1: choose type */}
        {!nodeType && (
          <div className="px-4 py-4">
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              Select the type of node to create:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <TypeCard
                label="Task"
                description="Actionable work item"
                color="#3b82f6"
                onClick={() => setNodeType('task')}
                data-testid="node-type-task-card"
              />
              <TypeCard
                label="Goal"
                description="High-level objective"
                color="#10b981"
                onClick={() => setNodeType('goal')}
                data-testid="node-type-goal-card"
                disabled
                disabledReason="Use Goals page"
              />
            </div>
          </div>
        )}

        {/* Step 2: Task form */}
        {nodeType === 'task' && (
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="px-4 py-4 space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
                Title *
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="Task title"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none"
                data-testid="add-task-title"
                autoFocus
              />
              {errors.title && (
                <p className="mt-0.5 text-[10px] text-[var(--state-blocked)]">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
                  Task Type *
                </label>
                <select
                  {...register('task_type')}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                  data-testid="add-task-type"
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                  data-testid="add-task-priority"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
                Deadline
              </label>
              <input
                {...register('deadline')}
                type="date"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                data-testid="add-task-deadline"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Optional description"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none resize-none"
                data-testid="add-task-description"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
                Tags (comma-separated)
              </label>
              <input
                {...register('tags')}
                type="text"
                placeholder="e.g. urgent, backend"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none"
                data-testid="add-task-tags"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setNodeType(null)}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                ← Back
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createTask.isPending}
                  className="rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-primary-hover)] disabled:opacity-40 transition-colors"
                  data-testid="add-task-submit"
                >
                  {createTask.isPending ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

// ── TypeCard sub-component ────────────────────────────────────────────────────

function TypeCard({
  label,
  description,
  color,
  onClick,
  disabled,
  disabledReason,
  'data-testid': testId,
}: {
  label: string;
  description: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  'data-testid'?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      data-testid={testId}
      disabled={disabled}
      className={`flex flex-col items-start rounded-[var(--radius-md)] border p-3 text-left transition-colors ${
        disabled
          ? 'cursor-not-allowed border-[var(--border-subtle)] opacity-40'
          : 'border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5'
      }`}
    >
      <div className="mb-1.5 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
      <span className="text-[10px] text-[var(--text-tertiary)]">
        {disabled && disabledReason ? disabledReason : description}
      </span>
    </button>
  );
}
