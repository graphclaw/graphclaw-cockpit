import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { FeaturesPage } from '@/features/admin/FeaturesPage';

describe('FeaturesPage', () => {
  it('renders feature gates', async () => {
    renderWithProviders(<FeaturesPage />);
    await screen.findByText('Feature Gates');
    expect(screen.getByText('MCP Connectors')).toBeInTheDocument();
    expect(screen.getByText('Agent Canvas')).toBeInTheDocument();
    expect(screen.getByText('Skill Marketplace')).toBeInTheDocument();
    expect(screen.getByText('A2A Protocol')).toBeInTheDocument();
  });

  it('shows a toggle for each feature', async () => {
    renderWithProviders(<FeaturesPage />);
    await screen.findByText('Feature Gates');
    const toggles = screen.getAllByRole('switch');
    expect(toggles.length).toBe(5);
  });
});
