import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { EpisodicMemoryPage } from '@/features/intelligence/EpisodicMemoryPage';

describe('EpisodicMemoryPage', () => {
  it('renders episode list', () => {
    renderWithProviders(<EpisodicMemoryPage />);
    expect(screen.getByText('Episodic Memory')).toBeInTheDocument();
    expect(screen.getByText('Sprint 12 planning session')).toBeInTheDocument();
    expect(screen.getByText('Bug triage — scoring edge cases')).toBeInTheDocument();
  });

  it('shows entry count badge', () => {
    renderWithProviders(<EpisodicMemoryPage />);
    expect(screen.getByText('4 entries')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithProviders(<EpisodicMemoryPage />);
    expect(screen.getByPlaceholderText('Search episodes...')).toBeInTheDocument();
  });
});
