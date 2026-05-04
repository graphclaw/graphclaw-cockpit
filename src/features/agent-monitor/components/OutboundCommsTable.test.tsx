import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { useOutboundLog } from '@/lib/api-hooks';
import { OutboundCommsTable } from './OutboundCommsTable';

vi.mock('@/lib/api-hooks', () => ({
  useOutboundLog: vi.fn(),
}));

const mockUseOutboundLog = vi.mocked(useOutboundLog);

describe('OutboundCommsTable', () => {
  beforeEach(() => {
    mockUseOutboundLog.mockReturnValue({
      data: {
        items: [
          {
            timestamp: '2026-05-03T14:32:07Z',
            channel: 'email',
            to_display: 'Priya',
            subject: 'Quick status update for sprint goals',
            task_id: 'TK-4822',
            status: 'sent',
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    } as never);
  });

  it('renders outbound rows with task chip', () => {
    renderWithProviders(<OutboundCommsTable />);

    expect(screen.getByTestId('outbound-log-table')).toBeInTheDocument();
    expect(screen.getByTestId('channel-badge-email')).toBeInTheDocument();
    expect(screen.getByText('EMAIL')).toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();
    expect(screen.getByText('#TK-4822')).toBeInTheDocument();
  });

  it('shows empty state when outbound log is unavailable', () => {
    mockUseOutboundLog.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    } as never);

    renderWithProviders(<OutboundCommsTable />);

    expect(screen.getByText('No outbound messages yet.')).toBeInTheDocument();
  });
});
