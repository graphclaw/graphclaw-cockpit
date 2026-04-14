import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';

describe('Sidebar', () => {
  beforeEach(() => {
    useThemeStore.setState({ sidebarCollapsed: false });
    useAuthStore.setState({ isAuthenticated: true, role: 'ADMIN' });
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
});
