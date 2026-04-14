import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { CanvasEditorPage } from '@/features/canvas/CanvasEditorPage';

vi.mock('@xyflow/react', () => {
  const ReactFlow = ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="react-flow" data-nodes={JSON.stringify(props.nodes)}>
      {children as React.ReactNode}
    </div>
  );
  const Background = () => <div data-testid="rf-background" />;
  const Controls = () => <div data-testid="rf-controls" />;
  const MiniMap = () => <div data-testid="rf-minimap" />;

  function useNodesState(initial: unknown[]) {
    const [nodes, setNodes] = useState(initial);
    return [nodes, setNodes, vi.fn()];
  }

  function useEdgesState(initial: unknown[]) {
    const [edges, setEdges] = useState(initial);
    return [edges, setEdges, vi.fn()];
  }

  return {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge: vi.fn((conn: unknown, edges: unknown[]) => [...edges, conn]),
    useNodesState,
    useEdgesState,
    BackgroundVariant: { Dots: 'dots' },
  };
});

describe('CanvasEditorPage', () => {
  it('renders the React Flow canvas', () => {
    renderWithProviders(<CanvasEditorPage />);
    expect(screen.getByTestId('canvas-editor')).toBeInTheDocument();
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders toolbar buttons', () => {
    renderWithProviders(<CanvasEditorPage />);
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('renders node palette with all node types', () => {
    renderWithProviders(<CanvasEditorPage />);
    expect(screen.getByText('Node Palette')).toBeInTheDocument();
    expect(screen.getByText('LLM Call')).toBeInTheDocument();
    expect(screen.getByText('Tool Call')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('Loop')).toBeInTheDocument();
    expect(screen.getByText('Human Gate')).toBeInTheDocument();
    expect(screen.getByText('Sub-Agent')).toBeInTheDocument();
  });

  it('renders background, controls, and minimap', () => {
    renderWithProviders(<CanvasEditorPage />);
    expect(screen.getByTestId('rf-background')).toBeInTheDocument();
    expect(screen.getByTestId('rf-controls')).toBeInTheDocument();
    expect(screen.getByTestId('rf-minimap')).toBeInTheDocument();
  });

  it('adds a node when palette button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CanvasEditorPage />);

    const rfEl = screen.getByTestId('react-flow');
    const initialNodes = JSON.parse(rfEl.getAttribute('data-nodes') || '[]');
    expect(initialNodes).toHaveLength(3);

    await user.click(screen.getByText('Tool Call'));

    const updatedNodes = JSON.parse(
      screen.getByTestId('react-flow').getAttribute('data-nodes') || '[]',
    );
    expect(updatedNodes).toHaveLength(4);
  });
});
