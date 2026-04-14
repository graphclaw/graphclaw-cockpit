import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const MOCK_RESULTS = [
  { id: 'j-1', skill: 'email-triage', score: 0.92, verdict: 'PASS', timestamp: '2026-04-14T09:00:00Z' },
  { id: 'j-2', skill: 'code-review', score: 0.78, verdict: 'PASS', timestamp: '2026-04-14T08:30:00Z' },
  { id: 'j-3', skill: 'meeting-notes', score: 0.45, verdict: 'FAIL', timestamp: '2026-04-14T08:00:00Z' },
  { id: 'j-4', skill: 'ticket-classifier', score: 0.88, verdict: 'PASS', timestamp: '2026-04-13T16:00:00Z' },
  { id: 'j-5', skill: 'data-extractor', score: 0.31, verdict: 'FAIL', timestamp: '2026-04-13T14:00:00Z' },
];

export function JudgePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">LLM-as-Judge</h2>
        <Button size="sm">Configure</Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-center">
          <div className="text-2xl font-bold text-[var(--state-success)]">72%</div>
          <div className="text-xs text-[var(--text-tertiary)]">Pass Rate</div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">0.67</div>
          <div className="text-xs text-[var(--text-tertiary)]">Avg Score</div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">148</div>
          <div className="text-xs text-[var(--text-tertiary)]">Total Evaluations</div>
        </div>
      </div>

      {/* Results table */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="grid grid-cols-[1fr_80px_80px_140px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Skill</span>
          <span>Score</span>
          <span>Verdict</span>
          <span>Time</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {MOCK_RESULTS.map((r) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
