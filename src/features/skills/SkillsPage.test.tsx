import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { SkillsPage } from '@/features/skills/SkillsPage';

describe('SkillsPage', () => {
  it('renders page header', () => {
    renderWithProviders(<SkillsPage />);
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText(/Install, configure, and manage/)).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    renderWithProviders(<SkillsPage />);
    // KPI cards are in a grid of 4
    expect(screen.getByText('Executions')).toBeInTheDocument();
    expect(screen.getByText('Avg Quality')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    renderWithProviders(<SkillsPage />);
    // Tab bar exists with 4 tabs — use role=button since they are <button>
    const tabs = screen.getAllByRole('button');
    const tabLabels = tabs.map((t) => t.textContent?.trim()).filter(Boolean);
    expect(tabLabels).toContain('Browse Remote');
    expect(tabLabels).toContain('My Skills');
  });

  it('shows installed skills from API after load', async () => {
    renderWithProviders(<SkillsPage />);
    await waitFor(() => {
      expect(screen.getByText('email-triage')).toBeInTheDocument();
      expect(screen.getByText('meeting-summarizer')).toBeInTheDocument();
    });
  });

  it('renders filter input in installed tab', () => {
    renderWithProviders(<SkillsPage />);
    expect(screen.getByPlaceholderText('Filter skills...')).toBeInTheDocument();
  });

  it('filters skills by query', async () => {
    renderWithProviders(<SkillsPage />);
    await waitFor(() => screen.getByText('email-triage'));
    const input = screen.getByPlaceholderText('Filter skills...');
    fireEvent.change(input, { target: { value: 'email' } });
    expect(screen.getByText('email-triage')).toBeInTheDocument();
    expect(screen.queryByText('meeting-summarizer')).not.toBeInTheDocument();
  });

  it('switches to Browse Remote tab', () => {
    renderWithProviders(<SkillsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Browse Remote' }));
    expect(screen.getByPlaceholderText(/Search skills by name/)).toBeInTheDocument();
  });

  it('switches to My Skills tab', () => {
    renderWithProviders(<SkillsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'My Skills' }));
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows authored skills in My Skills tab', async () => {
    renderWithProviders(<SkillsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'My Skills' }));

    await waitFor(() => {
      expect(screen.getByTestId('authored-skills-list')).toBeInTheDocument();
      expect(screen.getByText('my-custom-skill')).toBeInTheDocument();
    });
  });

  it('switches to Sources tab', () => {
    renderWithProviders(<SkillsPage />);
    fireEvent.click(screen.getByRole('button', { name: /^Sources/ }));
    expect(screen.getByRole('button', { name: /Add Source/ })).toBeInTheDocument();
  });

  it('shows Create Skill button linking to authoring page', () => {
    renderWithProviders(<SkillsPage />);
    const link = screen.getByRole('link', { name: /Create Skill/ });
    expect(link).toHaveAttribute('href', '/intelligence/skill-authoring');
  });
});
