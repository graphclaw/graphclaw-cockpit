import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type TaskScore, useSimulateTaskScore } from '@/lib/api-hooks';

interface WhatIfSimulatorProps {
  taskId: string;
  baseline: TaskScore;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SimulatorState {
  timelineUrgencyDays: number;
  dependencyCount: number;
  criticalPath: boolean;
  blocker: boolean;
  humanOverridePriority: 0 | 1 | 2 | 3;
  resourceRisk: number;
  constraintPressure: number;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function factorRaw(score: TaskScore, factorHint: string): number {
  const match = score.factors.find((factor) => factor.factor_name.toLowerCase().includes(factorHint));
  const fallback = 0;

  if (!match) {
    return fallback;
  }

  return clamp(match.raw_score, 0, 1);
}

function defaultsFromScore(score: TaskScore): SimulatorState {
  const timelineRaw = factorRaw(score, 'timeline');
  const dependencyRaw = factorRaw(score, 'dependency');
  const criticalRaw = factorRaw(score, 'critical');
  const blockerRaw = factorRaw(score, 'blocker');
  const overrideRaw = factorRaw(score, 'override');
  const resourceRaw = factorRaw(score, 'resource');
  const constraintRaw = factorRaw(score, 'constraint');

  return {
    timelineUrgencyDays: clamp(Math.round((1 - timelineRaw) * 30), 0, 30),
    dependencyCount: clamp(Math.round(dependencyRaw * 20), 0, 20),
    criticalPath: criticalRaw >= 0.5,
    blocker: blockerRaw >= 0.5,
    humanOverridePriority: clamp(Math.round(overrideRaw * 3), 0, 3) as 0 | 1 | 2 | 3,
    resourceRisk: clamp(resourceRaw, 0, 1),
    constraintPressure: clamp(constraintRaw, 0, 1),
  };
}

function stateToModifiedFactors(state: SimulatorState): Record<string, number> {
  return {
    timeline_urgency: round(1 - state.timelineUrgencyDays / 30),
    dependency_weight: round(state.dependencyCount / 20),
    critical_path: state.criticalPath ? 1 : 0,
    blocker: state.blocker ? 1 : 0,
    human_override: round(state.humanOverridePriority / 3),
    resource_risk: round(state.resourceRisk),
    constraint_pressure: round(state.constraintPressure),
  };
}

function signedDelta(value: number): string {
  if (value > 0) {
    return `+${value.toFixed(2)}`;
  }

  return value.toFixed(2);
}

export function WhatIfSimulator({ taskId, baseline, open, onOpenChange }: WhatIfSimulatorProps) {
  const simulateMutation = useSimulateTaskScore();
  const baselineScore = clamp(baseline.final_score, 0, 1);

  const [state, setState] = useState<SimulatorState>(() => defaultsFromScore(baseline));
  const [hasInteracted, setHasInteracted] = useState(false);
  const [previewScore, setPreviewScore] = useState(baselineScore);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const modifiedFactors = useMemo(() => stateToModifiedFactors(state), [state]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setState(defaultsFromScore(baseline));
    setPreviewScore(baselineScore);
    setPreviewError(null);
    setHasInteracted(false);
  }, [baseline, baselineScore, open]);

  useEffect(() => {
    if (!open || !hasInteracted) {
      return;
    }

    const timer = setTimeout(() => {
      void simulateMutation
        .mutateAsync({
          task_id: taskId,
          modified_factors: modifiedFactors,
        })
        .then((result) => {
          setPreviewScore(clamp(result.final_score, 0, 1));
          setPreviewError(null);
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Failed to simulate score';
          setPreviewError(message);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [hasInteracted, modifiedFactors, open, simulateMutation, taskId]);

  const delta = previewScore - baselineScore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="score-what-if-dialog">
        <DialogHeader>
          <DialogTitle>What-if Simulator</DialogTitle>
          <DialogDescription>
            Preview how factor changes affect this task&apos;s score before saving any policy updates.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-[var(--radius-md)] border border-[var(--state-delayed)] bg-[var(--state-delayed-light)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          Preview only - no changes are saved.
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="space-y-1 text-sm" data-testid="whatif-control-timeline">
            <span className="text-[var(--text-secondary)]">Timeline urgency (days until deadline): {state.timelineUrgencyDays}</span>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={state.timelineUrgencyDays}
              onChange={(event) => {
                setHasInteracted(true);
                setState((prev) => ({ ...prev, timelineUrgencyDays: Number(event.target.value) }));
              }}
              className="w-full"
            />
          </label>

          <label className="space-y-1 text-sm" data-testid="whatif-control-dependency">
            <span className="text-[var(--text-secondary)]">Dependency weight (dependent count): {state.dependencyCount}</span>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={state.dependencyCount}
              onChange={(event) => {
                setHasInteracted(true);
                setState((prev) => ({ ...prev, dependencyCount: Number(event.target.value) }));
              }}
              className="w-full"
            />
          </label>

          <label className="space-y-1 text-sm" data-testid="whatif-control-resource">
            <span className="text-[var(--text-secondary)]">Resource risk: {state.resourceRisk.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state.resourceRisk}
              onChange={(event) => {
                setHasInteracted(true);
                setState((prev) => ({ ...prev, resourceRisk: Number(event.target.value) }));
              }}
              className="w-full"
            />
          </label>

          <label className="space-y-1 text-sm" data-testid="whatif-control-constraint">
            <span className="text-[var(--text-secondary)]">Constraint pressure: {state.constraintPressure.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state.constraintPressure}
              onChange={(event) => {
                setHasInteracted(true);
                setState((prev) => ({ ...prev, constraintPressure: Number(event.target.value) }));
              }}
              className="w-full"
            />
          </label>

          <label className="space-y-1 text-sm" data-testid="whatif-control-override">
            <span className="text-[var(--text-secondary)]">Human override priority: {state.humanOverridePriority}</span>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={state.humanOverridePriority}
              onChange={(event) => {
                setHasInteracted(true);
                setState((prev) => ({
                  ...prev,
                  humanOverridePriority: Number(event.target.value) as 0 | 1 | 2 | 3,
                }));
              }}
              className="w-full"
            />
          </label>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 text-[var(--text-secondary)]" data-testid="whatif-control-critical">
              <input
                type="checkbox"
                checked={state.criticalPath}
                onChange={(event) => {
                  setHasInteracted(true);
                  setState((prev) => ({ ...prev, criticalPath: event.target.checked }));
                }}
              />
              Critical path
            </label>
            <label className="flex items-center gap-2 text-[var(--text-secondary)]" data-testid="whatif-control-blocker">
              <input
                type="checkbox"
                checked={state.blocker}
                onChange={(event) => {
                  setHasInteracted(true);
                  setState((prev) => ({ ...prev, blocker: event.target.checked }));
                }}
              />
              Blocker
            </label>
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text-secondary)]" data-testid="whatif-delta">
          Score would change from {baselineScore.toFixed(2)} -&gt; {previewScore.toFixed(2)} ({signedDelta(delta)})
        </div>

        {previewError && (
          <div className="rounded-[var(--radius-md)] border border-[var(--state-blocked)] bg-[var(--state-blocked-light)] px-3 py-2 text-xs text-[var(--state-blocked)]" data-testid="whatif-error">
            {previewError}
          </div>
        )}

        {simulateMutation.isPending && (
          <p className="text-xs text-[var(--text-tertiary)]" data-testid="whatif-pending">
            Updating preview...
          </p>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
