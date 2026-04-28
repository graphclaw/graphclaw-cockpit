/**
 * useCanvasStore — Zustand store for Agent Canvas state (F1).
 *
 * Manages:
 * - React Flow nodes/edges derived from loaded agents + their configs
 * - Selected node tracking
 * - Undo/redo snapshot stack (50 levels)
 * - Dirty/saving state for layout persistence
 */
import { create } from 'zustand';
import type { Edge, Node, Viewport } from '@xyflow/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WiringType = 'skill' | 'mcp' | 'tool_set' | 'sub_agent';

export interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
}

export interface AgentConfig {
  llm_model: string;
  heartbeat_interval_seconds: number;
  execution_timeout_seconds: number;
  skills: string[] | null;
  mcp_servers: string[] | null;
  tool_sets: string[] | null;
  sub_agents: string[] | null;
}

export interface AgentDefinition {
  agent_id: string;
  name: string;
  description: string;
  version: string;
  created_at: string;
  updated_at: string;
  config: Record<string, unknown>;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface CanvasState {
  // React Flow state
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  viewport: Viewport;

  // Undo/redo
  undoStack: CanvasSnapshot[];
  redoStack: CanvasSnapshot[];

  // Persistence
  isDirty: boolean;
  lastSaved: string | null;
  isSaving: boolean;

  // Actions — node/edge mutations
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  selectNode: (nodeId: string | null) => void;
  setViewport: (viewport: Viewport) => void;

  // Persistence state
  markDirty: () => void;
  markSaved: () => void;
  setSaving: (saving: boolean) => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useCanvasStore = create<CanvasState>()((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  viewport: { x: 0, y: 0, zoom: 1 },

  undoStack: [],
  redoStack: [],

  isDirty: false,
  lastSaved: null,
  isSaving: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  pushSnapshot: () => {
    const { nodes, edges, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-49), { nodes: [...nodes], edges: [...edges] }],
      redoStack: [],
    });
  },

  undo: () => {
    const { undoStack, nodes, edges, redoStack } = get();
    const prev = undoStack[undoStack.length - 1];
    if (!prev) return;
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      undoStack: undoStack.slice(0, -1),
      redoStack: [{ nodes: [...nodes], edges: [...edges] }, ...redoStack.slice(0, 49)],
      isDirty: true,
    });
  },

  redo: () => {
    const { redoStack, nodes, edges, undoStack } = get();
    const next = redoStack[0];
    if (!next) return;
    set({
      nodes: next.nodes,
      edges: next.edges,
      redoStack: redoStack.slice(1),
      undoStack: [...undoStack.slice(-49), { nodes: [...nodes], edges: [...edges] }],
      isDirty: true,
    });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setViewport: (viewport) => set({ viewport }),

  markDirty: () => set({ isDirty: true }),

  markSaved: () =>
    set({ isDirty: false, lastSaved: new Date().toISOString(), isSaving: false }),

  setSaving: (saving) => set({ isSaving: saving }),
}));
