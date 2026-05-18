// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { CanvasEditorPage, restoreNode } from '@/features/canvas/CanvasEditorPage';

const mockUseCanvasLayout = vi.fn(() => ({ data: null, isLoading: false }));
const mockUseAgentConfig = vi.fn(() => ({ data: null, isLoading: false }));
const mockUseInstalledSkills = vi.fn(() => ({ data: [], isLoading: false }));
const mockUseMCPServers = vi.fn(() => ({ data: [], isLoading: false }));
const mockUseA2AAgents = vi.fn(() => ({ data: [], isLoading: false }));
const mockUseIntelligenceAgents = vi.fn(() => ({ data: [], isLoading: false }));
const mockUseAgents = vi.fn(() => ({ data: [], isLoading: false }));

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
    useReactFlow: () => ({
      screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x, y }),
    }),
    BackgroundVariant: { Dots: 'dots' },
  };
});

vi.mock('@/features/canvas/hooks/useCanvasApi', () => ({
  useCanvasLayout: () => mockUseCanvasLayout(),
  useSaveCanvasLayout: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAgentConfig: (agentId: string) => mockUseAgentConfig(agentId),
  useSaveAgentConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useInstalledSkills: () => mockUseInstalledSkills(),
  useMCPServers: () => mockUseMCPServers(),
  useA2AAgents: () => mockUseA2AAgents(),
  useCreateAgentDefinition: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false }),
  useDeleteAgentDefinition: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/lib/api-hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-hooks')>();
  return {
    ...actual,
    useIntelligenceAgents: () => mockUseIntelligenceAgents(),
    useAgents: () => mockUseAgents(),
  };
});

vi.mock('@/stores/auth', () => ({
  useAuthStore: (selector: (s: { userId: string }) => unknown) => selector({ userId: 'USER-dev-001' }),
}));

describe('CanvasEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCanvasLayout.mockReturnValue({ data: null, isLoading: false });
    mockUseAgentConfig.mockReturnValue({ data: null, isLoading: false });
    mockUseInstalledSkills.mockReturnValue({ data: [], isLoading: false });
    mockUseMCPServers.mockReturnValue({ data: [], isLoading: false });
    mockUseA2AAgents.mockReturnValue({ data: [], isLoading: false });
    mockUseIntelligenceAgents.mockReturnValue({
      data: [
        { agent_id: 'USER-dev-001', name: 'Orchestrator', source: 'user' },
        { agent_id: 'sys-agent', name: 'System Agent', source: 'system' },
      ],
      isLoading: false,
    });
    mockUseAgents.mockReturnValue({
      data: [{ agent_id: 'sub-1', name: 'Sub Agent' }],
      isLoading: false,
    });
  });

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

  it('shows only orchestrator when layout is empty', () => {
    renderWithProviders(<CanvasEditorPage />);

    const raw = screen.getByTestId('react-flow').getAttribute('data-nodes') ?? '[]';
    const nodes = JSON.parse(raw) as Array<{ id: string; type: string }>;

    expect(nodes.some((n) => n.id === 'USER-dev-001' && n.type === 'orchestrator')).toBe(true);
    expect(nodes.some((n) => n.type === 'system_agent')).toBe(false);
    expect(nodes.some((n) => n.type === 'sub_agent')).toBe(false);
  });
});

describe('restoreNode', () => {
  it('restores a skill node from prefix id', () => {
    const node = restoreNode('skill-abc', { x: 1, y: 2 }, {
      skills: [{ skill_id: 'abc', name: 'Skill ABC', description: 'desc' }],
    });
    expect(node?.type).toBe('skill');
    expect((node?.data as { skillId: string }).skillId).toBe('abc');
  });

  it('restores an mcp node from prefix id', () => {
    const node = restoreNode('mcp-srv1', { x: 1, y: 2 }, {
      mcpServers: [{ server_id: 'srv1', name: 'Server 1' }],
    });
    expect(node?.type).toBe('mcp_server');
    expect((node?.data as { serverId: string }).serverId).toBe('srv1');
  });

  it('restores a toolset node from prefix id', () => {
    const node = restoreNode('toolset-planning', { x: 1, y: 2 }, {});
    expect(node?.type).toBe('tool_set');
    expect((node?.data as { toolSetId: string }).toolSetId).toBe('planning');
  });

  it('restores an external a2a node from prefix id', () => {
    const node = restoreNode('a2a-ext1', { x: 1, y: 2 }, {
      a2aAgents: [{ agent_id: 'ext1', name: 'Ext Agent', trust_status: 'ACTIVE' }],
    });
    expect(node?.type).toBe('external_agent');
    expect((node?.data as { agentId: string }).agentId).toBe('ext1');
  });

  it('restores a system agent by id', () => {
    const node = restoreNode('sys-1', { x: 1, y: 2 }, {
      agentsData: [{ agent_id: 'sys-1', name: 'System 1', source: 'system' }],
    });
    expect(node?.type).toBe('system_agent');
  });

  it('restores a sub agent by id', () => {
    const node = restoreNode('sub-1', { x: 1, y: 2 }, {
      subAgentsData: [{ agent_id: 'sub-1', name: 'Sub 1' }],
    });
    expect(node?.type).toBe('sub_agent');
  });

  it('returns null for unknown id', () => {
    const node = restoreNode('unknown-id', { x: 1, y: 2 }, {});
    expect(node).toBeNull();
  });
});
