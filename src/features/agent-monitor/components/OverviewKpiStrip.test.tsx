import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { OverviewKpiStrip } from '@/features/agent-monitor/components/OverviewKpiStrip';
import { useAgentStatus, useAgentTriggers } from '@/lib/api-hooks';
import { useAttentionItems } from '@/features/agent-monitor/hooks/useAttentionItems';

vi.mock('@/lib/api-hooks', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api-hooks')>('@/lib/api-hooks');
  return {
    ...actual,
    useAgentStatus: vi.fn(),
    useAgentTriggers: vi.fn(),
  };
});

vi.mock('@/features/agent-monitor/hooks/useAttentionItems', () => ({
  useAttentionItems: vi.fn(),
}));

const mockUseAgentStatus = vi.mocked(useAgentStatus);
const mockUseAgentTriggers = vi.mocked(useAgentTriggers);
const mockUseAttentionItems = vi.mocked(useAttentionItems);

describe('OverviewKpiStrip', () => {
  beforeEach(() => {
    mockUseAgentStatus.mockReturnValue({
      data: {
        running: true,
        last_cycle_at: new Date(Date.now() - 5 * 60_000).toISOString(),
        queue_depth: 3,
        agent_version: 'v1',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAgentStatus>);

    mockUseAgentTriggers.mockReturnValue({
      data: [
        {
          trigger_id: 't-1',
          name: 'Daily briefing',
          schedule: 'daily',
          enabled: true,
          next_fire_at: new Date(Date.now() + 10 * 60_000).toISOString(),
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAgentTriggers>);

    mockUseAttentionItems.mockReturnValue({
      count: 2,
      items: [],
      failedSkillCount: 1,
      staleRunnerCount: 1,
      isLoading: false,
    });
  });

  it('renders all four KPI cards', () => {
    renderWithProviders(<OverviewKpiStrip />);

    expect(screen.getByText('Agent Status')).toBeInTheDocument();
    expect(screen.getByText('Last Run')).toBeInTheDocument();
    expect(screen.getByText('Next Run')).toBeInTheDocument();
    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders per-card error fallback when status query fails', () => {
    mockUseAgentStatus.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Status unavailable'),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAgentStatus>);

    renderWithProviders(<OverviewKpiStrip />);

    expect(screen.getAllByText('Failed to load').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Retry' }).length).toBeGreaterThan(0);
  });
});
