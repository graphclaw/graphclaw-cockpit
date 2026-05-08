// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
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
import { SystemAgentNode } from './nodes/SystemAgentNode';
import { ExternalAgentNode } from './nodes/ExternalAgentNode';
import { DelegationEdge } from './edges/DelegationEdge';
import { WiringEdge } from './edges/WiringEdge';
import { A2ALinkEdge } from './edges/A2ALinkEdge';
import { useCanvasStore } from './hooks/useCanvasStore';
import {
  useCanvasLayout,
  useSaveCanvasLayout,
  useAgentConfig,
  useSaveAgentConfig,
  useA2AAgents,
  type AgentConfig,
} from './hooks/useCanvasApi';
import { useIntelligenceAgents, useAgents } from '@/lib/api-hooks';
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
  system_agent: SystemAgentNode,
  external_agent: ExternalAgentNode,
};

const edgeTypes = {
  delegation: DelegationEdge,
  wiring: WiringEdge,
  a2a_link: A2ALinkEdge,
};

// ---------------------------------------------------------------------------
// Inner component (needs ReactFlowProvider)
// ---------------------------------------------------------------------------

function CanvasEditorInner() {
  const userId = useAuthStore((s) => s.userId) ?? '';
  const { undoStack, redoStack, undo, redo, isDirty, isSaving, markDirty, markSaved, setSaving, pushSnapshot } =
    useCanvasStore();

  // Refs for current ReactFlow state (used in undo/redo to avoid stale closures)
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Keep refs in sync with ReactFlow state for stable undo/redo
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  const [toolbarMode, setToolbarMode] = useState<'select' | 'pan'>('select');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [addAgentOpen, setAddAgentOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const importInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const { data: agentsData } = useIntelligenceAgents();
  const { data: subAgentsData } = useAgents();
  const { data: layoutData } = useCanvasLayout();
  const { data: a2aAgents } = useA2AAgents();
  const saveLayout = useSaveCanvasLayout();

  // Load orchestrator config for wiring summary
  const { data: orchestratorConfig } = useAgentConfig(userId);
  // Load selected agent config for palette checkmarks (F22)
  const { data: selectedAgentConfig } = useAgentConfig(selectedAgentId ?? '');
  const saveAgentConfig = useSaveAgentConfig();

  // Effective wiring shown in palette: selected agent if one is chosen, else orchestrator
  // (only when selected node is an agent type, not a resource node)
  const isAgentNode = selectedNodeType === 'orchestrator' || selectedNodeType === 'sub_agent';
  const paletteConfig = (selectedAgentId && isAgentNode) ? selectedAgentConfig : orchestratorConfig;

  // ---------------------------------------------------------------------------
  // Build canvas nodes from agents list
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const existingPositions: Record<string, { x: number; y: number }> = {};
    if (layoutData?.nodes) {
      for (const n of layoutData.nodes) {
        existingPositions[n.id] = n.position;
      }
    }

    const newNodes: Node[] = [];
    let subAgentY = 300;

    if (userId) {
      const orchestratorName =
        agentsData?.find((a) => a.agent_id === userId)?.name ??
        'Orchestrator';

      // Orchestrator node is present when the authenticated user id is known.
      newNodes.push({
        id: userId,
        type: 'orchestrator',
        position: existingPositions[userId] ?? { x: 400, y: 80 },
        data: {
          label: orchestratorName,
          agentId: userId,
          llmModel: orchestratorConfig?.llm_model,
          skillsCount: orchestratorConfig?.skills?.length ?? 0,
          mcpCount: orchestratorConfig?.mcp_servers?.length ?? 0,
          toolSetsCount: orchestratorConfig?.tool_sets?.length ?? 0,
          subAgentsCount: orchestratorConfig?.sub_agents?.length ?? 0,
        },
        deletable: false,
      });
    }

    // System agent nodes (read-only)
    for (const agent of agentsData ?? []) {
      if (agent.source !== 'system') continue;
      newNodes.push({
        id: agent.agent_id,
        type: 'system_agent',
        position: existingPositions[agent.agent_id] ?? { x: 700, y: 80 },
        data: { label: agent.name, agentId: agent.agent_id },
        deletable: false,
      });
    }

    // User sub-agent nodes from /app/v1/agents
    for (const agent of subAgentsData ?? []) {
      if (userId && agent.agent_id === userId) continue;
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

    // A2A external agents
    let a2aX = 800;
    for (const a2a of a2aAgents ?? []) {
      const nodeId = `a2a-${a2a.agent_id}`;
      newNodes.push({
        id: nodeId,
        type: 'external_agent',
        position: existingPositions[nodeId] ?? { x: a2aX, y: 80 },
        data: {
          label: a2a.name,
          agentId: a2a.agent_id,
          endpoint: a2a.endpoint,
          capabilities: a2a.capabilities,
          trustStatus: a2a.trust_status ?? 'ACTIVE',
        },
        deletable: true,
      });
      a2aX += 260;
    }

    setNodes(newNodes);
  }, [agentsData, subAgentsData, a2aAgents, layoutData, orchestratorConfig, userId, setNodes]);

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
    const internal: PaletteAgent[] = [];

    if (userId) {
      internal.push({
        agent_id: userId,
        name: agentsData?.find((a) => a.agent_id === userId)?.name ?? 'Orchestrator',
        type: 'orchestrator',
      });
    }

    for (const agent of subAgentsData ?? []) {
      if (agent.agent_id === userId) continue;
      internal.push({
        agent_id: agent.agent_id,
        name: agent.name,
        type: 'sub_agent',
      });
    }

    const system: PaletteAgent[] = (agentsData ?? [])
      .filter((a) => a.source === 'system')
      .map((a) => ({
        agent_id: a.agent_id,
        name: a.name,
        type: 'system' as const,
      }));

    const external: PaletteAgent[] = (a2aAgents ?? []).map((a) => ({
      agent_id: a.agent_id,
      name: a.name,
      type: 'a2a' as const,
    }));
    return [...internal, ...external, ...system];
  }, [agentsData, subAgentsData, a2aAgents, userId]);

  // Build A2A link edges from orchestrator to external agents
  useEffect(() => {
    if (!a2aAgents || a2aAgents.length === 0) return;
    setEdges((prev) => {
      const nonA2A = prev.filter((e) => e.type !== 'a2a_link');
      const a2aEdges = a2aAgents.map((a2a) => ({
        id: `a2a-link-${userId}-${a2a.agent_id}`,
        source: userId,
        target: `a2a-${a2a.agent_id}`,
        type: 'a2a_link' as const,
        animated: true,
      }));
      return [...nonA2A, ...a2aEdges];
    });
  }, [a2aAgents, userId, setEdges]);

  // ---------------------------------------------------------------------------
  // Undo / Redo handlers (F30)
  // ---------------------------------------------------------------------------

  const handleUndo = useCallback(() => {
    const prev = undo({ nodes: [...nodesRef.current], edges: [...edgesRef.current] });
    if (!prev) return;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    markDirty();
  }, [undo, setNodes, setEdges, markDirty]);

  const handleRedo = useCallback(() => {
    const next = redo({ nodes: [...nodesRef.current], edges: [...edgesRef.current] });
    if (!next) return;
    setNodes(next.nodes);
    setEdges(next.edges);
    markDirty();
  }, [redo, setNodes, setEdges, markDirty]);

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  // ---------------------------------------------------------------------------
  // Connection handler (F21: detect wiring edges, sync config)
  // ---------------------------------------------------------------------------

  const onConnect = useCallback(
    (connection: Connection) => {
      // Push snapshot before adding edge (F30 undo/redo)
      pushSnapshot({ nodes: [...nodesRef.current], edges: [...edgesRef.current] });

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      // Detect wiring: resource node → agent node
      const resourceTypes = ['skill', 'mcp_server', 'tool_set'] as const;
      type ResourceType = typeof resourceTypes[number];
      const isWiring =
        sourceNode &&
        targetNode &&
        resourceTypes.includes(sourceNode.type as ResourceType) &&
        (targetNode.type === 'orchestrator' || targetNode.type === 'sub_agent');

      if (isWiring && sourceNode && targetNode) {
        const agentId = targetNode.id;
        const fieldMap: Record<string, keyof AgentConfig> = {
          skill: 'skills',
          mcp_server: 'mcp_servers',
          tool_set: 'tool_sets',
        };
        const field = fieldMap[sourceNode.type!];
        const resourceId = (sourceNode.data as Record<string, unknown>)[
          sourceNode.type === 'skill' ? 'skillId' :
          sourceNode.type === 'mcp_server' ? 'serverId' : 'toolSetId'
        ] as string;

        if (field && resourceId) {
          const existingConfig =
            agentId === userId ? orchestratorConfig : selectedAgentConfig;
          if (existingConfig) {
            const currentArr = (existingConfig[field] as string[] | null) ?? [];
            if (!currentArr.includes(resourceId)) {
              saveAgentConfig.mutate({
                agentId,
                config: { ...existingConfig, [field]: [...currentArr, resourceId] },
              });
            }
          }
          // Add as wiring edge
          setEdges((eds) =>
            addEdge(
              {
                ...connection,
                type: 'wiring',
                data: { wiringType: sourceNode.type },
                animated: false,
              },
              eds,
            ),
          );
          markDirty();
          return;
        }
      }

      // Default: delegation edge
      setEdges((eds) => addEdge({ ...connection, type: 'delegation', animated: true }, eds));
      markDirty();
    },
    [nodes, setEdges, markDirty, pushSnapshot, orchestratorConfig, selectedAgentConfig, saveAgentConfig, userId],
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
    // Push snapshot before auto-layout (F30 undo)
    pushSnapshot({ nodes: [...nodesRef.current], edges: [...edgesRef.current] });
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
  }, [nodes, edges, setNodes, markDirty, pushSnapshot]);

  // ---------------------------------------------------------------------------
  // Export / Import JSON (F32)
  // ---------------------------------------------------------------------------

  const handleExport = useCallback(() => {
    const payload = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImport = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as {
            nodes?: Node[];
            edges?: Edge[];
          };
          // Push snapshot before importing (F30)
          pushSnapshot({ nodes: [...nodesRef.current], edges: [...edgesRef.current] });
          if (Array.isArray(data.nodes)) setNodes(data.nodes);
          if (Array.isArray(data.edges)) setEdges(data.edges);
          markDirty();
        } catch {
          // ignore invalid JSON
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [setNodes, setEdges, markDirty, pushSnapshot],
  );

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

  const selectedAgent =
    (subAgentsData ?? []).find((a) => a.agent_id === selectedAgentId) ??
    agentsData?.find((a) => a.agent_id === selectedAgentId);

  return (
    <div className="flex h-full gap-0" data-testid="canvas-page">
      {/* Node Palette */}
      <NodePalette
        agents={paletteAgents}
        selectedAgentId={selectedAgentId}
        wiredSkills={paletteConfig?.skills ?? []}
        wiredMcpServers={paletteConfig?.mcp_servers ?? []}
        wiredToolSets={paletteConfig?.tool_sets ?? []}
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
            onUndo={handleUndo}
            onRedo={handleRedo}
            onAutoLayout={handleAutoLayout}
            onSave={doSave}
            onExport={handleExport}
            onImport={handleImport}
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
            onEdgesChange={(changes) => {
              // Push snapshot before edge deletion (F30 undo/redo)
              const hasRemove = changes.some((c) => c.type === 'remove');
              if (hasRemove) {
                pushSnapshot({ nodes: [...nodesRef.current], edges: [...edgesRef.current] });
              }
              onEdgesChange(changes);
            }}
            onConnect={onConnect}
            onNodeDragStart={() => {
              // Push snapshot at drag start so drag can be undone (F30)
              pushSnapshot({ nodes: [...nodesRef.current], edges: [...edgesRef.current] });
            }}
            onNodeClick={(_evt, node) => {
              setSelectedAgentId(node.id);
              setSelectedNodeType(node.type ?? null);
            }}
            onPaneClick={() => {
              setSelectedAgentId(null);
              setSelectedNodeType(null);
            }}
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
          agentId={
            selectedNodeType === 'external_agent'
              ? selectedAgentId.replace(/^a2a-/, '')
              : selectedAgentId
          }
          agentName={
            selectedNodeType === 'skill' || selectedNodeType === 'mcp_server' || selectedNodeType === 'tool_set' || selectedNodeType === 'external_agent'
              ? ((nodes.find((n) => n.id === selectedAgentId)?.data as Record<string, unknown>)?.label as string) ?? selectedAgentId
              : selectedAgent?.name ?? selectedAgentId
          }
          nodeType={selectedNodeType ?? undefined}
          onClose={() => { setSelectedAgentId(null); setSelectedNodeType(null); }}
        />
      )}

      {/* Add Agent Dialog */}
      <AddAgentDialog
        open={addAgentOpen}
        onOpenChange={setAddAgentOpen}
        onCreated={handleAgentCreated}
      />

      {/* Hidden file input for canvas import (F32) */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
        data-testid="canvas-import-input"
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
