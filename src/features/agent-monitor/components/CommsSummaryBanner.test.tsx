import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { useCommsSummary } from '@/lib/api-hooks';
import { CommsSummaryBanner } from './CommsSummaryBanner';

vi.mock('@/lib/api-hooks', () => ({
  useCommsSummary: vi.fn(),
}));

const mockUseCommsSummary = vi.mocked(useCommsSummary);

describe('CommsSummaryBanner', () => {
  beforeEach(() => {
    mockUseCommsSummary.mockReturnValue({
      data: {
        received: 7,
        sent: 3,
      },
    } as never);
  });

  it('renders received and sent counts', () => {
    renderWithProviders(<CommsSummaryBanner />);

    expect(screen.getByTestId('comms-summary-received')).toHaveTextContent('7');
    expect(screen.getByTestId('comms-summary-sent')).toHaveTextContent('3');
  });

  it('shows fallback text when summary endpoint is unavailable', () => {
    mockUseCommsSummary.mockReturnValue({ data: null } as never);

    renderWithProviders(<CommsSummaryBanner />);

    expect(screen.getByTestId('comms-summary-received')).toHaveTextContent('-');
    expect(screen.getByText('Received falls back to - until gateway comms summary data is available.')).toBeInTheDocument();
  });

  it('updates range selector state', async () => {
    const user = userEvent.setup();

    renderWithProviders(<CommsSummaryBanner />);

    const range = screen.getByTestId('comms-summary-range');
    await user.selectOptions(range, '7d');

    expect(range).toHaveValue('7d');
  });
});
