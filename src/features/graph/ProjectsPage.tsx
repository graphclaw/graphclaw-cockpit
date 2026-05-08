// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { Badge } from '@/components/ui/badge';
import { FolderKanban } from 'lucide-react';
import { useGoals } from './hooks/useGraphData';

export function ProjectsPage() {
  const { data: goalsData, isLoading } = useGoals();
  const goals = goalsData?.items ?? [];
  const active = goals.filter((g) => g.state !== 'DONE' && g.state !== 'CANCELLED');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Projects</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            {isLoading ? 'Loading…' : `${active.length} active project${active.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)]">
          <FolderKanban size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No goals found. Create some goals to see projects here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban size={16} className="text-[var(--brand-primary)]" />
                  <span className="font-semibold text-[var(--text-primary)]">{goal.title}</span>
                </div>
                <Badge variant={goal.state === 'DONE' || goal.state === 'CANCELLED' ? 'outline' : 'default'}>
                  {goal.state}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                <span>Priority: {goal.priority}</span>
                <span className="font-mono text-[0.65rem]">{goal.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
