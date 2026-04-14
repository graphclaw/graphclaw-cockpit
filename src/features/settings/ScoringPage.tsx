import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeightFactor {
  id: string;
  label: string;
  weight: number;
}

const DEFAULT_WEIGHTS: WeightFactor[] = [
  { id: 'urgency', label: 'Urgency', weight: 0.20 },
  { id: 'importance', label: 'Importance', weight: 0.20 },
  { id: 'dependencies', label: 'Dependencies', weight: 0.15 },
  { id: 'recency', label: 'Recency', weight: 0.10 },
  { id: 'effort', label: 'Effort', weight: 0.10 },
  { id: 'alignment', label: 'Alignment', weight: 0.15 },
  { id: 'capacity', label: 'Capacity', weight: 0.10 },
];

export function ScoringPage() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  const total = weights.reduce((s, w) => s + w.weight, 0);

  const updateWeight = useCallback((id: string, value: number) => {
    setWeights((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, weight: value } : w));
      // Auto-normalize to 1.0
      const rawTotal = updated.reduce((s, w) => s + w.weight, 0);
      if (rawTotal > 0) {
        return updated.map((w) => ({ ...w, weight: w.weight / rawTotal }));
      }
      return updated;
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Scoring Weights</h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          Adjust the 7-factor scoring weights. Weights auto-normalize to 1.0.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Weight Configuration</span>
            <span className={`text-sm font-mono ${Math.abs(total - 1.0) < 0.01 ? 'text-[var(--state-active)]' : 'text-[var(--state-blocked)]'}`}>
              Total: {total.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Button size="sm">Save Weights</Button>
            <Button size="sm" variant="outline" onClick={() => setWeights(DEFAULT_WEIGHTS)}>
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
