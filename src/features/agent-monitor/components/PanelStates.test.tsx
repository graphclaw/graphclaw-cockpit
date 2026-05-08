// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Activity } from 'lucide-react';
import { renderWithProviders } from '@/test/utils';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { PanelError } from '@/features/agent-monitor/components/PanelError';

describe('Agent Monitor panel state components', () => {
  it('renders EmptyPanel content and action', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    renderWithProviders(
      <EmptyPanel
        icon={Activity}
        title="No activity yet"
        subtitle="Agent runs will appear here in real time."
        action={{ label: 'Refresh', onClick: onAction }}
      />,
    );

    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByText('Agent runs will appear here in real time.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders PanelSkeleton rows', () => {
    renderWithProviders(<PanelSkeleton rows={3} withHeader={false} />);

    expect(screen.getAllByTestId('agent-monitor-panel-skeleton-row')).toHaveLength(3);
  });

  it('renders PanelError and calls retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(<PanelError error="Failed to load panel data." onRetry={onRetry} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Failed to load panel data.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
