import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { useAgentTriggers, useFireAgentTrigger } from '@/lib/api-hooks';
import { SchedulingNextRunCard } from './SchedulingNextRunCard';

vi.mock('@/lib/api-hooks', () => ({
  useAgentTriggers: vi.fn(),
  useFireAgentTrigger: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUseAgentTriggers = vi.mocked(useAgentTriggers);
const mockUseFireAgentTrigger = vi.mocked(useFireAgentTrigger);

describe('SchedulingNextRunCard', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    mutate.mockReset();

    mockUseAgentTriggers.mockReturnValue({
      data: [
        {
          trigger_id: 'tr-1',
          name: 'Daily Briefing',
          schedule: '0 9 * * *',
          enabled: true,
          next_fire_at: new Date(Date.now() + 20 * 60_000).toISOString(),
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    mockUseFireAgentTrigger.mockReturnValue({
      mutate,
      isPending: false,
    } as never);
  });

  it('renders next trigger details', () => {
    renderWithProviders(<SchedulingNextRunCard />);

    expect(screen.getByTestId('scheduling-next-run-card')).toBeInTheDocument();
    expect(screen.getByTestId('scheduling-trigger-name')).toHaveTextContent('Daily Briefing');
    expect(screen.getByTestId('scheduling-next-run-value')).toHaveTextContent(/In|Now/);
  });

  it('renders no schedule fallback when triggers are empty', () => {
    mockUseAgentTriggers.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<SchedulingNextRunCard />);

    expect(screen.getByText('No schedule configured')).toBeInTheDocument();
    expect(screen.getByTestId('scheduling-run-now-button')).toBeDisabled();
  });

  it('fires run now mutation for selected trigger', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SchedulingNextRunCard />);

    await user.click(screen.getByTestId('scheduling-run-now-button'));

    expect(mutate).toHaveBeenCalledWith('tr-1', expect.any(Object));
  });
});
