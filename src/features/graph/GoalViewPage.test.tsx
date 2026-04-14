import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { GoalViewPage } from '@/features/graph/GoalViewPage';

// Mock cytoscape since jsdom doesn't support canvas
vi.mock('cytoscape', () => {
  const mockCy = {
    on: vi.fn(),
    destroy: vi.fn(),
  };
  const cytoscape = vi.fn(() => mockCy);
  cytoscape.use = vi.fn();
  return { default: cytoscape };
});

vi.mock('cytoscape-dagre', () => ({ default: vi.fn() }));

describe('GoalViewPage', () => {
  it('renders goals heading', () => {
    renderWithProviders(<GoalViewPage />);
    expect(screen.getByText('Goals')).toBeInTheDocument();
  });

  it('renders view switcher', () => {
    renderWithProviders(<GoalViewPage />);
    expect(screen.getByText('Graph')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getByText('Dependencies')).toBeInTheDocument();
  });

  it('renders graph container after loading', async () => {
    renderWithProviders(<GoalViewPage />);
    await waitFor(() => {
      expect(screen.getByTestId('cytoscape-graph')).toBeInTheDocument();
    });
  });
});
