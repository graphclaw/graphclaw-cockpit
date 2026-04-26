import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { SkillAuthoringPage } from '@/features/intelligence/SkillAuthoringPage';

describe('SkillAuthoringPage', () => {
  it('renders skill list', async () => {
    renderWithProviders(<SkillAuthoringPage />);
    await waitFor(() => {
      expect(screen.getByText('Skills')).toBeInTheDocument();
      expect(screen.getByText('my-custom-skill')).toBeInTheDocument();
    });
  });

  it('renders editor for selected skill', async () => {
    renderWithProviders(<SkillAuthoringPage />);
    await waitFor(() => {
      expect(screen.getByTestId('skill-editor')).toBeInTheDocument();
    });
  });

  it('shows version info', async () => {
    renderWithProviders(<SkillAuthoringPage />);
    await waitFor(() => {
      expect(screen.getAllByText('v0.1.0').length).toBeGreaterThanOrEqual(1);
    });
  });
});
