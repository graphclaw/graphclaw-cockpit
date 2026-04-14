import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { AgentMonitorPage } from '@/features/agent/AgentMonitorPage';

describe('AgentMonitorPage', () => {
  it('renders page heading', async () => {
    renderWithProviders(<AgentMonitorPage />);
    await waitFor(() => {
      expect(screen.getByText('Agent Monitor')).toBeInTheDocument();
    });
  });

  it('renders KPI strip after loading', async () => {
    renderWithProviders(<AgentMonitorPage />);
    await waitFor(() => {
      expect(screen.getByTestId('kpi-strip')).toBeInTheDocument();
      expect(screen.getByText('Tasks Completed')).toBeInTheDocument();
      expect(screen.getByText('Tasks Pending')).toBeInTheDocument();
    });
  });

  it('renders agent card with data', async () => {
    renderWithProviders(<AgentMonitorPage />);
    await waitFor(() => {
      expect(screen.getByText('agent-main')).toBeInTheDocument();
      expect(screen.getAllByText('IDLE').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders event log', async () => {
    renderWithProviders(<AgentMonitorPage />);
    await waitFor(() => {
      expect(screen.getByText('Event Log')).toBeInTheDocument();
      expect(screen.getByText('Agent heartbeat received')).toBeInTheDocument();
    });
  });
});
