import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { AgentProfilePage } from '@/features/intelligence/AgentProfilePage';
import { AgentIdContext } from '@/features/intelligence/IntelligenceLayout';

function renderPage() {
  return renderWithProviders(
    <AgentIdContext.Provider value="test-agent-001">
      <AgentProfilePage />
    </AgentIdContext.Provider>,
  );
}

describe('AgentProfilePage', () => {
  it('renders the profile editor', async () => {
    renderPage();
    expect(await screen.findByText('Agent Profile')).toBeInTheDocument();
    expect(await screen.findByTestId('profile-editor')).toBeInTheDocument();
  });

  it('shows unsaved changes indicator when edited', async () => {
    const user = userEvent.setup();
    renderPage();

    const editor = await screen.findByTestId('profile-editor');
    await user.type(editor, 'new content');

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('clears dirty state on save', async () => {
    const user = userEvent.setup();
    renderPage();

    const editor = await screen.findByTestId('profile-editor');
    await user.type(editor, ' extra');

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
