import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ScoringPage } from '@/features/settings/ScoringPage';

describe('ScoringPage', () => {
  it('renders all 7 scoring factors', () => {
    renderWithProviders(<ScoringPage />);
    expect(screen.getByText('Urgency')).toBeInTheDocument();
    expect(screen.getByText('Importance')).toBeInTheDocument();
    expect(screen.getByText('Dependencies')).toBeInTheDocument();
    expect(screen.getByText('Recency')).toBeInTheDocument();
    expect(screen.getByText('Effort')).toBeInTheDocument();
    expect(screen.getByText('Alignment')).toBeInTheDocument();
    expect(screen.getByText('Capacity')).toBeInTheDocument();
  });

  it('shows total weight', () => {
    renderWithProviders(<ScoringPage />);
    expect(screen.getByText(/Total: 1.00/)).toBeInTheDocument();
  });

  it('has save and reset buttons', () => {
    renderWithProviders(<ScoringPage />);
    expect(screen.getByText('Save Weights')).toBeInTheDocument();
    expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
  });
});
