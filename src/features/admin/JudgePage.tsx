// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminJudgeResults, useAdminJudgeStats } from '@/lib/api-hooks';

export function JudgePage() {
  const { data: results = [], isLoading: loadingResults } = useAdminJudgeResults();
  const { data: stats } = useAdminJudgeStats();

  const passRate = stats ? Math.round(stats.pass_rate * 100) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">LLM-as-Judge</h2>
        <Button size="sm">Configure</Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-center">
          <div className="text-2xl font-bold text-[var(--state-success)]">
            {passRate !== null ? `${passRate}%` : '—'}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">Pass Rate</div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {stats ? stats.avg_score.toFixed(2) : '—'}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">Avg Score</div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {stats ? stats.total_evaluations : '—'}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">Total Evaluations</div>
        </div>
      </div>

      {/* Results table */}
      {loadingResults ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="grid grid-cols-[1fr_80px_80px_140px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Skill</span>
            <span>Score</span>
            <span>Verdict</span>
            <span>Time</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">
                No evaluations recorded yet.
              </p>
            ) : (
              results.map((r) => (
                <div key={r.id} className="grid grid-cols-[1fr_80px_80px_140px] items-center gap-4 px-4 py-3 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">{r.skill}</span>
                  <span className="font-mono text-xs">{r.score.toFixed(2)}</span>
                  <Badge variant={r.verdict === 'PASS' ? 'default' : 'outline'}>
                    {r.verdict}
                  </Badge>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(r.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
