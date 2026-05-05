/**
 * GC-S-TSK-W50-013 - renders scheduling run history with pagination controls.
 *
 * Scenario: Scheduling panel run history should render session rows from
 * `/agent/sessions`, show empty fallback when no sessions exist, and support load more.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L2 Component
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - renders session summary row values from paged sessions payload
 *  - renders empty state when no session items exist
 *  - calls fetchNextPage when load more is clicked
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { useInfiniteAgentSessions } from '@/lib/api-hooks';
import { SchedulingRunHistoryTable } from './SchedulingRunHistoryTable';

vi.mock('@/lib/api-hooks', () => ({
  useInfiniteAgentSessions: vi.fn(),
}));

const mockUseInfiniteAgentSessions = vi.mocked(useInfiniteAgentSessions);

function buildQueryState(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    data: {
      pages: [],
      pageParams: [0],
    },
    isLoading: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  };
}

describe('SchedulingRunHistoryTable', () => {
  beforeEach(() => {
    mockUseInfiniteAgentSessions.mockReturnValue(buildQueryState() as never);
  });

  it('renders run history row with core fields', () => {
    mockUseInfiniteAgentSessions.mockReturnValue(
      buildQueryState({
        data: {
          pages: [
            {
              items: [
                {
                  sessionId: 'SES-abc1234567890',
                  startedAt: '2026-05-05T11:00:00Z',
                  completedAt: '2026-05-05T11:02:05Z',
                  triggerType: 'manual',
                  toolCallCount: 3,
                  skillCount: 1,
                  messagesSent: 2,
                  messagesReceived: 1,
                  inputTokens: 1200,
                  outputTokens: 320,
                  status: 'completed',
                },
              ],
            },
          ],
          pageParams: [0],
        },
      }) as never,
    );

    renderWithProviders(<SchedulingRunHistoryTable />);

    expect(screen.getByTestId('scheduling-run-history')).toBeInTheDocument();
    expect(screen.getByTestId('scheduling-run-history-row')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText('3 tool · 1 skill')).toBeInTheDocument();
    expect(screen.getByText('2 out · 1 in')).toBeInTheDocument();
    expect(screen.getByText('1200 / 320')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('renders empty state when no session rows exist', () => {
    renderWithProviders(<SchedulingRunHistoryTable />);

    expect(screen.getByTestId('scheduling-run-history-empty')).toBeInTheDocument();
    expect(screen.getByText('No recent run history.')).toBeInTheDocument();
  });

  it('loads next page when load more is clicked', async () => {
    const user = userEvent.setup();
    const fetchNextPage = vi.fn();

    mockUseInfiniteAgentSessions.mockReturnValue(
      buildQueryState({
        hasNextPage: true,
        fetchNextPage,
        data: {
          pages: [
            {
              items: [
                {
                  sessionId: 'SES-123',
                  startedAt: '2026-05-05T11:00:00Z',
                  completedAt: '2026-05-05T11:01:00Z',
                  status: 'completed',
                },
              ],
            },
          ],
          pageParams: [0],
        },
      }) as never,
    );

    renderWithProviders(<SchedulingRunHistoryTable />);
    await user.click(screen.getByTestId('scheduling-run-history-load-more'));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });
});
