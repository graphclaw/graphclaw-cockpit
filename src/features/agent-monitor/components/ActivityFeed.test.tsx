import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ActivityFeed } from '@/features/agent-monitor/components/ActivityFeed';
import { useActivityFeed } from '@/features/agent-monitor/hooks/useActivityFeed';

vi.mock('@/features/agent-monitor/hooks/useActivityFeed', () => ({
  useActivityFeed: vi.fn(),
}));

const mockUseActivityFeed = vi.mocked(useActivityFeed);

describe('ActivityFeed', () => {
  beforeEach(() => {
    mockUseActivityFeed.mockReturnValue({
      items: [
        {
          timestamp: '2026-05-03T14:32:07Z',
          event_type: 'task.scored',
          message: 'Scored 14 tasks - top priority: Competitive analysis',
          task_id: 'TK-4821',
          status: 'done',
          raw: { event_type: 'task.scored' },
        },
      ],
      isLoading: false,
      isLoadingMore: false,
      error: null,
      hasNextPage: true,
      loadMore: vi.fn().mockResolvedValue(undefined),
      refetch: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('renders activity rows and load-more button', () => {
    renderWithProviders(<ActivityFeed />);

    expect(screen.getByTestId('agent-monitor-activity-feed')).toBeInTheDocument();
    expect(screen.getByText('Scored 14 tasks - top priority: Competitive analysis')).toBeInTheDocument();
    expect(screen.getByText('#TK-4821')).toBeInTheDocument();
    expect(screen.getByTestId('activity-load-more')).toBeInTheDocument();
  });

  it('opens raw event drawer when details is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivityFeed />);

    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByTestId('activity-raw-drawer')).toBeInTheDocument();
    expect(screen.getByText('Raw event JSON')).toBeInTheDocument();
  });

  it('shows empty state when no items are available', () => {
    mockUseActivityFeed.mockReturnValue({
      items: [],
      isLoading: false,
      isLoadingMore: false,
      error: null,
      hasNextPage: false,
      loadMore: vi.fn().mockResolvedValue(undefined),
      refetch: vi.fn().mockResolvedValue(undefined),
    });

    renderWithProviders(<ActivityFeed />);

    expect(screen.getByText('No activity in this range.')).toBeInTheDocument();
  });
});
