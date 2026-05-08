// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { LiveTicker } from '@/features/agent-monitor/components/LiveTicker';
import { useLiveTickerEvents } from '@/features/agent-monitor/hooks/useLiveTickerEvents';

vi.mock('@/features/agent-monitor/hooks/useLiveTickerEvents', () => ({
  useLiveTickerEvents: vi.fn(),
}));

const mockUseLiveTickerEvents = vi.mocked(useLiveTickerEvents);

describe('LiveTicker', () => {
  beforeEach(() => {
    mockUseLiveTickerEvents.mockReturnValue({
      events: [
        {
          id: 'evt-1',
          eventType: 'task.scored',
          timestamp: '2026-05-03T14:32:00Z',
          time: '14:32',
          dotColor: 'green',
          message: 'Scored 14 tasks - top priority: Competitive analysis',
          taskId: 'TK-4821',
        },
      ],
      isLive: true,
      connectionState: 'connected',
    });
  });

  it('renders ticker rows and live badge', () => {
    renderWithProviders(<LiveTicker />);

    expect(screen.getByTestId('agent-monitor-live-ticker')).toBeInTheDocument();
    expect(screen.getByTestId('agent-monitor-live-badge')).toBeInTheDocument();
    expect(screen.getByText('Scored 14 tasks - top priority: Competitive analysis')).toBeInTheDocument();
    expect(screen.getByText('#TK-4821')).toBeInTheDocument();
  });

  it('renders empty state when there are no events', () => {
    mockUseLiveTickerEvents.mockReturnValue({
      events: [],
      isLive: false,
      connectionState: 'disconnected',
    });

    renderWithProviders(<LiveTicker />);

    expect(screen.queryByTestId('agent-monitor-live-badge')).not.toBeInTheDocument();
    expect(screen.getByText('No live activity yet for today.')).toBeInTheDocument();
  });
});
