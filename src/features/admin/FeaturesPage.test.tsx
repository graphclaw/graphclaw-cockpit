import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { FeaturesPage } from '@/features/admin/FeaturesPage';

describe('FeaturesPage', () => {
  it('renders feature gates', () => {
    renderWithProviders(<FeaturesPage />);
    expect(screen.getByText('Feature Gates')).toBeInTheDocument();
    expect(screen.getByText('MCP Connectors')).toBeInTheDocument();
    expect(screen.getByText('Agent Canvas')).toBeInTheDocument();
    expect(screen.getByText('Score Simulator')).toBeInTheDocument();
  });

  it('shows scope for each feature', () => {
    renderWithProviders(<FeaturesPage />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(8);
  });
});
