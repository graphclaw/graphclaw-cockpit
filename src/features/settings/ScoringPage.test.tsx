import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ScoringPage } from '@/features/settings/ScoringPage';

describe('ScoringPage', () => {
  it('renders all 7 scoring factors', async () => {
    renderWithProviders(<ScoringPage />);
    await screen.findByText('Timeline Urgency');
    expect(screen.getByText('Dependencies')).toBeInTheDocument();
    expect(screen.getByText('Critical Path')).toBeInTheDocument();
    expect(screen.getByText('Blocker Impact')).toBeInTheDocument();
    expect(screen.getByText('Manual Override')).toBeInTheDocument();
    expect(screen.getByText('Resource Risk')).toBeInTheDocument();
    expect(screen.getByText('Constraint')).toBeInTheDocument();
  });

  it('shows total weight', async () => {
    renderWithProviders(<ScoringPage />);
    await screen.findByText(/Total: 1.00/);
  });

  it('has save and reset buttons', async () => {
    renderWithProviders(<ScoringPage />);
    await screen.findByText('Save Weights');
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });
});
