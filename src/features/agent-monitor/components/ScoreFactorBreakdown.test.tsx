/**
 * GC-S-SCO-W50-002 - renders scoring factor breakdown for selected task rows.
 *
 * Scenario: The scoring side panel should stay empty until a task is selected,
 * then load factor details from the scoring endpoint and show a readable summary.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - renders empty state when no task is selected
 *  - renders loading and error states from task-score query
 *  - renders mapped factor rows and explanation from API payload
 */
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { useTaskScore } from '@/lib/api-hooks';
import { ScoreFactorBreakdown } from '@/features/agent-monitor/components/ScoreFactorBreakdown';

vi.mock('@/lib/api-hooks', () => ({
  useTaskScore: vi.fn(),
}));

const mockUseTaskScore = vi.mocked(useTaskScore);

describe('ScoreFactorBreakdown', () => {
  it('renders empty state when no task is selected', () => {
    renderWithProviders(<ScoreFactorBreakdown taskId={null} />);

    expect(screen.getByTestId('score-factor-empty')).toBeInTheDocument();
    expect(screen.getByText('No factor breakdown selected.')).toBeInTheDocument();
  });

  it('renders loading and error states from task-score query', () => {
    mockUseTaskScore.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<ScoreFactorBreakdown taskId="TASK-100" />);
    expect(screen.getAllByTestId('agent-monitor-panel-skeleton-row')).not.toHaveLength(0);

    mockUseTaskScore.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      error: new Error('failed'),
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<ScoreFactorBreakdown taskId="TASK-100" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders factor rows and explanation for selected task', () => {
    mockUseTaskScore.mockReturnValue({
      data: {
        task_id: 'TASK-100',
        final_score: 0.87,
        explanation: 'This task is urgent and blocks multiple downstream items.',
        factors: [
          {
            factor_name: 'W1_timeline',
            raw_score: 0.9,
            weight: 0.25,
            weighted_score: 0.225,
            plain_english: 'deadline is soon',
          },
          {
            factor_name: 'W2_dependencies',
            raw_score: 0.8,
            weight: 0.2,
            weighted_score: 0.16,
            plain_english: 'many tasks depend on it',
          },
        ],
        scored_at: '2026-05-05T10:00:00Z',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<ScoreFactorBreakdown taskId="TASK-100" />);

    expect(screen.getByTestId('score-factor-breakdown')).toBeInTheDocument();
    expect(screen.getByText('Timeline urgency')).toBeInTheDocument();
    expect(screen.getByText('Dependency weight')).toBeInTheDocument();
    expect(screen.getByText('This task is urgent and blocks multiple downstream items.')).toBeInTheDocument();
    expect(screen.getByText('0.87')).toBeInTheDocument();
  });
});
