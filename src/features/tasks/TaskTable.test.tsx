import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { TaskTable } from '@/features/tasks/components/TaskTable';

describe('TaskTable', () => {
  it('renders table headers', async () => {
    renderWithProviders(<TaskTable />);

    await waitFor(() => {
      expect(screen.getByText('Task')).toBeInTheDocument();
      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('ID')).toBeInTheDocument();
    });
  });

  it('shows task count in footer after loading', async () => {
    renderWithProviders(<TaskTable />);

    await waitFor(() => {
      expect(screen.getByText(/2 tasks/)).toBeInTheDocument();
    });
  });

  it('renders the virtual scroll container', async () => {
    renderWithProviders(<TaskTable />);

    await waitFor(() => {
      expect(screen.getByTestId('task-table')).toBeInTheDocument();
    });
  });
});
