import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { AuditPage } from '@/features/admin/AuditPage';

describe('AuditPage', () => {
  it('renders audit log entries', async () => {
    renderWithProviders(<AuditPage />);
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
    await screen.findByText('member.invite');
    expect(screen.getByText('task.state_change')).toBeInTheDocument();
  });

  it('shows export button', () => {
    renderWithProviders(<AuditPage />);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithProviders(<AuditPage />);
    expect(screen.getByPlaceholderText('Search audit log...')).toBeInTheDocument();
  });
});
