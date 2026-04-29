/**
 * Graph Explorer — data fetching hooks.
 *
 * Parallel-fetches tasks, goals, resources, and all edges via TanStack Query.
 * Converts API shapes to ExplorerNode / ExplorerEdge for the canvas.
 */

import { useQuery } from '@tanstack/react-query';
import type {
  ExplorerNode,
  ExplorerEdge,
  NodeListResponse,
  EdgeListResponse,
  ApiTaskItem,
  ApiGoalItem,
  ApiResourceItem,
} from '../types';

// ── Auth helper (same pattern as api-hooks.ts) ────────────────────────────────

function authHeaders(): Headers {
  const headers = new Headers();
  const token = localStorage.getItem('gc-access-token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  return headers;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: authHeaders() });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Individual data hooks ─────────────────────────────────────────────────────

export function useExplorerTasks() {
  return useQuery({
    queryKey: ['graph-explorer', 'tasks'],
    queryFn: () =>
      apiFetch<NodeListResponse<ApiTaskItem>>('/app/v1/graph/tasks?limit=200'),
    staleTime: 30_000,
  });
}

export function useExplorerGoals() {
  return useQuery({
    queryKey: ['graph-explorer', 'goals'],
    queryFn: () =>
      apiFetch<NodeListResponse<ApiGoalItem>>('/app/v1/graph/goals?limit=200'),
    staleTime: 30_000,
  });
}

export function useExplorerResources() {
  return useQuery({
    queryKey: ['graph-explorer', 'resources'],
    queryFn: () =>
      apiFetch<NodeListResponse<ApiResourceItem>>('/app/v1/graph/resources?limit=200'),
    staleTime: 30_000,
  });
}

export function useExplorerEdges() {
  return useQuery({
    queryKey: ['graph-explorer', 'edges'],
    queryFn: () => apiFetch<EdgeListResponse>('/app/v1/graph/edges?limit=200'),
    staleTime: 30_000,
  });
}

// ── Combined data hook ────────────────────────────────────────────────────────

export interface GraphExplorerStats {
  totalNodes: number;
  totalEdges: number;
  taskCount: number;
  goalCount: number;
  resourceCount: number;
}

export interface GraphExplorerData {
  nodes: ExplorerNode[];
  edges: ExplorerEdge[];
  stats: GraphExplorerStats;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useGraphExplorerData(): GraphExplorerData {
  const tasks = useExplorerTasks();
  const goals = useExplorerGoals();
  const resources = useExplorerResources();
  const edgesQuery = useExplorerEdges();

  const isLoading =
    tasks.isLoading || goals.isLoading || resources.isLoading || edgesQuery.isLoading;

  const isError =
    tasks.isError || goals.isError || resources.isError || edgesQuery.isError;

  const error =
    tasks.error ?? goals.error ?? resources.error ?? edgesQuery.error ?? null;

  // Convert tasks → ExplorerNode
  const taskNodes: ExplorerNode[] = (tasks.data?.items ?? []).map((t) => ({
    kind: 'task' as const,
    id: t.id,
    title: t.title,
    state: t.state,
    priority: t.priority ?? 'MEDIUM',
    task_type: t.task_type,
    deadline: t.deadline,
    description: t.description,
    assignee: t.assigned_to,
    goal_id: t.goal_id,
    score: t.score,
    on_critical_path: t.on_critical_path,
    scoring: t.scoring,
    tags: t.tags ?? [],
  }));

  // Convert goals → ExplorerNode
  const goalNodes: ExplorerNode[] = (goals.data?.items ?? []).map((g) => ({
    kind: 'goal' as const,
    id: g.id,
    title: g.title,
    state: g.state,
    priority: g.priority,
    description: g.description,
  }));

  // Convert resources → ExplorerNode
  const resourceNodes: ExplorerNode[] = (resources.data?.items ?? []).map((r) => ({
    kind: 'resource' as const,
    id: r.id,
    name: r.name,
    resource_type: r.resource_type ?? 'HUMAN',
    reliability: r.reliability,
  }));

  // Combine all nodes
  const nodes: ExplorerNode[] = [...taskNodes, ...goalNodes, ...resourceNodes];

  // Convert edges
  const edges: ExplorerEdge[] = (edgesQuery.data?.items ?? []).map((e) => ({
    id: e.edge_id,
    source: e.source_id,
    target: e.target_id,
    edge_type: e.edge_type,
    gate_type: e.gate_type,
    strength: e.strength,
    sequence_order: e.sequence_order,
    note: e.note,
    created_by: e.created_by,
  }));

  const stats: GraphExplorerStats = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    taskCount: taskNodes.length,
    goalCount: goalNodes.length,
    resourceCount: resourceNodes.length,
  };

  const refetch = () => {
    void tasks.refetch();
    void goals.refetch();
    void resources.refetch();
    void edgesQuery.refetch();
  };

  return { nodes, edges, stats, isLoading, isError, error, refetch };
}

// ── Single node detail ────────────────────────────────────────────────────────

export function useTaskDetail(taskId: string | null) {
  return useQuery({
    queryKey: ['graph-explorer', 'task-detail', taskId],
    queryFn: () => apiFetch<{ task?: ApiTaskItem } & ApiTaskItem>(`/app/v1/graph/tasks/${taskId!}`),
    enabled: taskId !== null,
    staleTime: 15_000,
  });
}

export function useNodeEdges(nodeId: string | null) {
  return useQuery({
    queryKey: ['graph-explorer', 'node-edges', nodeId],
    queryFn: () =>
      apiFetch<EdgeListResponse>(`/app/v1/graph/edges?node_id=${nodeId!}`),
    enabled: nodeId !== null,
    staleTime: 15_000,
  });
}
