import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { SkillsPage } from '@/features/skills/SkillsPage';

describe('SkillsPage', () => {
  it('renders installed skills', () => {
    renderWithProviders(<SkillsPage />);
    expect(screen.getByText('email-triage')).toBeInTheDocument();
    expect(screen.getByText('meeting-summarizer')).toBeInTheDocument();
    expect(screen.getByText('code-review')).toBeInTheDocument();
  });

  it('shows active/installed count', () => {
    renderWithProviders(<SkillsPage />);
    expect(screen.getByText(/3 active \/ 5 installed/)).toBeInTheDocument();
  });

  it('renders filter input', () => {
    renderWithProviders(<SkillsPage />);
    expect(screen.getByPlaceholderText('Filter skills...')).toBeInTheDocument();
  });
});
