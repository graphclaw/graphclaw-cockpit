// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-S-SCO-W50-003 - previews simulated score changes from factor controls.
 *
 * Scenario: The what-if modal should expose all seven controls and send a
 * debounced `/scoring/simulate` request with normalized factor values.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - renders all simulator controls and preview-only banner
 *  - sends normalized modified_factors payload after debounce
 *  - renders updated score delta from simulation response
 */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { useSimulateTaskScore } from '@/lib/api-hooks';
import { WhatIfSimulator } from './WhatIfSimulator';

vi.mock('@/lib/api-hooks', () => ({
  useSimulateTaskScore: vi.fn(),
}));

const mockUseSimulateTaskScore = vi.mocked(useSimulateTaskScore);

const baseline = {
  task_id: 'TASK-123',
  final_score: 0.87,
  scored_at: '2026-05-05T10:00:00Z',
  factors: [
    { factor_name: 'W1 Timeline Urgency', raw_score: 0.9, weight: 0.25, weighted_score: 0.225, plain_english: 'due soon' },
    { factor_name: 'W2 Dependency Weight', raw_score: 0.8, weight: 0.2, weighted_score: 0.16, plain_english: 'many dependents' },
    { factor_name: 'W3 Critical Path', raw_score: 1, weight: 0.2, weighted_score: 0.2, plain_english: 'on critical path' },
    { factor_name: 'W4 Blocker Score', raw_score: 0, weight: 0.15, weighted_score: 0, plain_english: 'not blocked' },
    { factor_name: 'W5 Human Override', raw_score: 0.33, weight: 0.1, weighted_score: 0.033, plain_english: 'medium override' },
    { factor_name: 'W6 Resource Risk', raw_score: 0.2, weight: 0.05, weighted_score: 0.01, plain_english: 'low risk' },
    { factor_name: 'W7 Constraint Pressure', raw_score: 0.1, weight: 0.05, weighted_score: 0.005, plain_english: 'low pressure' },
  ],
} as const;

describe('WhatIfSimulator', () => {
  beforeEach(() => {
    mockUseSimulateTaskScore.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ ...baseline, final_score: 0.91 }),
      isPending: false,
    } as never);
  });

  it('renders all controls and preview-only banner', () => {
    renderWithProviders(
      <WhatIfSimulator taskId="TASK-123" baseline={baseline} open onOpenChange={vi.fn()} />,
    );

    expect(screen.getByTestId('score-what-if-dialog')).toBeInTheDocument();
    expect(screen.getByText('Preview only - no changes are saved.')).toBeInTheDocument();
    expect(screen.getByTestId('whatif-control-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('whatif-control-dependency')).toBeInTheDocument();
    expect(screen.getByTestId('whatif-control-critical')).toBeInTheDocument();
    expect(screen.getByTestId('whatif-control-blocker')).toBeInTheDocument();
    expect(screen.getByTestId('whatif-control-override')).toBeInTheDocument();
    expect(screen.getByTestId('whatif-control-resource')).toBeInTheDocument();
    expect(screen.getByTestId('whatif-control-constraint')).toBeInTheDocument();
  });

  it('sends normalized modified_factors payload after debounce', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ ...baseline, final_score: 0.91 });
    mockUseSimulateTaskScore.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    renderWithProviders(
      <WhatIfSimulator taskId="TASK-123" baseline={baseline} open onOpenChange={vi.fn()} />,
    );

    fireEvent.change(screen.getByTestId('whatif-control-timeline').querySelector('input')!, {
      target: { value: '15' },
    });
    fireEvent.change(screen.getByTestId('whatif-control-dependency').querySelector('input')!, {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByTestId('whatif-control-blocker').querySelector('input')!);
    fireEvent.change(screen.getByTestId('whatif-control-override').querySelector('input')!, {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByTestId('whatif-control-resource').querySelector('input')!, {
      target: { value: '0.8' },
    });
    fireEvent.change(screen.getByTestId('whatif-control-constraint').querySelector('input')!, {
      target: { value: '0.4' },
    });

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        task_id: 'TASK-123',
        modified_factors: {
          timeline_urgency: 0.5,
          dependency_weight: 0.5,
          critical_path: 1,
          blocker: 1,
          human_override: 1,
          resource_risk: 0.8,
          constraint_pressure: 0.4,
        },
      });
    }, { timeout: 2000 });
  });

  it('renders score delta after simulation response', async () => {
    renderWithProviders(
      <WhatIfSimulator taskId="TASK-123" baseline={baseline} open onOpenChange={vi.fn()} />,
    );

    fireEvent.change(screen.getByTestId('whatif-control-timeline').querySelector('input')!, {
      target: { value: '12' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('whatif-delta')).toHaveTextContent('Score would change from 0.87 -> 0.91 (+0.04)');
    }, { timeout: 2000 });
  });
});
