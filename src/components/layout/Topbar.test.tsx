import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Topbar } from '@/components/layout/Topbar';
import { useAuthStore } from '@/stores/auth';

describe('Topbar', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: true, userId: 'user-001', role: 'ADMIN' });
  });

  it('renders breadcrumbs', () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByPlaceholderText('Search goals, tasks, people...')).toBeInTheDocument();
  });

  it('renders notification bell', () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('renders avatar with user initials', () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByText('US')).toBeInTheDocument();
  });
});
