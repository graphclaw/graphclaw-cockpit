import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScoringWeights, useUpdateScoringWeights, type ScoringWeights } from '@/lib/api-hooks';

interface WeightFactor {
  id: keyof ScoringWeights;
  label: string;
  weight: number;
}

const FACTOR_LABELS: Record<keyof ScoringWeights, string> = {
  W1_timeline: 'Timeline Urgency',
  W2_dependencies: 'Dependencies',
  W3_critical_path: 'Critical Path',
  W4_blocker: 'Blocker Impact',
  W5_override: 'Manual Override',
  W6_resource_risk: 'Resource Risk',
  W7_constraint: 'Constraint',
};

function weightsToFactors(w: ScoringWeights): WeightFactor[] {
  return (Object.keys(FACTOR_LABELS) as (keyof ScoringWeights)[]).map((id) => ({
    id,
    label: FACTOR_LABELS[id],
    weight: w[id],
  }));
}

function factorsToWeights(factors: WeightFactor[]): ScoringWeights {
  return factors.reduce(
    (acc, f) => ({ ...acc, [f.id]: f.weight }),
    {} as ScoringWeights,
  );
}

export function ScoringPage() {
  const { data: remoteWeights, isLoading } = useScoringWeights();
  const updateWeights = useUpdateScoringWeights();

  const [weights, setWeights] = useState<WeightFactor[]>([]);

  useEffect(() => {
    if (remoteWeights) {
      setWeights(weightsToFactors(remoteWeights));
    }
  }, [remoteWeights]);

  const total = weights.reduce((s, w) => s + w.weight, 0);

  const updateWeight = useCallback((id: string, value: number) => {
    setWeights((prev) =>
      prev.map((w) => (w.id === id ? { ...w, weight: value } : w)),
    );
  }, []);

  function handleSave() {
    updateWeights.mutate(factorsToWeights(weights));
  }

  function handleReset() {
    if (remoteWeights) setWeights(weightsToFactors(remoteWeights));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Scoring Weights</h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          Adjust the 7-factor scoring weights. Changes are saved to the backend.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Weight Configuration</span>
            <span
              className={`text-sm font-mono ${
                Math.abs(total - 1.0) < 0.01
                  ? 'text-[var(--state-active)]'
                  : 'text-[var(--state-blocked)]'
              }`}
            >
              Total: {total.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-testid="scoring-weights-form">
          {weights.map((factor) => (
            <div key={factor.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <label className="text-[var(--text-secondary)]">{factor.label}</label>
                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                  {factor.weight.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(factor.weight * 100)}
                onChange={(e) => updateWeight(factor.id, Number(e.target.value) / 100)}
                className="w-full accent-[var(--brand-primary)]"
              />
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSave} disabled={updateWeights.isPending}>
              {updateWeights.isPending ? 'Saving…' : 'Save Weights'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
