import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { McpRegistryPage } from '@/features/mcp/McpRegistryPage';

describe('McpRegistryPage', () => {
  it('renders server list', async () => {
    renderWithProviders(<McpRegistryPage />);
    expect(await screen.findByText('GitHub Actions')).toBeInTheDocument();
    expect(await screen.findByText('Jira Cloud')).toBeInTheDocument();
  });

  it('shows trust tier badges', async () => {
    renderWithProviders(<McpRegistryPage />);
    expect((await screen.findAllByText('AUTO')).length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('GATED')).toBeInTheDocument();
    expect(await screen.findByText('BLOCKED')).toBeInTheDocument();
  });

  it('renders pre-built adapters', async () => {
    renderWithProviders(<McpRegistryPage />);
    expect(await screen.findByText('GitHub')).toBeInTheDocument();
    expect(await screen.findByText('Slack')).toBeInTheDocument();
  });

  it('opens register form from Register Server button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<McpRegistryPage />);

    const toggleBtn = await screen.findByTestId('register-server-btn');
    await user.click(toggleBtn);

    expect(screen.getByTestId('register-server-form')).toBeInTheDocument();
    expect(screen.getByTestId('mcp-register-name')).toBeInTheDocument();
    expect(screen.getByTestId('mcp-register-endpoint')).toBeInTheDocument();
  });

  it('prefills gdrive settings from Google Drive adapter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<McpRegistryPage />);

    const gdriveBtn = await screen.findByRole('button', { name: 'Google Drive' });
    await user.click(gdriveBtn);

    const transport = screen.getByTestId('mcp-register-transport') as HTMLSelectElement;
    const command = screen.getByTestId('mcp-register-command') as HTMLInputElement;
    expect(transport.value).toBe('stdio');
    expect(command.value).toContain('mcp/gdrive');
  });
});
