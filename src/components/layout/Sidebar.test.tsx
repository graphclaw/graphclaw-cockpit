// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { useAttentionItems } from '@/features/agent-monitor/hooks/useAttentionItems';

vi.mock('@/features/agent-monitor/hooks/useAttentionItems', () => ({
  useAttentionItems: vi.fn(() => ({
    count: 0,
    failedSkillCount: 0,
    staleRunnerCount: 0,
    isLoading: false,
  })),
}));

const mockUseAttentionItems = vi.mocked(useAttentionItems);

describe('Sidebar', () => {
  beforeEach(() => {
    useThemeStore.setState({ sidebarCollapsed: false });
    useAuthStore.setState({ isAuthenticated: true, role: 'ADMIN' });
    mockUseAttentionItems.mockReturnValue({
      count: 0,
      failedSkillCount: 0,
      staleRunnerCount: 0,
      isLoading: false,
    });
  });

  it('renders workspace nav items', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
  });

  it('renders intelligence nav items', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText('Agent Monitor')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('renders admin nav for admin users', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('hides admin nav for non-admin users', () => {
    useAuthStore.setState({ role: 'USER' });
    renderWithProviders(<Sidebar />);
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('shows settings link', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('collapse toggle changes sidebar state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sidebar />);

    const toggleBtn = screen.getByLabelText('Collapse sidebar');
    await user.click(toggleBtn);
    expect(useThemeStore.getState().sidebarCollapsed).toBe(true);
  });

  it('keeps Agent Monitor active for nested monitor routes', () => {
    renderWithProviders(<Sidebar />, { initialRoute: '/agent-monitor/comms/outbound' });

    const agentMonitorLink = screen.getByRole('link', { name: 'Agent Monitor' });
    expect(agentMonitorLink.className).toContain('bg-[var(--brand-primary)]/10');
  });

  it('shows and hides Agent Monitor attention badge based on count', () => {
    mockUseAttentionItems.mockReturnValue({
      count: 3,
      failedSkillCount: 2,
      staleRunnerCount: 1,
      isLoading: false,
    });

    const { rerender } = renderWithProviders(<Sidebar />);
    expect(screen.getByTestId('sidebar-agent-monitor-badge')).toHaveTextContent('3');

    mockUseAttentionItems.mockReturnValue({
      count: 0,
      failedSkillCount: 0,
      staleRunnerCount: 0,
      isLoading: false,
    });

    rerender(<Sidebar />);
    expect(screen.queryByTestId('sidebar-agent-monitor-badge')).not.toBeInTheDocument();
  });
});
