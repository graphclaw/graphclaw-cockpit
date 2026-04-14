import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { SkillAuthoringPage } from '@/features/intelligence/SkillAuthoringPage';

describe('SkillAuthoringPage', () => {
  it('renders skill list', () => {
    renderWithProviders(<SkillAuthoringPage />);
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getAllByText('email-triage').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('code-review')).toBeInTheDocument();
    expect(screen.getByText('meeting-notes')).toBeInTheDocument();
  });

  it('renders editor for selected skill', () => {
    renderWithProviders(<SkillAuthoringPage />);
    expect(screen.getByTestId('skill-editor')).toBeInTheDocument();
  });

  it('shows version info', () => {
    renderWithProviders(<SkillAuthoringPage />);
    expect(screen.getAllByText('v1.2.0').length).toBeGreaterThanOrEqual(1);
  });
});
