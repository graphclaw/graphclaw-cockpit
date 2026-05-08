// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import type { TaskCounts } from '../hooks/useWorkforceData';

interface TaskStatusPillsProps {
  counts: TaskCounts;
  resourceType: 'HUMAN' | 'AI_AGENT';
}

interface PillConfig {
  key: keyof Omit<TaskCounts, 'total'>;
  humanLabel: string;
  agentLabel: string;
  bgClass: string;
  textClass: string;
  dotVar: string;
}

const PILL_CONFIG: PillConfig[] = [
  {
    key: 'pending',
    humanLabel: 'Pending',
    agentLabel: 'Queued',
    bgClass: 'bg-[var(--state-active-light)]',
    textClass: 'text-[var(--state-active)]',
    dotVar: 'var(--state-active)',
  },
  {
    key: 'in_progress',
    humanLabel: 'In Progress',
    agentLabel: 'Processing',
    bgClass: 'bg-[var(--state-progress-light)]',
    textClass: 'text-[var(--state-progress)]',
    dotVar: 'var(--state-progress)',
  },
  {
    key: 'review',
    humanLabel: 'Review',
    agentLabel: 'Review',
    bgClass: 'bg-[var(--state-review-light)]',
    textClass: 'text-[var(--state-review)]',
    dotVar: 'var(--state-review)',
  },
  {
    key: 'blocked',
    humanLabel: 'Blocked',
    agentLabel: 'Stalled',
    bgClass: 'bg-[var(--state-blocked-light)]',
    textClass: 'text-[var(--state-blocked)]',
    dotVar: 'var(--state-blocked)',
  },
  {
    key: 'done',
    humanLabel: 'Done',
    agentLabel: 'Done',
    bgClass: 'bg-[var(--state-complete-light)]',
    textClass: 'text-[var(--state-complete)]',
    dotVar: 'var(--state-complete)',
  },
];

export function TaskStatusPills({ counts, resourceType }: TaskStatusPillsProps) {
  const isAgent = resourceType === 'AI_AGENT';
  const visible = PILL_CONFIG.filter((p) => counts[p.key] > 0);

  if (visible.length === 0) {
    return (
      <span className="text-xs text-[var(--text-tertiary)]">No tasks assigned</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((p) => (
        <span
          key={p.key}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${p.bgClass} ${p.textClass}`}
        >
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: p.dotVar }}
          />
          {counts[p.key]} {isAgent ? p.agentLabel : p.humanLabel}
        </span>
      ))}
    </div>
  );
}
