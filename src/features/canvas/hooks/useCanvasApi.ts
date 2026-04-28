/**
 * useCanvasApi — TanStack Query hooks for Agent Canvas API calls (F2).
 *
 * Covers all 11 new hooks required by canvas-design-requirements.md §9.2:
 * - useInstalledSkills
 * - useMCPServers / useMCPServerTools
 * - useA2AAgents
 * - useCanvasLayout / useSaveCanvasLayout
 * - useAgentConfig / useSaveAgentConfig
 * - useAgentWiring
 * - useCreateAgentDefinition / useDeleteAgentDefinition
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logoutAndRedirectToLogin, recoverAuthSession } from '@/lib/auth-session';

// ---------------------------------------------------------------------------
// Shared fetch helpers (mirrors api-hooks.ts pattern)
// ---------------------------------------------------------------------------

function authHeaders(): Headers {
  const headers = new Headers();
  const token = localStorage.getItem('gc-access-token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  return headers;
}

async function apiRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const send = async () =>
    fetch(path, {
      method,
      headers: authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await send();
  if (res.status === 401) {
    const recovered = await recoverAuthSession();
    if (!recovered) {
      logoutAndRedirectToLogin();
      throw new Error(`Unauthorized ${method} ${path}`);
    }
    res = await send();
    if (res.status === 401) {
      logoutAndRedirectToLogin();
      throw new Error(`Unauthorized ${method} ${path}`);
    }
  }
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const apiFetch = <T>(path: string) => apiRequest<T>(path, 'GET');
const apiPost = <T>(path: string, body?: unknown) => apiRequest<T>(path, 'POST', body);
const apiPut = <T>(path: string, body: unknown) => apiRequest<T>(path, 'PUT', body);
const apiDelete = (path: string) => apiRequest<void>(path, 'DELETE');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillEntry {
  skill_id: string;
  name: string;
  description?: string;
  output_type?: string;
  version?: string;
  source?: string;
}

export interface MCPServerEntry {
  server_id: string;
  name: string;
  transport?: string;
  trust_tier?: string;
  tools_count?: number;
}

export interface MCPTool {
  name: string;
  description?: string;
}

export interface A2AAgentEntry {
  agent_id: string;
  name: string;
  endpoint?: string;
  capabilities?: string[];
  trust_status?: string;
}

export interface CanvasLayout {
  nodes: Array<{ id: string; position: { x: number; y: number }; [k: string]: unknown }>;
  viewport: { x: number; y: number; zoom: number };
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

export interface WiringEntry {
  agent_id: string;
  skills: Array<{ skill_id: string; name: string; enabled: boolean }>;
  mcp_servers: Array<{ server_id: string; name: string; trust_tier: string }>;
  tool_sets: string[];
  sub_agents: Array<{ agent_id: string; name: string; source: string }>;
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

export interface CreateAgentPayload {
  name: string;
  description?: string;
  config?: Partial<AgentConfig>;
  tags?: string[];
  agent_id?: string;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** List all installed skills from the skill registry. */
export function useInstalledSkills() {
  return useQuery({
    queryKey: ['canvas', 'skills'],
    queryFn: () => apiFetch<SkillEntry[]>('/app/v1/skills'),
    staleTime: 5 * 60_000,
  });
}

/** List all registered MCP servers. */
export function useMCPServers() {
  return useQuery({
    queryKey: ['canvas', 'mcp-servers'],
    queryFn: () => apiFetch<MCPServerEntry[]>('/app/v1/mcp-servers'),
    staleTime: 5 * 60_000,
  });
}

/** List tools exposed by a specific MCP server. */
export function useMCPServerTools(serverId: string) {
  return useQuery({
    queryKey: ['canvas', 'mcp-servers', serverId, 'tools'],
    queryFn: () => apiFetch<MCPTool[]>(`/app/v1/mcp-servers/${serverId}/tools`),
    enabled: !!serverId,
    staleTime: 5 * 60_000,
  });
}

/** List all registered A2A external agents. */
export function useA2AAgents() {
  return useQuery({
    queryKey: ['canvas', 'a2a-agents'],
    queryFn: () => apiFetch<A2AAgentEntry[]>('/app/v1/a2a/agents'),
    staleTime: 5 * 60_000,
  });
}

/** Load canvas layout (node positions + viewport). */
export function useCanvasLayout() {
  return useQuery({
    queryKey: ['canvas', 'layout'],
    queryFn: () => apiFetch<CanvasLayout>('/app/v1/canvas/layout'),
    staleTime: 0, // always fresh
  });
}

/** Mutation: save canvas layout. */
export function useSaveCanvasLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (layout: CanvasLayout) => apiPut<CanvasLayout>('/app/v1/canvas/layout', layout),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['canvas', 'layout'] }),
  });
}

/** Load runtime config.json for a specific agent. */
export function useAgentConfig(agentId: string) {
  return useQuery({
    queryKey: ['canvas', 'agent-config', agentId],
    queryFn: () => apiFetch<AgentConfig>(`/app/v1/agents/${agentId}/config`),
    enabled: !!agentId,
    staleTime: 60_000,
  });
}

/** Mutation: update runtime config.json for a specific agent. */
export function useSaveAgentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, config }: { agentId: string; config: AgentConfig }) =>
      apiPut<AgentConfig>(`/app/v1/agents/${agentId}/config`, config),
    onSuccess: (_data, { agentId }) => {
      qc.invalidateQueries({ queryKey: ['canvas', 'agent-config', agentId] });
      qc.invalidateQueries({ queryKey: ['canvas', 'wiring', agentId] });
    },
  });
}

/** Load resolved wiring summary for a specific agent. */
export function useAgentWiring(agentId: string) {
  return useQuery({
    queryKey: ['canvas', 'wiring', agentId],
    queryFn: () => apiFetch<WiringEntry>(`/app/v1/agents/${agentId}/wiring`),
    enabled: !!agentId,
    staleTime: 60_000,
  });
}

/** Mutation: create a new agent definition (POST /app/v1/agents). */
export function useCreateAgentDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAgentPayload) =>
      apiPost<AgentDefinition>('/app/v1/agents', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['intelligence', 'agents'] });
      qc.invalidateQueries({ queryKey: ['canvas'] });
    },
  });
}

/** Mutation: delete an agent definition (DELETE /app/v1/agents/{id}). */
export function useDeleteAgentDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      cleanupRuntime = false,
    }: {
      agentId: string;
      cleanupRuntime?: boolean;
    }) =>
      apiDelete(
        `/app/v1/agents/${agentId}${cleanupRuntime ? '?cleanup_runtime=true' : ''}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['intelligence', 'agents'] });
      qc.invalidateQueries({ queryKey: ['canvas'] });
    },
  });
}
