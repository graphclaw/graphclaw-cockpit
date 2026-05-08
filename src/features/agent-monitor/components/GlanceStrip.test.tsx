// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { GlanceStrip } from '@/features/agent-monitor/components/GlanceStrip';
import { useGlanceMetrics } from '@/features/agent-monitor/hooks/useGlanceMetrics';

vi.mock('@/features/agent-monitor/hooks/useGlanceMetrics', () => ({
  useGlanceMetrics: vi.fn(),
}));

const mockUseGlanceMetrics = vi.mocked(useGlanceMetrics);

describe('GlanceStrip', () => {
  beforeEach(() => {
    mockUseGlanceMetrics.mockReturnValue({
      messagesReceived: 4,
      repliesSent: 2,
      skillsRun: { ok: 6, failed: 1 },
      tasksScored: 11,
      runsToday: 3,
      isLoading: false,
    });
  });

  it('renders five glance metrics', () => {
    renderWithProviders(<GlanceStrip />);

    expect(screen.getByTestId('agent-monitor-glance-strip')).toBeInTheDocument();
    expect(screen.getByTestId('glance-messages-received')).toHaveTextContent('4');
    expect(screen.getByTestId('glance-replies-sent')).toHaveTextContent('2');
    expect(screen.getByTestId('glance-skills-run')).toHaveTextContent('6/1');
    expect(screen.getByTestId('glance-tasks-scored')).toHaveTextContent('11');
    expect(screen.getByTestId('glance-runs-today')).toHaveTextContent('3');
  });

  it('shows fallback placeholders for unavailable optional endpoints', () => {
    mockUseGlanceMetrics.mockReturnValue({
      messagesReceived: null,
      repliesSent: null,
      skillsRun: { ok: 0, failed: 0 },
      tasksScored: null,
      runsToday: null,
      isLoading: false,
    });

    renderWithProviders(<GlanceStrip />);

    expect(screen.getByTestId('glance-messages-received')).toHaveTextContent('-');
    expect(screen.getByTestId('glance-replies-sent')).toHaveTextContent('-');
    expect(screen.getByTestId('glance-tasks-scored')).toHaveTextContent('-');
    expect(screen.getByTestId('glance-runs-today')).toHaveTextContent('-');
  });
});
