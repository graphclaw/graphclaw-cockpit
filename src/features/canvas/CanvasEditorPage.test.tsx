// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { CanvasEditorPage } from '@/features/canvas/CanvasEditorPage';

// Mock @xyflow/react including ReactFlowProvider
vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  const ReactFlow = ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="react-flow" data-nodes={JSON.stringify(props.nodes)}>
      {children as React.ReactNode}
    </div>
  );
  const Background = () => <div data-testid="rf-background" />;
  const Controls = () => <div data-testid="rf-controls" />;
  const MiniMap = () => <div data-testid="rf-minimap" />;
  const ReactFlowProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  function useNodesState(initial: unknown[]) {
    const [nodes, setNodes] = useState(initial);
    return [nodes, setNodes, vi.fn()];
  }

  function useEdgesState(initial: unknown[]) {
    const [edges, setEdges] = useState(initial);
    return [edges, setEdges, vi.fn()];
  }

  return {
    ...actual,
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    addEdge: vi.fn((conn: unknown, edges: unknown[]) => [...edges, conn]),
    useNodesState,
    useEdgesState,
    BackgroundVariant: { Dots: 'dots' },
  };
});

// Mock canvas API hooks
vi.mock('@/features/canvas/hooks/useCanvasApi', () => ({
  useCanvasLayout: () => ({ data: null, isLoading: false }),
  useSaveCanvasLayout: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAgentConfig: () => ({ data: null, isLoading: false }),
  useSaveAgentConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useInstalledSkills: () => ({ data: [], isLoading: false }),
  useMCPServers: () => ({ data: [], isLoading: false }),
  useA2AAgents: () => ({ data: [], isLoading: false }),
  useCreateAgentDefinition: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false }),
  useDeleteAgentDefinition: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// Mock intelligence agents hook
vi.mock('@/lib/api-hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-hooks')>();
  return {
    ...actual,
    useIntelligenceAgents: () => ({ data: [], isLoading: false }),
  };
});

describe('CanvasEditorPage', () => {
  it('renders the canvas page container', () => {
    renderWithProviders(<CanvasEditorPage />);
    expect(screen.getByTestId('canvas-page')).toBeInTheDocument();
  });

  it('renders the React Flow canvas editor', () => {
    renderWithProviders(<CanvasEditorPage />);
    expect(screen.getByTestId('canvas-editor')).toBeInTheDocument();
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders background, controls, and minimap', () => {
    renderWithProviders(<CanvasEditorPage />);
    expect(screen.getByTestId('rf-background')).toBeInTheDocument();
    expect(screen.getByTestId('rf-controls')).toBeInTheDocument();
    expect(screen.getByTestId('rf-minimap')).toBeInTheDocument();
  });
});
