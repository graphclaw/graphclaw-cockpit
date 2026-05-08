// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { useInboundLog } from '@/lib/api-hooks';
import { InboundCommsTable } from './InboundCommsTable';

vi.mock('@/lib/api-hooks', () => ({
  useInboundLog: vi.fn(),
}));

const mockUseInboundLog = vi.mocked(useInboundLog);

describe('InboundCommsTable', () => {
  beforeEach(() => {
    mockUseInboundLog.mockReturnValue({
      data: {
        items: [
          {
            timestamp: '2026-05-03T14:32:07Z',
            channel: 'email',
            from_display: 'Alex',
            message_preview: 'Shared the final budget sheet and ETA update for review.',
            task_id: 'TK-4821',
            action_taken: 'Matched',
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    } as never);
  });

  it('renders inbound rows with task chip', () => {
    renderWithProviders(<InboundCommsTable />);

    expect(screen.getByTestId('inbound-log-table')).toBeInTheDocument();
    expect(screen.getByTestId('channel-badge-email')).toBeInTheDocument();
    expect(screen.getByText('EMAIL')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('#TK-4821')).toBeInTheDocument();
  });

  it('shows empty state when inbound log is unavailable', () => {
    mockUseInboundLog.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    } as never);

    renderWithProviders(<InboundCommsTable />);

    expect(screen.getByText('No inbound messages yet.')).toBeInTheDocument();
  });
});
