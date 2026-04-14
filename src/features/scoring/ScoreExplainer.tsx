import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScoreFactor {
  name: string;
  weight: number;
  value: number;
}

interface ScoreExplainerProps {
  score: number;
  factors?: ScoreFactor[];
}

const DEFAULT_FACTORS: ScoreFactor[] = [
  { name: 'Urgency', weight: 0.20, value: 0.85 },
  { name: 'Importance', weight: 0.20, value: 0.70 },
  { name: 'Dependencies', weight: 0.15, value: 0.60 },
  { name: 'Recency', weight: 0.10, value: 0.90 },
  { name: 'Effort', weight: 0.10, value: 0.45 },
  { name: 'Alignment', weight: 0.15, value: 0.80 },
  { name: 'Capacity', weight: 0.10, value: 0.55 },
];

export function ScoreExplainer({ score, factors = DEFAULT_FACTORS }: ScoreExplainerProps) {
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
            const contribution = factor.weight * factor.value;
            return (
              <div key={factor.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{factor.name}</span>
                  <span className="font-mono text-xs text-[var(--text-tertiary)]">
                    {factor.weight.toFixed(2)} &times; {factor.value.toFixed(2)} = {contribution.toFixed(3)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-inset)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-primary)]"
                    style={{ width: `${factor.value * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--bg-inset)] p-3 text-sm text-[var(--text-secondary)]">
          This task scores <strong className="text-[var(--text-primary)]">{score.toFixed(2)}</strong> because it has
          high urgency and alignment, with moderate importance. The lower effort and capacity scores suggest it may
          require more resources than currently available.
        </div>
      </CardContent>
    </Card>
  );
}
