import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { AgentProfilePage } from '@/features/intelligence/AgentProfilePage';

describe('AgentProfilePage', () => {
  it('renders the profile editor', () => {
    renderWithProviders(<AgentProfilePage />);
    expect(screen.getByText('Agent Profile')).toBeInTheDocument();
    expect(screen.getByTestId('profile-editor')).toBeInTheDocument();
  });

  it('shows unsaved changes indicator when edited', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgentProfilePage />);

    const editor = screen.getByTestId('profile-editor');
    await user.type(editor, 'new content');

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('clears dirty state on save', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgentProfilePage />);

    const editor = screen.getByTestId('profile-editor');
    await user.type(editor, ' extra');

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    await user.click(screen.getByText('Save'));

    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });
});
