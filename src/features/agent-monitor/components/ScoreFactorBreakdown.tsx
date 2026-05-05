import { Sigma } from 'lucide-react';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { type TaskScore, useTaskScore } from '@/lib/api-hooks';

type CanonicalFactorName =
  | 'Timeline urgency'
  | 'Dependency weight'
  | 'Critical path'
  | 'Blocker status'
  | 'Human override'
  | 'Resource risk'
  | 'Constraint pressure';

interface ScoreFactorBreakdownProps {
  taskId: string | null;
}

const FACTOR_ORDER: CanonicalFactorName[] = [
  'Timeline urgency',
  'Dependency weight',
  'Critical path',
  'Blocker status',
  'Human override',
  'Resource risk',
  'Constraint pressure',
];

function safeNumber(value: number): number {
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

function normalizeFactorName(name: string): CanonicalFactorName | string {
  const normalized = name.trim().toLowerCase().replace(/[_-]+/g, ' ');

  if (normalized.includes('timeline')) {
    return 'Timeline urgency';
  }

  if (normalized.includes('dependency') || normalized.includes('dependenc') || normalized.includes('dependen')) {
    return 'Dependency weight';
  }

  if (normalized.includes('critical')) {
    return 'Critical path';
  }

  if (normalized.includes('blocker')) {
    return 'Blocker status';
  }

  if (normalized.includes('override')) {
    return 'Human override';
  }

  if (normalized.includes('resource')) {
    return 'Resource risk';
  }

  if (normalized.includes('constraint')) {
    return 'Constraint pressure';
  }

  return name;
}

function buildSummary(payload: TaskScore): string {
  if (payload.explanation && payload.explanation.trim() !== '') {
    return payload.explanation.trim();
  }

  if (payload.summary && payload.summary.trim() !== '') {
    return payload.summary.trim();
  }

  const snippets = payload.factors
    .map((factor) => factor.plain_english?.trim())
    .filter((value): value is string => Boolean(value));

  if (snippets.length > 0) {
    return snippets.slice(0, 2).join(' ');
  }

  return `Task ${payload.task_id} currently scores ${safeNumber(payload.final_score).toFixed(2)} across the seven factors.`;
}

function sortedFactors(payload: TaskScore) {
  const knownOrder = new Map(FACTOR_ORDER.map((name, index) => [name, index]));

  return [...payload.factors].sort((left, right) => {
    const leftName = normalizeFactorName(left.factor_name);
    const rightName = normalizeFactorName(right.factor_name);
    const leftIndex = knownOrder.get(leftName as CanonicalFactorName) ?? 99;
    const rightIndex = knownOrder.get(rightName as CanonicalFactorName) ?? 99;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return left.factor_name.localeCompare(right.factor_name);
  });
}

export function ScoreFactorBreakdown({ taskId }: ScoreFactorBreakdownProps) {
  const query = useTaskScore(taskId ?? '');

  if (!taskId) {
    return (
      <div data-testid="score-factor-empty">
        <EmptyPanel
          icon={Sigma}
          title="No factor breakdown selected."
          subtitle="Choose a task from the score table to inspect factor details."
        />
      </div>
    );
  }

  if (query.isLoading) {
    return <PanelSkeleton rows={7} withHeader={false} />;
  }

  if (query.error) {
    return <PanelError error={query.error as Error} onRetry={() => void query.refetch()} />;
  }

  if (!query.data || query.data.factors.length === 0) {
    return (
      <div data-testid="score-factor-empty-data">
        <EmptyPanel
          icon={Sigma}
          title="No scoring factors available."
          subtitle="This task has not produced a full scoring breakdown yet."
        />
      </div>
    );
  }

  const payload = query.data;
  const finalScore = safeNumber(payload.final_score);
  const summary = buildSummary(payload);
  const factors = sortedFactors(payload);

  return (
    <div className="space-y-4" data-testid="score-factor-breakdown">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Score breakdown</p>
          <p className="font-mono text-xs text-[var(--text-secondary)]">Task {payload.task_id}</p>
        </div>
        <span className="text-2xl font-bold text-[var(--brand-primary)]">{finalScore.toFixed(2)}</span>
      </div>

      <div className="rounded-[var(--radius-md)] bg-[var(--bg-inset)] p-3 text-sm text-[var(--text-secondary)]">
        {summary}
      </div>

      <div className="space-y-3">
        {factors.map((factor) => {
          const displayName = normalizeFactorName(factor.factor_name);
          const weight = safeNumber(factor.weight);
          const rawScore = safeNumber(factor.raw_score);
          const weightedScore = safeNumber(factor.weighted_score);

          return (
            <div key={`${factor.factor_name}-${factor.weight}`} className="space-y-1" data-testid="score-factor-row">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">{displayName}</span>
                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                  {weight.toFixed(2)} x {rawScore.toFixed(2)} = {weightedScore.toFixed(3)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-inset)]">
                <div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${rawScore * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
