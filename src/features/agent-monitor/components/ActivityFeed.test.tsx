// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
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
      sessionViewAvailable: false,
      sessionMetaById: {},
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
      sessionViewAvailable: false,
      sessionMetaById: {},
      hasNextPage: false,
      loadMore: vi.fn().mockResolvedValue(undefined),
      refetch: vi.fn().mockResolvedValue(undefined),
    });

    renderWithProviders(<ActivityFeed />);

    expect(screen.getByText('No activity in this range.')).toBeInTheDocument();
  });

  it('disables session view toggle when session list is unavailable', () => {
    renderWithProviders(<ActivityFeed />);

    const sessionToggle = screen.getByTestId('activity-view-session');
    expect(sessionToggle).toBeDisabled();
    expect(sessionToggle).toHaveAttribute('title', 'Coming soon');
  });

  it('renders grouped session view and expands rows', async () => {
    const user = userEvent.setup();

    mockUseActivityFeed.mockReturnValue({
      items: [
        {
          timestamp: '2026-05-03T14:32:07Z',
          event_type: 'agent.tool_call',
          message: 'Tool call completed.',
          task_id: 'TK-4821',
          status: 'done',
          session_id: 'SES-001',
          raw: { event_type: 'agent.tool_call' },
        },
        {
          timestamp: '2026-05-03T14:31:07Z',
          event_type: 'skill.completed',
          message: 'Research completed.',
          task_id: 'TK-4821',
          status: 'done',
          session_id: 'SES-001',
          raw: { event_type: 'skill.completed' },
        },
      ],
      isLoading: false,
      isLoadingMore: false,
      error: null,
      sessionViewAvailable: true,
      sessionMetaById: {
        'SES-001': {
          sessionId: 'SES-001',
          triggerType: 'daily_briefing',
        },
      },
      hasNextPage: false,
      loadMore: vi.fn().mockResolvedValue(undefined),
      refetch: vi.fn().mockResolvedValue(undefined),
    });

    renderWithProviders(<ActivityFeed />);

    await user.click(screen.getByTestId('activity-view-session'));
    expect(screen.getAllByTestId('activity-session-group')).toHaveLength(1);

    await user.click(screen.getByTestId('activity-session-header'));
    expect(screen.getByTestId('activity-session-table')).toBeInTheDocument();
    expect(screen.getByText('Daily Briefing')).toBeInTheDocument();
    expect(screen.getByText('Tools 1')).toBeInTheDocument();
    expect(screen.getByText('Skills 1')).toBeInTheDocument();
  });
});
