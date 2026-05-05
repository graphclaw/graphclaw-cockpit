/**
 * GC-S-SCO-W50-001 - renders and sorts scoring queue task rows.
 *
 * Scenario: Scoring panel should show ranked action-queue tasks, allow sorting,
 * and expose row selection state for factor breakdown handoff.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - renders queue rows and highlights top-ranked row
 *  - toggles sorting by score from descending to ascending
 *  - calls onSelectTask when a row is clicked
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { useActionQueue } from '@/lib/api-hooks';
import { ScoringTaskTable } from './ScoringTaskTable';

vi.mock('@/lib/api-hooks', () => ({
  useActionQueue: vi.fn(),
}));

const mockUseActionQueue = vi.mocked(useActionQueue);

const sampleQueue = [
  {
    node_id: 'TASK-101',
    final_score: 0.62,
    rank: 2,
    recommended_action: 'FOLLOW_UP',
    autonomy_level: 'ASSISTED',
    explanation: {
      node_id: 'TASK-101',
      scored_at: '2026-05-05T10:00:00Z',
      final_score: 0.62,
      rank: 2,
      factors: [
        {
          factor_name: 'Timeline urgency',
          raw_score: 0.8,
          weight: 0.25,
          weighted_score: 0.2,
          plain_english: 'due soon',
        },
      ],
    },
  },
  {
    node_id: 'TASK-102',
    final_score: 0.91,
    rank: 1,
    recommended_action: 'EXECUTE',
    autonomy_level: 'AUTO',
    explanation: {
      node_id: 'TASK-102',
      scored_at: '2026-05-05T10:01:00Z',
      final_score: 0.91,
      rank: 1,
      factors: [
        {
          factor_name: 'Critical path',
          raw_score: 0.9,
          weight: 0.2,
          weighted_score: 0.18,
          plain_english: 'blocks downstream work',
        },
      ],
    },
  },
] as const;

describe('ScoringTaskTable', () => {
  beforeEach(() => {
    mockUseActionQueue.mockReturnValue({
      data: [...sampleQueue],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);
  });

  it('renders queue rows and highlights top ranked row', () => {
    renderWithProviders(<ScoringTaskTable />);

    expect(screen.getByTestId('scoring-task-table')).toBeInTheDocument();
    expect(screen.getByTestId('scoring-task-row-top')).toHaveTextContent('TASK-102');
    expect(screen.getByText('Timeline urgency')).toBeInTheDocument();
    expect(screen.getByText('Critical path')).toBeInTheDocument();
  });

  it('toggles score sorting direction', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScoringTaskTable />);

    await user.click(screen.getByTestId('scoring-sort-score'));
    expect(screen.getByTestId('scoring-task-row-top')).toHaveTextContent('TASK-102');

    await user.click(screen.getByTestId('scoring-sort-score'));
    expect(screen.getByTestId('scoring-task-row-top')).toHaveTextContent('TASK-101');
  });

  it('calls onSelectTask when row is clicked', async () => {
    const user = userEvent.setup();
    const onSelectTask = vi.fn();

    renderWithProviders(<ScoringTaskTable onSelectTask={onSelectTask} />);

    await user.click(screen.getByText('TASK-101'));

    expect(onSelectTask).toHaveBeenCalledWith('TASK-101');
  });

  it('renders explicit empty state when queue has no rows', () => {
    mockUseActionQueue.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<ScoringTaskTable />);

    expect(screen.getByTestId('scoring-task-table-empty')).toBeInTheDocument();
    expect(screen.getByText('Action queue is empty.')).toBeInTheDocument();
  });
});
