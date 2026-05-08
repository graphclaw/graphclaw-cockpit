// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { AttentionStrip } from '@/features/agent-monitor/components/AttentionStrip';
import { useAttentionItems } from '@/features/agent-monitor/hooks/useAttentionItems';

vi.mock('@/features/agent-monitor/hooks/useAttentionItems', () => ({
  useAttentionItems: vi.fn(() => ({
    count: 0,
    items: [],
    failedSkillCount: 0,
    staleRunnerCount: 0,
    isLoading: false,
  })),
}));

const mockUseAttentionItems = vi.mocked(useAttentionItems);

describe('AttentionStrip', () => {
  beforeEach(() => {
    mockUseAttentionItems.mockReturnValue({
      count: 0,
      items: [],
      failedSkillCount: 0,
      staleRunnerCount: 0,
      isLoading: false,
    });
  });

  it('does not render when there are no attention items', () => {
    renderWithProviders(<AttentionStrip />);

    expect(screen.queryByTestId('agent-monitor-attention-strip')).not.toBeInTheDocument();
  });

  it('renders attention rows when issues exist', () => {
    mockUseAttentionItems.mockReturnValue({
      count: 2,
      items: [
        {
          id: 'skill:research:TK-4821',
          severity: 'critical',
          icon: 'alert-circle',
          text: 'Research failed on #TK-4821 - tried 3 times.',
          taskId: 'TK-4821',
          actionHref: '/tasks/TK-4821',
        },
        {
          id: 'runner:subagent-1:now',
          severity: 'warning',
          icon: 'clock',
          text: 'Heartbeat for subagent-1 is stale (6m since last update).',
        },
      ],
      failedSkillCount: 1,
      staleRunnerCount: 1,
      isLoading: false,
    });

    renderWithProviders(<AttentionStrip />);

    expect(screen.getByTestId('agent-monitor-attention-strip')).toBeInTheDocument();
    expect(screen.getByText('Research failed on #TK-4821 - tried 3 times.')).toBeInTheDocument();
    expect(screen.getByText('Heartbeat for subagent-1 is stale (6m since last update).')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '#TK-4821' })).toBeInTheDocument();
  });

  it('dismisses an item locally after clicking dismiss', async () => {
    const user = userEvent.setup();

    mockUseAttentionItems.mockReturnValue({
      count: 1,
      items: [
        {
          id: 'skill:research:TK-4821',
          severity: 'critical',
          icon: 'alert-circle',
          text: 'Research failed on #TK-4821 - tried 3 times.',
          taskId: 'TK-4821',
          actionHref: '/tasks/TK-4821',
        },
      ],
      failedSkillCount: 1,
      staleRunnerCount: 0,
      isLoading: false,
    });

    renderWithProviders(<AttentionStrip />);

    await user.click(screen.getByRole('button', { name: /dismiss alert/i }));

    expect(screen.queryByText('Research failed on #TK-4821 - tried 3 times.')).not.toBeInTheDocument();
  });
});
