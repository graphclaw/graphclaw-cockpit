import { useState } from 'react';
import { ChevronDown, Bot } from 'lucide-react';
import { CapacityBar } from './CapacityBar';
import { TaskStatusPills } from './TaskStatusPills';
import type { WorkforceResource } from '../hooks/useWorkforceData';
import type { TaskItem } from '@/lib/api-hooks';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_GRADIENTS = [
  'from-[#0EA5E9] to-[#0369A1]',
  'from-[#7C3AED] to-[#4F46E5]',
  'from-[#F59E0B] to-[#D97706]',
  'from-[#10B981] to-[#059669]',
  'from-[#EF4444] to-[#DC2626]',
  'from-[#EC4899] to-[#BE185D]',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

function getGradient(name: string): string {
  const idx = (name.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx] ?? AVATAR_GRADIENTS[0]!;
}

interface AvatarProps {
  name: string;
  type: 'HUMAN' | 'AI_AGENT';
}

function Avatar({ name, type }: AvatarProps) {
  if (type === 'AI_AGENT') {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]">
        <Bot size={18} className="text-white" />
      </div>
    );
  }
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${getGradient(name)}`}
    >
      {getInitials(name)}
    </div>
  );
}

const STATE_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pending:     { label: 'Pending',     bg: 'bg-[var(--state-active-light)]',   text: 'text-[var(--state-active)]' },
  in_progress: { label: 'In Progress', bg: 'bg-[var(--state-progress-light)]', text: 'text-[var(--state-progress)]' },
  review:      { label: 'Review',      bg: 'bg-[var(--state-review-light)]',   text: 'text-[var(--state-review)]' },
  blocked:     { label: 'Blocked',     bg: 'bg-[var(--state-blocked-light)]',  text: 'text-[var(--state-blocked)]' },
  done:        { label: 'Done',        bg: 'bg-[var(--state-complete-light)]', text: 'text-[var(--state-complete)]' },
};

const AGENT_LABEL_MAP: Record<string, string> = {
  Pending: 'Queued',
  'In Progress': 'Processing',
  Blocked: 'Stalled',
};

function getStateDisplay(state: string, isAgent: boolean): { label: string; bg: string; text: string } {
  const s = state.toUpperCase();
  let key: string;
  if (s === 'BLOCKED' || s === 'STALLED' || s === 'FAILED') key = 'blocked';
  else if (s === 'REVIEW' || s === 'UNDER_REVIEW') key = 'review';
  else if (s === 'COMPLETE' || s === 'DONE' || s === 'COMPLETED' || s === 'CLOSED') key = 'done';
  else if (s === 'ACTIVE' || s === 'IN_PROGRESS' || s === 'DELEGATED') key = 'in_progress';
  else key = 'pending';

  const base = STATE_MAP[key] ?? STATE_MAP.pending!;
  const label = isAgent ? (AGENT_LABEL_MAP[base.label] ?? base.label) : base.label;
  return { ...base, label };
}

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: 'text-[var(--state-blocked)]',
  HIGH:     'text-[var(--state-delayed)]',
  MEDIUM:   'text-[var(--text-secondary)]',
  LOW:      'text-[var(--text-tertiary)]',
};

function priorityStyle(priority?: string): string {
  return PRIORITY_STYLES[(priority ?? 'LOW').toUpperCase()] ?? PRIORITY_STYLES.LOW!;
}

// ---------------------------------------------------------------------------
// TaskRow
// ---------------------------------------------------------------------------

interface TaskRowProps {
  task: TaskItem;
  isAgent: boolean;
}

function formatDue(deadline?: string): string {
  if (!deadline) return '—';
  try {
    return new Date(deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function TaskRow({ task, isAgent }: TaskRowProps) {
  const stateDisplay = getStateDisplay(task.state, isAgent);
  const priStyle = priorityStyle(task.priority);
  const priLabel = task.priority
    ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase()
    : '—';
  const dueLabel = formatDue(task.deadline);

  return (
    <div className="grid grid-cols-[1fr_90px_70px_60px] items-center border-b border-[var(--border-subtle)] px-4 py-2 text-sm transition-colors last:border-b-0 hover:bg-[var(--bg-inset)] cursor-pointer">
      <div className="truncate pr-2 font-medium text-[var(--text-primary)]">{task.title}</div>
      <div>
        <span
          className={`rounded-[var(--radius-md)] px-2 py-0.5 text-xs font-semibold ${stateDisplay.bg} ${stateDisplay.text}`}
        >
          {stateDisplay.label}
        </span>
      </div>
      <div className={`text-xs font-semibold ${priStyle}`}>{priLabel}</div>
      <div className="text-xs text-[var(--text-tertiary)]">{dueLabel}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkforceCard
// ---------------------------------------------------------------------------

interface WorkforceCardProps {
  resource: WorkforceResource;
}

const VISIBLE_TASK_LIMIT = 8;

export function WorkforceCard({ resource }: WorkforceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isAgent = resource.type === 'AI_AGENT';
  const isOverCapacity = resource.load_factor > 1;

  const visibleTasks: TaskItem[] = expanded ? resource.tasks.slice(0, VISIBLE_TASK_LIMIT) : [];
  const hasMore = resource.tasks.length > VISIBLE_TASK_LIMIT;

  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-lg)] bg-[var(--bg-surface)] shadow-[var(--shadow-1)] transition-shadow duration-150 hover:shadow-[var(--shadow-2)] ${
        isOverCapacity
          ? 'border border-[var(--border-default)] border-l-[3px] border-l-[var(--state-blocked)]'
          : 'border border-[var(--border-default)] hover:border-[var(--brand-primary)]'
      }`}
    >
      {/* Card header — clickable toggle */}
      <button
        className="flex w-full items-center gap-3 p-4 text-left"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <Avatar name={resource.name} type={resource.type} />

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--text-primary)]">{resource.name}</div>
          <div className="truncate text-xs text-[var(--text-tertiary)]">
            {resource.capacity != null
              ? isAgent
                ? `AI Agent · max ${resource.capacity} concurrent`
                : `Human · ${resource.capacity}h capacity`
              : resource.id}
          </div>
          <span
            className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              isAgent
                ? 'bg-[var(--state-progress-light)] text-[var(--state-progress)]'
                : 'bg-[var(--state-active-light)] text-[var(--state-active)]'
            }`}
          >
            {isAgent ? 'AI Agent' : 'Human'}
          </span>
        </div>

        <ChevronDown
          size={16}
          className={`shrink-0 text-[var(--icon-tertiary)] transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Capacity bar */}
      <div className="px-4 pb-3">
        <CapacityBar loadFactor={resource.load_factor} />
      </div>

      {/* Task status pills */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        <TaskStatusPills counts={resource.task_counts} resourceType={resource.type} />
      </div>

      {/* Expanded task list */}
      {expanded && (
        <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface-alt)]">
          {resource.tasks.length === 0 ? (
            <div className="px-4 py-3 text-xs text-[var(--text-tertiary)]">
              No tasks assigned
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_90px_70px_60px] border-b border-[var(--border-default)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                <div>Task</div>
                <div>State</div>
                <div>Priority</div>
                <div>Due</div>
              </div>

              {visibleTasks.map((task) => (
                <TaskRow key={task.id} task={task} isAgent={isAgent} />
              ))}

              {hasMore && (
                <div className="cursor-pointer px-4 py-2 text-center text-xs text-[var(--text-link)] hover:underline">
                  View all {resource.tasks.length} tasks →
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
