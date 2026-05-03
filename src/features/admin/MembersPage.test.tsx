import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { MembersPage } from '@/features/admin/MembersPage';

describe('MembersPage', () => {
  it('renders member list', async () => {
    renderWithProviders(<MembersPage />);
    expect(screen.getByText(/Members/)).toBeInTheDocument();
    expect(await screen.findByText('Alice Chen')).toBeInTheDocument();
    expect(screen.getByText('Bob Kumar')).toBeInTheDocument();
    expect(screen.getByText('Dave Smith')).toBeInTheDocument();
  });

  it('shows invite button', () => {
    renderWithProviders(<MembersPage />);
    expect(screen.getByText('Invite')).toBeInTheDocument();
  });

  it('shows role and status for each member', async () => {
    renderWithProviders(<MembersPage />);
    await screen.findByText('Alice Chen');
    expect(screen.getAllByText('ACTIVE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('INVITED')).toBeInTheDocument();
  });
});
