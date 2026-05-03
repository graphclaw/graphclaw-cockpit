import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ScoreFactor {
  name:
    | 'Timeline urgency'
    | 'Dependency weight'
    | 'Critical path'
    | 'Blocker status'
    | 'Human override'
    | 'Resource risk'
    | 'Constraint pressure';
  weight: number;
  rawScore: number;
}

interface ScoreFactorBreakdownProps {
  score: number;
  factors?: ScoreFactor[];
  summary?: string;
}

const DEFAULT_FACTORS: ScoreFactor[] = [
  { name: 'Timeline urgency', weight: 0.25, rawScore: 0.85 },
  { name: 'Dependency weight', weight: 0.2, rawScore: 0.7 },
  { name: 'Critical path', weight: 0.2, rawScore: 0.6 },
  { name: 'Blocker status', weight: 0.15, rawScore: 0.4 },
  { name: 'Human override', weight: 0.1, rawScore: 0.5 },
  { name: 'Resource risk', weight: 0.05, rawScore: 0.35 },
  { name: 'Constraint pressure', weight: 0.05, rawScore: 0.45 },
];

export function ScoreFactorBreakdown({
  score,
  factors = DEFAULT_FACTORS,
  summary,
}: ScoreFactorBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Score Breakdown</span>
          <span className="text-2xl font-bold text-[var(--brand-primary)]">{score.toFixed(2)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {factors.map((factor) => {
            const weightedScore = factor.weight * factor.rawScore;

            return (
              <div key={factor.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{factor.name}</span>
                  <span className="font-mono text-xs text-[var(--text-tertiary)]">
                    {factor.weight.toFixed(2)} x {factor.rawScore.toFixed(2)} = {weightedScore.toFixed(3)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-inset)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-primary)]"
                    style={{ width: `${factor.rawScore * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--bg-inset)] p-3 text-sm text-[var(--text-secondary)]">
          {summary ?? (
            <>
              This task scores <strong className="text-[var(--text-primary)]">{score.toFixed(2)}</strong> based on
              timeline urgency, dependency pressure, and current blocking signals.
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
