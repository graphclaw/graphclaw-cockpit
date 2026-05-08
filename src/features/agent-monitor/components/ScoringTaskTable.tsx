// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useState } from 'react';
import { Sigma } from 'lucide-react';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { type ActionQueueItem, useActionQueue } from '@/lib/api-hooks';

type SortKey = 'rank' | 'score' | 'autonomy';
type SortDirection = 'asc' | 'desc';

interface ScoringTaskTableProps {
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function autonomyRank(value: string): number {
  const normalized = value.trim().toUpperCase();

  if (normalized === 'AUTO') {
    return 1;
  }

  if (normalized === 'ASSISTED') {
    return 2;
  }

  if (normalized === 'REVIEW') {
    return 3;
  }

  if (normalized === 'MANUAL') {
    return 4;
  }

  return 99;
}

function sortQueue(items: ActionQueueItem[], key: SortKey, direction: SortDirection): ActionQueueItem[] {
  const sorted = [...items].sort((left, right) => {
    if (key === 'rank') {
      const delta = left.rank - right.rank;
      if (delta !== 0) {
        return delta;
      }
      return normalizeScore(right.final_score) - normalizeScore(left.final_score);
    }

    if (key === 'score') {
      const delta = normalizeScore(left.final_score) - normalizeScore(right.final_score);
      if (delta !== 0) {
        return delta;
      }
      return left.rank - right.rank;
    }

    const delta = autonomyRank(left.autonomy_level ?? '') - autonomyRank(right.autonomy_level ?? '');
    if (delta !== 0) {
      return delta;
    }

    return left.rank - right.rank;
  });

  if (direction === 'desc') {
    sorted.reverse();
  }

  return sorted;
}

function sortIndicator(active: boolean, direction: SortDirection): string {
  if (!active) {
    return ' ↕';
  }

  return direction === 'asc' ? ' ↑' : ' ↓';
}

function headerButtonClass(isActive: boolean): string {
  return `font-semibold ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`;
}

function scoreBarTone(score: number): string {
  if (score >= 0.8) {
    return 'bg-[var(--state-progress)]';
  }

  if (score >= 0.5) {
    return 'bg-[var(--state-delayed)]';
  }

  return 'bg-[var(--state-blocked)]';
}

function contextChip(item: ActionQueueItem): string {
  return item.explanation?.factors?.[0]?.factor_name ?? 'Scored task';
}

export function ScoringTaskTable({ selectedTaskId, onSelectTask }: ScoringTaskTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const query = useActionQueue();

  const sortedItems = useMemo(() => {
    const items = query.data ?? [];
    return sortQueue(items, sortKey, sortDirection);
  }, [query.data, sortDirection, sortKey]);

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === 'score' ? 'desc' : 'asc');
  }

  if (query.isLoading) {
    return <PanelSkeleton rows={6} withHeader={false} />;
  }

  if (query.error) {
    return <PanelError error={query.error as Error} onRetry={() => void query.refetch()} />;
  }

  if (sortedItems.length === 0) {
    return (
      <div data-testid="scoring-task-table-empty">
        <EmptyPanel
          icon={Sigma}
          title="Action queue is empty."
          subtitle="Agent has no recommendations right now."
        />
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      data-testid="scoring-task-table"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              <th className="px-3 py-2">
                <button
                  type="button"
                  className={headerButtonClass(sortKey === 'rank')}
                  onClick={() => handleSort('rank')}
                  data-testid="scoring-sort-rank"
                >
                  Rank{sortIndicator(sortKey === 'rank', sortDirection)}
                </button>
              </th>
              <th className="px-3 py-2 font-semibold">Task</th>
              <th className="px-3 py-2">
                <button
                  type="button"
                  className={headerButtonClass(sortKey === 'score')}
                  onClick={() => handleSort('score')}
                  data-testid="scoring-sort-score"
                >
                  Score{sortIndicator(sortKey === 'score', sortDirection)}
                </button>
              </th>
              <th className="px-3 py-2 font-semibold">Recommended action</th>
              <th className="px-3 py-2">
                <button
                  type="button"
                  className={headerButtonClass(sortKey === 'autonomy')}
                  onClick={() => handleSort('autonomy')}
                  data-testid="scoring-sort-autonomy"
                >
                  Autonomy{sortIndicator(sortKey === 'autonomy', sortDirection)}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, index) => {
              const rowScore = normalizeScore(item.final_score);
              const isTopRow = index === 0;
              const isSelected = selectedTaskId === item.node_id;

              return (
                <tr
                  key={`${item.node_id}-${item.rank}`}
                  className={`border-b border-[var(--border-subtle)] align-top last:border-b-0 ${isTopRow ? 'bg-[var(--brand-primary-light)]' : ''} ${isSelected ? 'ring-1 ring-inset ring-[var(--brand-primary)]' : ''}`}
                  data-testid={isTopRow ? 'scoring-task-row-top' : 'scoring-task-row'}
                  onClick={() => onSelectTask?.(item.node_id)}
                >
                  <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">#{item.rank}</td>
                  <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                    <p className="font-medium text-[var(--text-primary)]">{item.node_id}</p>
                    <span className="mt-1 inline-flex rounded-full border border-[var(--border-default)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                      {contextChip(item)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="w-[140px]">
                      <div className="h-1.5 rounded-full bg-[var(--bg-inset)]">
                        <div className={`h-full rounded-full ${scoreBarTone(rowScore)}`} style={{ width: `${rowScore * 100}%` }} />
                      </div>
                      <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">{rowScore.toFixed(3)}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                      {item.recommended_action || 'NONE'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                      {item.autonomy_level || 'UNKNOWN'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
