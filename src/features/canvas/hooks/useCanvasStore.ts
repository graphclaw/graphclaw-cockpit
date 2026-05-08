// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
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
  pushSnapshot: (snapshot: CanvasSnapshot) => void;
  undo: (current: CanvasSnapshot) => CanvasSnapshot | null;
  redo: (current: CanvasSnapshot) => CanvasSnapshot | null;
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

  pushSnapshot: (snapshot: CanvasSnapshot) => {
    const { undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-49), snapshot],
      redoStack: [],
    });
  },

  // Returns the snapshot to restore (caller applies it to ReactFlow state)
  undo: (current: CanvasSnapshot) => {
    const { undoStack, redoStack } = get();
    const prev = undoStack[undoStack.length - 1];
    if (!prev) return null;
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [current, ...redoStack.slice(0, 49)],
      isDirty: true,
    });
    return prev;
  },

  redo: (current: CanvasSnapshot) => {
    const { redoStack, undoStack } = get();
    const next = redoStack[0];
    if (!next) return null;
    set({
      redoStack: redoStack.slice(1),
      undoStack: [...undoStack.slice(-49), current],
      isDirty: true,
    });
    return next;
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setViewport: (viewport) => set({ viewport }),

  markDirty: () => set({ isDirty: true }),

  markSaved: () =>
    set({ isDirty: false, lastSaved: new Date().toISOString(), isSaving: false }),

  setSaving: (saving) => set({ isSaving: saving }),
}));
