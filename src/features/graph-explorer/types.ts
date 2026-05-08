// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * Graph Explorer — shared TypeScript types.
 *
 * Discriminated unions for ExplorerNode (Task | Goal | Resource | Constraint),
 * ExplorerEdge, and all filter / config types consumed by components and hooks.
 */

// ── Node types ───────────────────────────────────────────────────────────────

export type NodeKind = 'task' | 'goal' | 'resource' | 'constraint';

export interface TaskNode {
  kind: 'task';
  id: string;
  title: string;
  state: string;
  priority: string;
  task_type: string;
  deadline?: string | null;
  description?: string | null;
  assignee?: string | null;
  goal_id?: string | null;
  score?: number | null;
  on_critical_path?: boolean;
  scoring?: TaskScoring | null;
  tags?: string[];
}

export interface TaskScoring {
  timeline_urgency: number;
  dependency_weight: number;
  critical_path: number;
  blocker: number;
  human_override: number;
  resource_risk: number;
  constraint_pressure: number;
  computed_priority: number;
}

export interface GoalNode {
  kind: 'goal';
  id: string;
  title: string;
  state: string;
  priority: string;
  description?: string | null;
}

export interface ResourceNode {
  kind: 'resource';
  id: string;
  name: string;
  resource_type: string;
  reliability?: number | null;
}

export interface ConstraintNode {
  kind: 'constraint';
  id: string;
  title: string;
  constraint_type?: string;
  description?: string | null;
}

export type ExplorerNode = TaskNode | GoalNode | ResourceNode | ConstraintNode;

// ── Edge types ───────────────────────────────────────────────────────────────

export type EdgeType =
  | 'DEPENDS_ON'
  | 'BLOCKS'
  | 'PART_OF'
  | 'FOLLOW_UP_FOR'
  | 'SPAWNED_FROM'
  | 'ASSIGNED_TO'
  | 'OWNED_BY'
  | 'APPLIES_TO'
  | 'INFORMS'
  | 'BRANCHED_FROM'
  | 'BATCHED_IN'
  | 'REFERRED_BY';

export const ALL_EDGE_TYPES: EdgeType[] = [
  'DEPENDS_ON',
  'BLOCKS',
  'PART_OF',
  'FOLLOW_UP_FOR',
  'SPAWNED_FROM',
  'ASSIGNED_TO',
  'OWNED_BY',
  'APPLIES_TO',
  'INFORMS',
  'BRANCHED_FROM',
  'BATCHED_IN',
  'REFERRED_BY',
];

export interface ExplorerEdge {
  id: string;
  source: string;
  target: string;
  edge_type: EdgeType | string;
  gate_type?: string | null;
  strength?: string | null;
  sequence_order?: number | null;
  note?: string | null;
  created_by?: string | null;
}

// ── Filter types ─────────────────────────────────────────────────────────────

export type FilterPreset =
  | 'all'
  | 'active_work'
  | 'blocked'
  | 'critical_path'
  | 'my_tasks'
  | 'overdue';

export const TASK_STATES = [
  'ACTIVE',
  'IN_PROGRESS',
  'BLOCKED',
  'DELAYED',
  'PENDING',
  'COMPLETE',
  'CANCELLED',
  'SNOOZED',
  'NEEDS_REVIEW',
  'INACTIVE_PENDING',
] as const;

export type TaskState = (typeof TASK_STATES)[number];

export const GOAL_STATES = ['ACTIVE', 'IN_PROGRESS', 'COMPLETE', 'ARCHIVED'] as const;
export type GoalState = (typeof GOAL_STATES)[number];

