import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { MembersPage } from '@/features/admin/MembersPage';

describe('MembersPage', () => {
  it('renders member list', () => {
    renderWithProviders(<MembersPage />);
    expect(screen.getByText(/Members/)).toBeInTheDocument();
    expect(screen.getByText('Alice Chen')).toBeInTheDocument();
    expect(screen.getByText('Bob Kumar')).toBeInTheDocument();
    expect(screen.getByText('Dave Smith')).toBeInTheDocument();
  });

  it('shows invite button', () => {
    renderWithProviders(<MembersPage />);
    expect(screen.getByText('Invite')).toBeInTheDocument();
  });

  it('shows role and status for each member', () => {
    renderWithProviders(<MembersPage />);
    expect(screen.getAllByText('active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('suspended')).toBeInTheDocument();
  });
});
