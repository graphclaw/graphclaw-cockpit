import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { McpRegistryPage } from '@/features/mcp/McpRegistryPage';

describe('McpRegistryPage', () => {
  it('renders server list', () => {
    renderWithProviders(<McpRegistryPage />);
    expect(screen.getByText('GitHub Actions')).toBeInTheDocument();
    expect(screen.getByText('Jira Cloud')).toBeInTheDocument();
  });

  it('shows trust tier badges', () => {
    renderWithProviders(<McpRegistryPage />);
    expect(screen.getAllByText('AUTO').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('GATED')).toBeInTheDocument();
    expect(screen.getByText('BLOCKED')).toBeInTheDocument();
  });

  it('renders pre-built adapters', () => {
    renderWithProviders(<McpRegistryPage />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Slack')).toBeInTheDocument();
  });
});
