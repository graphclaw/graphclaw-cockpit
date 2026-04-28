/**
 * CanvasEditorPage — Agent Configuration Hub (F3 rewrite).
 *
 * - Loads agents + canvas layout from API on mount
 * - Renders OrchestratorNode + SubAgentNodes from intelligence/agents list
 * - NodePalette with AGENTS + RESOURCES sections
 * - CanvasToolbar with undo/redo/save
 * - AddAgentDialog for creating sub-agents
 * - PropertyInspector with 4 tabs when node is selected (F16-F20)
 * - Layout persisted via PUT /app/v1/canvas/layout (debounced 2s)
 * - Dagre auto-layout (F23)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { NodePalette, type PaletteAgent } from './NodePalette';
import { CanvasToolbar } from './CanvasToolbar';
import { AddAgentDialog } from './AddAgentDialog';
import { PropertyInspector } from './PropertyInspector';
import { OrchestratorNode } from './nodes/OrchestratorNode';
import { SubAgentNode } from './nodes/SubAgentNode';
import { SkillNode } from './nodes/SkillNode';
import { MCPServerNode } from './nodes/MCPServerNode';
import { ToolSetNode } from './nodes/ToolSetNode';
import { DelegationEdge } from './edges/DelegationEdge';
import { WiringEdge } from './edges/WiringEdge';
import { useCanvasStore } from './hooks/useCanvasStore';
import {
  useCanvasLayout,
  useSaveCanvasLayout,
  useAgentConfig,
} from './hooks/useCanvasApi';
import { useIntelligenceAgents } from '@/lib/api-hooks';
import { useAuthStore } from '@/stores/auth';

// ---------------------------------------------------------------------------
// Custom node/edge type maps
// ---------------------------------------------------------------------------

const nodeTypes = {
  orchestrator: OrchestratorNode,
  sub_agent: SubAgentNode,
  skill: SkillNode,
  mcp_server: MCPServerNode,
  tool_set: ToolSetNode,
};

const edgeTypes = {
  delegation: DelegationEdge,
  wiring: WiringEdge,
};

// ---------------------------------------------------------------------------
// Inner component (needs ReactFlowProvider)
// ---------------------------------------------------------------------------

function CanvasEditorInner() {
  const userId = useAuthStore((s) => s.userId) ?? '';
  const { undoStack, redoStack, undo, redo, isDirty, isSaving, markDirty, markSaved, setSaving } =
    useCanvasStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [toolbarMode, setToolbarMode] = useState<'select' | 'pan'>('select');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [addAgentOpen, setAddAgentOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const { data: agentsData } = useIntelligenceAgents();
  const { data: layoutData } = useCanvasLayout();
  const saveLayout = useSaveCanvasLayout();

  // Load orchestrator config for wiring summary
  const { data: orchestratorConfig } = useAgentConfig(userId);

  // ---------------------------------------------------------------------------
  // Build canvas nodes from agents list
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!agentsData || !userId) return;

    const existingPositions: Record<string, { x: number; y: number }> = {};
    if (layoutData?.nodes) {
      for (const n of layoutData.nodes) {
        existingPositions[n.id] = n.position;
      }
    }

    const newNodes: Node[] = [];
    let subAgentY = 300;

    for (const agent of agentsData) {
      const isOrchestrator = agent.agent_id === userId || agent.source === 'system' && agent.agent_id === userId;
      const isSystem = agent.source === 'system' && agent.agent_id !== userId;

      if (isOrchestrator || agent.agent_id === userId) {
        // Orchestrator node
        newNodes.push({
          id: agent.agent_id,
          type: 'orchestrator',
          position: existingPositions[agent.agent_id] ?? { x: 400, y: 80 },
          data: {
            label: agent.name,
            agentId: agent.agent_id,
            llmModel: orchestratorConfig?.llm_model,
            skillsCount: orchestratorConfig?.skills?.length ?? 0,
            mcpCount: orchestratorConfig?.mcp_servers?.length ?? 0,
            toolSetsCount: orchestratorConfig?.tool_sets?.length ?? 0,
            subAgentsCount: orchestratorConfig?.sub_agents?.length ?? 0,
          },
          deletable: false,
        });
      } else if (!isSystem) {
        // Sub-agent node
        newNodes.push({
          id: agent.agent_id,
          type: 'sub_agent',
          position: existingPositions[agent.agent_id] ?? { x: 100 + (subAgentY % 600), y: subAgentY },
          data: {
            label: agent.name,
            agentId: agent.agent_id,
          },
        });
        subAgentY += 180;
      }
    }

    setNodes(newNodes);
  }, [agentsData, layoutData, orchestratorConfig, userId, setNodes]);

  // Build delegation edges from orchestrator sub_agents config
  useEffect(() => {
    if (!orchestratorConfig?.sub_agents || !userId) return;
    const delegationEdges: Edge[] = orchestratorConfig.sub_agents.map((subId) => ({
      id: `delegation-${userId}-${subId}`,
      source: userId,
      target: subId,
      type: 'delegation',
      sourceHandle: 'bottom-delegation',
      targetHandle: 'top-delegation',
      animated: true,
    }));
    setEdges(delegationEdges);
  }, [orchestratorConfig, userId, setEdges]);

  // ---------------------------------------------------------------------------
  // Canvas palette agent list
  // ---------------------------------------------------------------------------

  const paletteAgents = useMemo<PaletteAgent[]>(() => {
    if (!agentsData) return [];
    return agentsData
      .filter((a) => a.source !== 'system')
      .map((a) => ({
        agent_id: a.agent_id,
        name: a.name,
        type: a.agent_id === userId ? ('orchestrator' as const) : ('sub_agent' as const),
      }));
  }, [agentsData, userId]);

  // ---------------------------------------------------------------------------
  // Connection handler
  // ---------------------------------------------------------------------------

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: 'delegation', animated: true }, eds));
      markDirty();
    },
    [setEdges, markDirty],
  );

  // ---------------------------------------------------------------------------
  // Save (debounced 2s on dirty, immediate on explicit call)
  // ---------------------------------------------------------------------------

  const doSave = useCallback(async () => {
    if (isSaving) return;
    setSaving(true);
    try {
      await saveLayout.mutateAsync({
        nodes: nodes.map((n) => ({ id: n.id, position: n.position })),
        viewport: { x: 0, y: 0, zoom: 1 },
      });
      markSaved();
    } catch {
      setSaving(false);
    }
  }, [isSaving, setSaving, saveLayout, nodes, markSaved]);

  // Auto-save debounce
  useEffect(() => {
    if (!isDirty) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [isDirty, doSave]);

  // Keyboard shortcut: Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void doSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doSave]);

  // ---------------------------------------------------------------------------
  // Auto-layout using dagre (F23)
  // ---------------------------------------------------------------------------

  const handleAutoLayout = useCallback(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 120 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((n) => {
      const w = n.type === 'orchestrator' ? 280 : 200;
      const h = 80;
      g.setNode(n.id, { width: w, height: h });
    });
    edges.forEach((e) => g.setEdge(e.source, e.target));

    dagre.layout(g);

    setNodes((nds) =>
      nds.map((n) => {
        const nodeWithPosition = g.node(n.id);
        if (!nodeWithPosition) return n;
        const w = n.type === 'orchestrator' ? 280 : 200;
        const h = 80;
        return {
          ...n,
          position: {
            x: nodeWithPosition.x - w / 2,
            y: nodeWithPosition.y - h / 2,
          },
        };
      }),
    );
    markDirty();
  }, [nodes, edges, setNodes, markDirty]);

  // ---------------------------------------------------------------------------
  // Agent created callback
  // ---------------------------------------------------------------------------

  const handleAgentCreated = useCallback(() => {
    markDirty();
    // Query invalidation handled by useCreateAgentDefinition
  }, [markDirty]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const selectedAgent = agentsData?.find((a) => a.agent_id === selectedAgentId);

  return (
    <div className="flex h-full gap-0" data-testid="canvas-page">
      {/* Node Palette */}
      <NodePalette
        agents={paletteAgents}
        selectedAgentId={selectedAgentId}
        wiredSkills={orchestratorConfig?.skills ?? []}
        wiredMcpServers={orchestratorConfig?.mcp_servers ?? []}
        wiredToolSets={orchestratorConfig?.tool_sets ?? []}
        onAgentClick={setSelectedAgentId}
        onAddAgent={() => setAddAgentOpen(true)}
      />

      {/* Canvas area */}
      <div className="relative flex flex-1 flex-col">
        {/* Floating toolbar */}
        <div className="pointer-events-none absolute top-3 left-0 right-0 z-10 flex justify-center">
          <CanvasToolbar
            mode={toolbarMode}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            isDirty={isDirty}
            isSaving={isSaving}
            onModeChange={setToolbarMode}
            onUndo={undo}
            onRedo={redo}
            onAutoLayout={handleAutoLayout}
            onSave={doSave}
          />
        </div>

        {/* React Flow Canvas */}
        <div
          className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]"
          data-testid="canvas-editor"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              const hasMoveOrAdd = changes.some(
                (c) => c.type === 'position' || c.type === 'add',
              );
              if (hasMoveOrAdd) markDirty();
            }}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_evt, node) => setSelectedAgentId(node.id)}
            onPaneClick={() => setSelectedAgentId(null)}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            panOnDrag={toolbarMode === 'pan'}
            selectionOnDrag={toolbarMode === 'select'}
            fitView
            minZoom={0.3}
            maxZoom={3}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Property Inspector — shown when a node is selected */}
      {selectedAgentId && (
        <PropertyInspector
          agentId={selectedAgentId}
          agentName={selectedAgent?.name ?? selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {/* Add Agent Dialog */}
      <AddAgentDialog
        open={addAgentOpen}
        onOpenChange={setAddAgentOpen}
        onCreated={handleAgentCreated}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export (wrapped in ReactFlowProvider)
// ---------------------------------------------------------------------------

export function CanvasEditorPage() {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner />
    </ReactFlowProvider>
  );
}