export const TASK_TYPES = [
  'ATOMIC',
  'COMPOSITE',
  'DELEGATED',
  'FOLLOWUP',
  'APPROVAL',
  'MILESTONE',
  'REVIEW',
  'RECURRING',
  'DECISION',
  'CHECKIN',
  'RESEARCH',
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface GraphExplorerFilters {
  preset: FilterPreset;
  // Node type visibility
  showTasks: boolean;
  showGoals: boolean;
  showResources: boolean;
  showConstraints: boolean;
  // Task state chips
  taskStates: Set<TaskState>;
  // Goal state chips
  goalStates: Set<GoalState>;
  // Task type chips
  taskTypes: Set<TaskType>;
  // Priority chips
  priorities: Set<Priority>;
  // Timeline
  dueThisWeek: boolean;
  dueThisMonth: boolean;
  overdueOnly: boolean;
  noDeadline: boolean;
  // Edge types
  edgeTypes: Set<EdgeType | string>;
  // Risk & Health
  onCriticalPath: boolean;
  hasBlockingDep: boolean;
  scoreAbove: boolean;
  scoreBelow: boolean;
}

// ── Layout ───────────────────────────────────────────────────────────────────

export type LayoutName = 'dagre' | 'cose' | 'breadthfirst' | 'concentric' | 'circle' | 'grid';

export const LAYOUT_OPTIONS: { value: LayoutName; label: string }[] = [
  { value: 'dagre', label: 'Hierarchical (Dagre)' },
  { value: 'cose', label: 'Force-Directed (CoSE)' },
  { value: 'breadthfirst', label: 'Breadth-First' },
  { value: 'concentric', label: 'Concentric' },
  { value: 'circle', label: 'Circle' },
  { value: 'grid', label: 'Grid' },
];

// ── Canvas interaction mode ───────────────────────────────────────────────────

export type InteractionMode = 'select' | 'pan';

// ── Selection ────────────────────────────────────────────────────────────────

export type SelectionKind = 'node' | 'edge' | null;

export interface NodeSelection {
  kind: 'node';
  id: string;
}

export interface EdgeSelection {
  kind: 'edge';
  id: string;
}

export type ExplorerSelection = NodeSelection | EdgeSelection | null;

// ── API response shapes ───────────────────────────────────────────────────────

export interface NodeListResponse<T> {
  items: T[];
  next_cursor: string | null;
  total: number;
}

export interface EdgeListResponse {
  items: ApiEdge[];
  next_cursor: string | null;
}

export interface ApiEdge {
  edge_id: string;
  source_id: string;
  target_id: string;
  edge_type: string;
  gate_type?: string | null;
  strength?: string | null;
  sequence_order?: number | null;
  note?: string | null;
  created_by?: string | null;
}

export interface ApiTaskItem {
  id: string;
  title: string;
  state: string;
  priority: string;
  task_type: string;
  deadline?: string | null;
  description?: string | null;
  assigned_to?: string | null;
  goal_id?: string | null;
  score?: number | null;
  on_critical_path?: boolean;
  scoring?: TaskScoring | null;
  tags?: string[];
}

export interface ApiGoalItem {
  id: string;
  title: string;
  state: string;
  priority: string;
  description?: string | null;
}

export interface ApiResourceItem {
  id: string;
  name: string;
  resource_type?: string;
  reliability?: number | null;
}

// ── Node type config (for shape / color lookup) ───────────────────────────────

export interface NodeTypeConfig {
  shape: string;
  color: string;
  borderColor: string;
  defaultSize: number;
}

export const NODE_TYPE_CONFIG: Record<NodeKind, NodeTypeConfig> = {
  task: {
    shape: 'round-rectangle',
    color: 'var(--state-active)',
    borderColor: 'var(--state-active)',
    defaultSize: 40,
  },
  goal: {
    shape: 'diamond',
    color: 'var(--state-progress)',
    borderColor: 'var(--state-progress)',
    defaultSize: 55,
  },
  resource: {
    shape: 'ellipse',
    color: '#06b6d4',
    borderColor: '#0891b2',
    defaultSize: 45,
  },
  constraint: {
    shape: 'hexagon',
    color: 'var(--state-delayed)',
    borderColor: 'var(--state-delayed)',
    defaultSize: 45,
  },
};

export interface EdgeTypeConfig {
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  width: number;
}

export const EDGE_TYPE_CONFIG: Record<string, EdgeTypeConfig> = {
  DEPENDS_ON: { color: '#ef4444', lineStyle: 'dashed', width: 2 },
  BLOCKS: { color: '#f97316', lineStyle: 'solid', width: 3 },
  PART_OF: { color: '#3b82f6', lineStyle: 'solid', width: 2 },
  FOLLOW_UP_FOR: { color: '#8b5cf6', lineStyle: 'dotted', width: 2 },
  SPAWNED_FROM: { color: '#10b981', lineStyle: 'solid', width: 2 },
  ASSIGNED_TO: { color: '#06b6d4', lineStyle: 'solid', width: 1.5 },
  OWNED_BY: { color: '#0ea5e9', lineStyle: 'solid', width: 1.5 },
  APPLIES_TO: { color: '#f59e0b', lineStyle: 'dashed', width: 2 },
  INFORMS: { color: '#94a3b8', lineStyle: 'dotted', width: 1.5 },
  BRANCHED_FROM: { color: '#a855f7', lineStyle: 'solid', width: 2 },
  BATCHED_IN: { color: '#14b8a6', lineStyle: 'solid', width: 1.5 },
  REFERRED_BY: { color: '#64748b', lineStyle: 'dotted', width: 1.5 },
};
