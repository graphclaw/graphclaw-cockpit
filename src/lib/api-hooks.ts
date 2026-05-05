/**
 * Central API hooks — every TanStack Query hook that talks to the backend.
 * All calls use the raw fetch with the Bearer token from localStorage.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logoutAndRedirectToLogin, recoverAuthSession } from '@/lib/auth-session';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = localStorage.getItem('gc-access-token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

function parseApiError(path: string, method: string, status: number): Error {
  if (status === 401) {
    return new Error(`Unauthorized request for ${method} ${path}. Please sign in again.`);
  }
  return new Error(`API ${method} ${path} → ${status}`);
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function apiRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const send = async (): Promise<Response> => {
    return fetch(path, {
      method,
      headers: authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await send();
  if (res.status === 401) {
    const recovered = await recoverAuthSession();
    if (!recovered) {
      logoutAndRedirectToLogin();
      throw parseApiError(path, method, res.status);
    }
    res = await send();
    if (res.status === 401) {
      logoutAndRedirectToLogin();
      throw parseApiError(path, method, res.status);
    }
  }

  if (!res.ok) {
    throw parseApiError(path, method, res.status);
  }

  return parseJsonResponse<T>(res);
}

async function apiFetch<T>(path: string): Promise<T> {
  return apiRequest<T>(path, 'GET');
}

async function apiFetchOptional<T>(path: string): Promise<T | null> {
  try {
    return await apiFetch<T>(path);
  } catch {
    return null;
  }
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, 'POST', body);
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, 'PATCH', body);
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, 'PUT', body);
}

async function apiDelete(path: string): Promise<undefined> {
  await apiRequest<undefined>(path, 'DELETE');
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthMe {
  user_id: string;
  token_type: string;
}

export function useAuthMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiFetch<AuthMe>('/auth/me'),
    staleTime: 5 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Graph — Goals
// ---------------------------------------------------------------------------

export interface GoalItem {
  id: string;
  title: string;
  state: string;
  priority: string;
  assignee?: string;
  created_at?: string;
  started_at?: string;
  deadline?: string;
  estimated_effort_days?: number;
  task_type?: string;
  progress?: number;
  parent_id?: string;
}

export interface GoalListResponse {
  items: GoalItem[];
  next_cursor: string | null;
  total: number;
}

export function useGoals(cursor?: string) {
  return useQuery({
    queryKey: ['graph', 'goals', { cursor }],
    queryFn: () =>
      apiFetch<GoalListResponse>(
        `/app/v1/graph/goals${cursor ? `?cursor=${cursor}` : ''}`,
      ),
  });
}

// ---------------------------------------------------------------------------
// Graph — Goal Tree
// ---------------------------------------------------------------------------

export interface GoalTreeNode {
  id: string;
  title: string;
  state: string;
  priority?: string;
  assignee?: string;
  task_type?: string;
  progress?: number;
  started_at?: string;
  created_at?: string;
  deadline?: string;
  estimated_effort_days?: number;
  parent_id?: string;
  children?: GoalTreeNode[];
}

export interface GoalTreeResponse {
  root: GoalTreeNode;
}

export function useGoalTree(goalId: string, depth = 5) {
  return useQuery({
    queryKey: ['graph', 'goals', goalId, 'tree', depth],
    queryFn: () =>
      apiFetch<GoalTreeResponse>(
        `/app/v1/graph/goals/${goalId}/tree?depth=${depth}`,
      ),
    enabled: !!goalId,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Graph — Tasks
// ---------------------------------------------------------------------------

export interface TaskItem {
  id: string;
  title: string;
  state: string;
  score: number;
  priority?: string;
  assigned_to?: string;
  goal_id?: string;
  parent_id?: string;
  task_type?: string;
  progress?: number;
  started_at?: string;
  created_at?: string;
  deadline?: string;
  estimated_effort_days?: number;
}

export interface TaskListResponse {
  items: TaskItem[];
  next_cursor: string | null;
  total: number;
}

export function useTasks(cursor?: string) {
  return useQuery({
    queryKey: ['graph', 'tasks', { cursor }],
    queryFn: () =>
      apiFetch<TaskListResponse>(
        `/app/v1/graph/tasks${cursor ? `?cursor=${cursor}` : ''}`,
      ),
  });
}

export interface TaskDetail extends TaskItem {
  description?: string;
  deadline?: string;
  created_at?: string;
  updated_at?: string;
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['graph', 'tasks', taskId],
    queryFn: () => apiFetch<TaskDetail>(`/app/v1/graph/tasks/${taskId}`),
    enabled: !!taskId,
  });
}

export interface ValidTransition {
  from: string;
  to: string;
  guard?: string;
}

export function useValidTransitions(taskId: string) {
  return useQuery({
    queryKey: ['tasks', taskId, 'valid-transitions'],
    queryFn: () =>
      apiFetch<ValidTransition[]>(`/app/v1/tasks/${taskId}/valid-transitions`),
    enabled: !!taskId,
  });
}

export function useTransitionTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      targetState,
    }: {
      taskId: string;
      targetState: string;
    }) => apiPost(`/app/v1/tasks/${taskId}/transition`, { target_state: targetState }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['graph', 'tasks'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Graph — Resources
// ---------------------------------------------------------------------------

export interface ResourceItem {
  id: string;
  name: string;
  type: string;
  capacity?: number;
  allocated?: number;
}

export interface ResourceListResponse {
  items: ResourceItem[];
  next_cursor: string | null;
  total: number;
}

export function useResources() {
  return useQuery({
    queryKey: ['graph', 'resources'],
    queryFn: () => apiFetch<ResourceListResponse>('/app/v1/graph/resources'),
  });
}

// ---------------------------------------------------------------------------
// Graph — Edges
// ---------------------------------------------------------------------------

export interface GraphEdgeItem {
  edge_id: string;
  source_id: string;
  target_id: string;
  edge_type: string;
}

export interface EdgeListResponse {
  items: GraphEdgeItem[];
  next_cursor: string | null;
}

export function useGraphEdges(nodeId?: string) {
  return useQuery({
    queryKey: ['graph', 'edges', nodeId],
    queryFn: () =>
      apiFetch<EdgeListResponse>(
        nodeId ? `/app/v1/graph/edges?node_id=${nodeId}` : '/app/v1/graph/edges',
      ),
  });
}

// ---------------------------------------------------------------------------
// Agent Monitor
// ---------------------------------------------------------------------------

export interface AgentStatus {
  running: boolean;
  last_cycle_at: string | null;
  queue_depth: number;
  agent_version: string;
  tasks_scored?: number;
  tasksScored?: number;
  last_cycle_tasks_scored?: number;
  tasks_completed?: number;
}

export function useAgentStatus() {
  return useQuery({
    queryKey: ['agent', 'status'],
    queryFn: () => apiFetch<AgentStatus>('/app/v1/agent/status'),
    refetchInterval: 30_000,
  });
}

export interface BriefingSection {
  title: string;
  items: string[];
  max_items: number;
}

export interface AgentBriefing {
  generated_at: string;
  session_id: string;
  critical: BriefingSection;
  inferences: BriefingSection;
  completed: BriefingSection;
  ahead_of_curve: BriefingSection;
}

export function useAgentBriefing() {
  return useQuery({
    queryKey: ['agent', 'briefing'],
    queryFn: () => apiFetch<AgentBriefing>('/app/v1/agent/briefing'),
    refetchInterval: 30_000,
  });
}

export interface ActionQueueItem {
  node_id: string;
  final_score: number;
  rank: number;
  recommended_action: string;
  autonomy_level: string;
  explanation: {
    node_id: string;
    scored_at: string;
    final_score: number;
    rank: number;
    factors: {
      factor_name: string;
      raw_score: number;
      weight: number;
      weighted_score: number;
      plain_english: string;
    }[];
  };
}

export function useActionQueue() {
  return useQuery({
    queryKey: ['agent', 'action-queue'],
    queryFn: () => apiFetch<ActionQueueItem[]>('/app/v1/agent/action-queue'),
    refetchInterval: 15_000,
  });
}

export interface AgentTrigger {
  trigger_id: string;
  triggerId?: string;
  name: string;
  schedule: string;
  enabled: boolean;
  next_fire_at?: string;
  nextFireAt?: string;
  last_fired?: string;
  lastFired?: string;
}

export function useAgentTriggers() {
  return useQuery({
    queryKey: ['agent', 'triggers'],
    queryFn: () => apiFetch<AgentTrigger[]>('/app/v1/agent/triggers/schedule'),
    refetchInterval: 30_000,
  });
}

export function useFireAgentTrigger() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (triggerId: string) =>
      apiPost(`/app/v1/agent/triggers/${encodeURIComponent(triggerId)}/fire`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agent', 'triggers'] });
      void qc.invalidateQueries({ queryKey: ['agent', 'status'] });
    },
  });
}

export interface CommsSummary {
  date?: string;
  received?: number;
  sent?: number;
  matched?: number;
  unmatched?: number;
  messages_received?: number;
  messagesReceived?: number;
  replies_sent?: number;
  repliesSent?: number;
}

export function useCommsSummary(date?: string) {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';

  return useQuery({
    queryKey: ['agent', 'comms-summary', date ?? 'today'],
    queryFn: () => apiFetchOptional<CommsSummary>(`/app/v1/comms/summary${query}`),
    refetchInterval: 30_000,
    retry: false,
  });
}

export interface InboundLogItem {
  timestamp?: string;
  channel?: string;
  channel_type?: string;
  channelType?: string;
  from?: string;
  from_display?: string;
  fromDisplay?: string;
  message_preview?: string;
  messagePreview?: string;
  task_id?: string;
  taskId?: string;
  action_taken?: string;
  actionTaken?: string;
}

export interface InboundLogResponse {
  items?: InboundLogItem[];
  next_cursor?: string | null;
  nextCursor?: string | null;
}

export interface InboundLogParams {
  from: string;
  to: string;
  limit?: number;
}

export function useInboundLog(params: InboundLogParams) {
  const queryParams = new URLSearchParams();
  queryParams.set('from', params.from);
  queryParams.set('to', params.to);
  queryParams.set('limit', String(params.limit ?? 50));

  return useQuery({
    queryKey: ['agent', 'inbound-log', params],
    queryFn: () => apiFetchOptional<InboundLogResponse>(`/app/v1/tasks/inbound-log?${queryParams.toString()}`),
    refetchInterval: 60_000,
    retry: false,
  });
}

export interface OutboundLogItem {
  timestamp?: string;
  channel?: string;
  channel_type?: string;
  channelType?: string;
  to?: string;
  to_display?: string;
  toDisplay?: string;
  subject?: string;
  summary?: string;
  task_id?: string;
  taskId?: string;
  status?: string;
}

export interface OutboundLogResponse {
  items?: OutboundLogItem[];
  next_cursor?: string | null;
  nextCursor?: string | null;
}

export interface OutboundLogParams {
  from: string;
  to: string;
  limit?: number;
}

export function useOutboundLog(params: OutboundLogParams) {
  const queryParams = new URLSearchParams();
  queryParams.set('from', params.from);
  queryParams.set('to', params.to);
  queryParams.set('limit', String(params.limit ?? 50));

  return useQuery({
    queryKey: ['agent', 'outbound-log', params],
    queryFn: () =>
      apiFetchOptional<OutboundLogResponse>(`/app/v1/tasks/outbound-log?${queryParams.toString()}`),
    refetchInterval: 60_000,
    retry: false,
  });
}

export interface AgentSessionItem {
  sessionId?: string;
  startedAt?: string;
  completedAt?: string;
  status?: string;
}

export interface AgentSessionsResponse {
  items?: AgentSessionItem[];
  nextCursor?: number | string | null;
  total?: number;
}

export function useAgentSessions(limit = 20) {
  return useQuery({
    queryKey: ['agent', 'sessions', limit],
    queryFn: () => apiFetchOptional<AgentSessionsResponse>(`/app/v1/agent/sessions?limit=${limit}`),
    refetchInterval: 30_000,
    retry: false,
  });
}

export interface SkillWorkerJob {
  job_id?: string;
  jobId?: string;
  skill_id?: string;
  skillId?: string;
  skill_name?: string;
  skillName?: string;
  task_id?: string;
  taskId?: string;
  status?: string;
  error?: unknown;
  error_message?: string;
  errorMessage?: string;
  message?: string;
  result?: string;
  summary?: string;
  tokens?: number | string;
  tokens_used?: number | string;
  token_count?: number | string;
  total_tokens?: number | string;
  duration_seconds?: number | string;
  durationSeconds?: number | string;
  completed_at?: string;
  completedAt?: string;
  ended_at?: string;
  finished_at?: string;
}

export interface SkillWorkersResponse {
  completed_jobs?: SkillWorkerJob[];
  jobs?: SkillWorkerJob[];
}

export function useSkillWorkers() {
  return useQuery({
    queryKey: ['agent', 'skills-workers'],
    queryFn: () => apiFetchOptional<SkillWorkersResponse>('/app/v1/skills/workers'),
    refetchInterval: 30_000,
    retry: false,
  });
}

export interface SkillWorkerStatus {
  worker_id?: string;
  workerId?: string;
  state?: string;
  current_job_id?: string | null;
  currentJobId?: string | null;
  last_heartbeat?: string | null;
  lastHeartbeat?: string | null;
  jobs_completed?: number;
  jobsCompleted?: number;
  jobs_failed?: number;
  jobsFailed?: number;
}

export function useSkillWorkerStatuses() {
  return useQuery({
    queryKey: ['agent', 'skills-worker-statuses'],
    queryFn: async () => {
      const payload = await apiFetchOptional<SkillWorkerStatus[] | { workers?: SkillWorkerStatus[] }>(
        '/app/v1/skills/workers',
      );

      if (Array.isArray(payload)) {
        return payload;
      }

      if (payload && typeof payload === 'object' && Array.isArray(payload.workers)) {
        return payload.workers;
      }

      return [] as SkillWorkerStatus[];
    },
    refetchInterval: 15_000,
    retry: false,
  });
}

export type AgentActivityType = 'all' | 'decisions' | 'comms' | 'skills' | 'errors';

export interface AgentActivityItem {
  timestamp: string;
  event_type: string;
  message: string;
  task_id?: string | null;
  status?: string | null;
  session_id?: string | null;
  raw?: Record<string, unknown> | null;
}

export interface AgentActivityResponse {
  items: AgentActivityItem[];
  next_cursor: string | null;
}

export interface AgentActivityParams {
  from: string;
  to: string;
  type: AgentActivityType;
  limit?: number;
}

function buildActivityQueryString(params: AgentActivityParams, cursor?: string | null): string {
  const queryParams = new URLSearchParams();
  queryParams.set('from', params.from);
  queryParams.set('to', params.to);
  queryParams.set('type', params.type);
  queryParams.set('limit', String(params.limit ?? 50));
  if (cursor) {
    queryParams.set('cursor', cursor);
  }
  return queryParams.toString();
}

export function useInfiniteAgentActivity(params: AgentActivityParams, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['agent', 'activity', params],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const query = buildActivityQueryString(params, pageParam);
      return apiFetch<AgentActivityResponse>(`/app/v1/agent/activity?${query}`);
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    enabled,
    retry: false,
    refetchInterval: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Intelligence Hub — Agent List (MinIO scan, NOT canvas API)
// ---------------------------------------------------------------------------

export interface IntelligenceAgent {
  agent_id: string;
  name: string;
  source: 'user' | 'system';
  description?: string;
}

export function useIntelligenceAgents() {
  return useQuery({
    queryKey: ['intelligence', 'agents'],
    queryFn: () => apiFetch<IntelligenceAgent[]>('/app/v1/intelligence/agents'),
  });
}

// ---------------------------------------------------------------------------
// Agents (sub-agent pool)
// ---------------------------------------------------------------------------

export interface SubAgent {
  agent_id: string;
  name: string;
  state: string;
  skill?: string;
  last_active?: string;
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => apiFetch<SubAgent[]>('/app/v1/agents'),
    refetchInterval: 15_000,
  });
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface ScoringWeights {
  W1_timeline: number;
  W2_dependencies: number;
  W3_critical_path: number;
  W4_blocker: number;
  W5_override: number;
  W6_resource_risk: number;
  W7_constraint: number;
}

export function useScoringWeights() {
  return useQuery({
    queryKey: ['settings', 'scoring-weights'],
    queryFn: () => apiFetch<ScoringWeights>('/app/v1/settings/scoring-weights'),
  });
}

export function useUpdateScoringWeights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weights: ScoringWeights) =>
      apiPatch<ScoringWeights>('/app/v1/settings/scoring-weights', weights),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings', 'scoring-weights'] });
    },
  });
}

export interface TaskScore {
  task_id: string;
  explanation?: string;
  summary?: string;
  final_score: number;
  factors: {
    factor_name: string;
    raw_score: number;
    weight: number;
    weighted_score: number;
    plain_english: string;
  }[];
  scored_at: string;
}

export function useTaskScore(taskId: string) {
  return useQuery({
    queryKey: ['scoring', 'tasks', taskId],
    queryFn: () => apiFetch<TaskScore>(`/app/v1/scoring/tasks/${taskId}`),
    enabled: !!taskId,
  });
}

export function useTaskScoreHistory(taskId: string) {
  return useQuery({
    queryKey: ['scoring', 'tasks', taskId, 'history'],
    queryFn: () =>
      apiFetch<TaskScore[]>(`/app/v1/scoring/tasks/${taskId}/history`),
    enabled: !!taskId,
  });
}

export interface SimulateScoreRequest {
  task_id: string;
  modified_weights?: Record<string, number>;
  modified_factors?: Record<string, number>;
}

interface RawSimulateScoreResponse {
  task_id?: string;
  node_id?: string;
  final_score: number;
  factors: TaskScore['factors'];
  summary?: string;
  explanation?: string;
}

export function useSimulateTaskScore() {
  return useMutation({
    mutationFn: async (body: SimulateScoreRequest): Promise<TaskScore> => {
      const raw = await apiPost<RawSimulateScoreResponse>('/app/v1/scoring/simulate', body);

      return {
        task_id: raw.task_id ?? raw.node_id ?? body.task_id,
        final_score: raw.final_score,
        factors: raw.factors,
        scored_at: new Date().toISOString(),
        summary: raw.summary,
        explanation: raw.explanation,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Settings — Channels
// ---------------------------------------------------------------------------

export interface ChannelConfig {
  channel: string;
  active: boolean;
  config?: Record<string, string>;
}

export function useChannels() {
  return useQuery({
    queryKey: ['settings', 'channels'],
    queryFn: () => apiFetch<ChannelConfig[]>('/app/v1/settings/channels'),
  });
}

export function useActivateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ch, config }: { ch: string; config?: Record<string, string> }) =>
      apiPost(`/app/v1/settings/channels/${ch}/activate`, config ?? {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings', 'channels'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Settings — LLM Keys (user-level BYOK)
// ---------------------------------------------------------------------------

export interface LlmKeyEntry {
  provider: string;
  configured: boolean;
}

export function useSettingsLlmKeys() {
  return useQuery({
    queryKey: ['settings', 'llm-keys'],
    queryFn: () => apiFetch<LlmKeyEntry[]>('/app/v1/settings/llm-keys'),
  });
}

export function useSaveLlmKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, key }: { provider: string; key: string }) =>
      apiPost(`/app/v1/settings/llm-keys`, { provider, key }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings', 'llm-keys'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Settings — A2A agents
// ---------------------------------------------------------------------------

export interface A2aAgent {
  key_id: string;
  agent_name: string;
  description: string;
  revoked: boolean;
}

export function useA2aAgents() {
  return useQuery({
    queryKey: ['a2a', 'agents'],
    queryFn: () => apiFetch<A2aAgent[]>('/app/v1/a2a/agents'),
  });
}

export function useCreateA2aAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (label: string) =>
      apiPost<{ key_id: string; agent_name: string; api_key: string }>('/app/v1/a2a/agents', {
        agent_name: label,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['a2a', 'agents'] });
    },
  });
}

export function useRevokeA2aAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => apiDelete(`/app/v1/a2a/agents/${keyId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['a2a', 'agents'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Admin — Members
// ---------------------------------------------------------------------------

export interface AdminMember {
  user_id: string;
  email: string;
  role: string;
  member_status: string;
  joined_at: string;
}

export function useAdminMembers() {
  return useQuery({
    queryKey: ['admin', 'members'],
    queryFn: () => apiFetch<AdminMember[]>('/app/v1/admin/members'),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      apiPost('/app/v1/admin/members/invite', { email, role }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'members'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Admin — Features
// ---------------------------------------------------------------------------

export interface FeatureFlags {
  enable_agent_canvas: boolean;
  enable_mcp_integration: boolean;
  enable_skill_marketplace: boolean;
  enable_multi_channel: boolean;
  enable_a2a: boolean;
  extra: Record<string, boolean>;
}

export function useAdminFeatures() {
  return useQuery({
    queryKey: ['admin', 'features'],
    queryFn: () => apiFetch<FeatureFlags>('/app/v1/admin/features'),
  });
}

export function useUpdateAdminFeatures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flags: Partial<FeatureFlags>) =>
      apiPatch<FeatureFlags>('/app/v1/admin/features', flags),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'features'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Admin — LLM
// ---------------------------------------------------------------------------

export interface LlmProvider {
  provider: string;
  model: string;
  enabled: boolean;
  priority: number;
}

export interface LlmProvidersResponse {
  providers: LlmProvider[];
  default_provider: string;
}

export function useAdminLlmProviders() {
  return useQuery({
    queryKey: ['admin', 'llm', 'providers'],
    queryFn: () => apiFetch<LlmProvidersResponse>('/app/v1/admin/llm/providers'),
  });
}

export interface LlmBudget {
  daily_limit_usd: number;
  monthly_limit_usd: number;
  alert_threshold_pct: number;
}

export function useAdminLlmBudget() {
  return useQuery({
    queryKey: ['admin', 'llm', 'budget'],
    queryFn: () => apiFetch<LlmBudget>('/app/v1/admin/llm/budget'),
  });
}

// ---------------------------------------------------------------------------
// Admin — Guardrails
// ---------------------------------------------------------------------------

export interface GuardrailRule {
  rule_id: string;
  name: string;
  pattern: string;
  action: string;
  enabled: boolean;
  description: string;
}

export interface GuardrailsConfig {
  version: string;
  rules: GuardrailRule[];
}

export function useAdminGuardrails() {
  return useQuery({
    queryKey: ['admin', 'guardrails'],
    queryFn: () => apiFetch<GuardrailsConfig>('/app/v1/admin/guardrails'),
  });
}

export function useUpdateAdminGuardrails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: GuardrailsConfig) =>
      apiPut<GuardrailsConfig>('/app/v1/admin/guardrails', config),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'guardrails'] });
    },
  });
}

export function useValidateGuardrails() {
  return useMutation({
    mutationFn: (config: GuardrailsConfig) =>
      apiPost<{ valid: boolean; errors: string[]; rule_count: number }>('/app/v1/admin/guardrails/validate', config),
  });
}

// ---------------------------------------------------------------------------
// Admin — SSO
// ---------------------------------------------------------------------------

export interface SsoConfig {
  provider: string;
  enabled: boolean;
  enforced: boolean;
  client_id: string;
  issuer_url: string;
  metadata_url: string;
  allowed_domains: string[];
  extra: Record<string, string>;
}

export function useAdminSso() {
  return useQuery({
    queryKey: ['admin', 'sso'],
    queryFn: () => apiFetch<SsoConfig>('/app/v1/admin/sso'),
  });
}

export function useUpdateAdminSso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<SsoConfig>) =>
      apiPatch<SsoConfig>('/app/v1/admin/sso', config),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'sso'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Admin — Audit Log
// ---------------------------------------------------------------------------

export interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: string;
  detail?: string;
}

export function useAdminAuditLog(limit = 50) {
  return useQuery({
    queryKey: ['admin', 'audit-log', { limit }],
    queryFn: () =>
      apiFetch<AuditEntry[]>(`/app/v1/admin/audit-log?limit=${limit}`),
    refetchInterval: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Admin — Infrastructure / Deployment
// ---------------------------------------------------------------------------

export interface ServiceHealth {
  name: string;
  replicas?: number;
  desired?: number;
  health?: string;
  last_deployed?: string;
}

export interface DeploymentStatus {
  overall: string;
  version: string;
  environment: string;
  services: ServiceHealth[];
}

export function useAdminDeploymentStatus() {
  return useQuery({
    queryKey: ['admin', 'deployment', 'status'],
    queryFn: () => apiFetch<DeploymentStatus>('/app/v1/admin/deployment/status'),
    refetchInterval: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Admin — Connectors
// ---------------------------------------------------------------------------

export interface ConnectorItem {
  connector_id: string;
  name: string;
  type: string;
  status: string;
  last_sync?: string;
}

export function useAdminConnectors() {
  return useQuery({
    queryKey: ['admin', 'connectors'],
    queryFn: () => apiFetch<ConnectorItem[]>('/app/v1/admin/connectors'),
  });
}

// ---------------------------------------------------------------------------
// Admin — Judge
// ---------------------------------------------------------------------------

export interface JudgeResult {
  id: string;
  skill: string;
  score: number;
  verdict: 'PASS' | 'FAIL';
  timestamp: string;
}

export interface JudgeStats {
  pass_rate: number;
  avg_score: number;
  total_evaluations: number;
}

export function useAdminJudgeResults() {
  return useQuery({
    queryKey: ['admin', 'judge', 'results'],
    queryFn: () => apiFetch<JudgeResult[]>('/app/v1/admin/llm-judge/results'),
    refetchInterval: 30_000,
  });
}

export function useAdminJudgeStats() {
  return useQuery({
    queryKey: ['admin', 'judge', 'stats'],
    queryFn: () => apiFetch<JudgeStats>('/app/v1/admin/llm-judge/stats'),
    refetchInterval: 30_000,
  });
}

export function useSyncConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectorId: string) =>
      apiPost(`/app/v1/admin/connectors/${connectorId}/sync`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'connectors'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Skills Marketplace
// ---------------------------------------------------------------------------

export interface SkillItem {
  skill_id: string;
  name: string;
  version: string;
  enabled: boolean;
  source_uri?: string;
  source_type?: string;
  description?: string;
  tags?: string[];
  usage_count?: number;
  avg_quality_score?: number;
}

export interface SkillConfig {
  skill_id: string;
  llm_override?: string;
  model_override?: string;
  output_type: 'DRAFT_FOR_REVIEW' | 'AUTO_COMPLETE';
  requires_approval: boolean;
}

export interface SkillSource {
  source_uri: string;
  source_type: string;
  name: string;
  last_fetched_at?: string;
}

export interface MarketplacePolicy {
  enabled: boolean;
  allow_external_sources: boolean;
  require_approval_for_install: boolean;
  approved_sources: string[];
}

type RawSkillEntry = Omit<SkillItem, 'name'> & { skill_name?: string; name?: string };

function normalizeSkill(raw: RawSkillEntry): SkillItem {
  return { ...raw, name: raw.skill_name ?? raw.name ?? '' } as SkillItem;
}

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const data = await apiFetch<RawSkillEntry[]>('/app/v1/skills');
      return data.map(normalizeSkill);
    },
  });
}

export function useSkillDetail(skillId: string) {
  return useQuery({
    queryKey: ['skills', skillId],
    queryFn: async () => {
      const raw = await apiFetch<RawSkillEntry & { config?: SkillConfig }>(`/app/v1/skills/${skillId}`);
      return { ...normalizeSkill(raw), config: raw.config };
    },
    enabled: !!skillId,
  });
}

export function useToggleSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, enabled }: { skillId: string; enabled: boolean }) =>
      apiPatch<SkillItem>(`/app/v1/skills/${skillId}`, { enabled }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useUpdateSkillConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, config }: { skillId: string; config: Omit<SkillConfig, 'skill_id'> }) =>
      apiPatch<SkillConfig>(`/app/v1/skills/${skillId}/config`, config),
    onSuccess: (_data, { skillId }) => {
      void qc.invalidateQueries({ queryKey: ['skills', skillId] });
    },
  });
}

export function useInstallSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skill_name, source_uri, version }: { skill_name: string; source_uri: string; version?: string }) =>
      apiPost('/app/v1/skills/install', { skill_name, source_uri, version }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useUninstallSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => apiDelete(`/app/v1/skills/${skillId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useSearchSkills(query: string) {
  return useQuery({
    queryKey: ['skills', 'search', query],
    queryFn: async () => {
      const data = await apiFetch<RawSkillEntry[]>(`/app/v1/skills/search?q=${encodeURIComponent(query)}`);
      return data.map(normalizeSkill);
    },
    enabled: query.length > 1,
  });
}

export function useSkillSources() {
  return useQuery({
    queryKey: ['skills', 'sources'],
    queryFn: () => apiFetch<SkillSource[]>('/app/v1/skills/sources'),
  });
}

export function useAddSkillSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { uri: string; name: string; source_type: string }) =>
      apiPost<SkillSource>('/app/v1/skills/sources', body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['skills', 'sources'] });
    },
  });
}

export function useRemoveSkillSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourceUri: string) =>
      apiDelete(`/app/v1/skills/sources/${encodeURIComponent(sourceUri)}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['skills', 'sources'] });
    },
  });
}

export function useMarketplacePolicy() {
  return useQuery({
    queryKey: ['admin', 'marketplace'],
    queryFn: () => apiFetch<MarketplacePolicy>('/app/v1/admin/features/marketplace'),
  });
}

export function useUpdateMarketplacePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policy: MarketplacePolicy) =>
      apiPut<MarketplacePolicy>('/app/v1/admin/features/marketplace', policy),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'marketplace'] });
    },
  });
}

// ---------------------------------------------------------------------------
// MCP Registry
// ---------------------------------------------------------------------------

export interface McpServer {
  server_id: string;
  name: string;
  transport: 'stdio' | 'sse' | 'http';
  endpoint_url: string | null;
  command: string | null;
  trust_tier: 'AUTO' | 'GATED' | 'BLOCKED';
  scope: string[];
  enabled: boolean;
  // Backward-compatible optional fields used by older UI rendering.
  tool_count?: number;
  status?: 'connected' | 'disconnected' | 'error';
  endpoint?: string;
}

export interface RegisterMcpServerInput {
  name: string;
  transport: 'stdio' | 'sse' | 'http';
  endpoint_url?: string;
  command?: string;
  trust_tier: 'AUTO' | 'GATED' | 'BLOCKED';
  scope?: string[];
}

export function useMcpServers() {
  return useQuery({
    queryKey: ['mcp-servers'],
    queryFn: () => apiFetch<McpServer[]>('/app/v1/mcp-servers'),
  });
}

export function useRegisterMcpServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (server: RegisterMcpServerInput) =>
      apiPost<McpServer>('/app/v1/mcp-servers', server),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mcp-servers'] });
    },
  });
}

export function useDeleteMcpServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serverId: string) => apiDelete(`/app/v1/mcp-servers/${serverId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mcp-servers'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Intelligence Hub — Profile
// ---------------------------------------------------------------------------

export interface AgentProfile {
  agent_id: string;
  content: string;
  updated_at: string | null;
}

export function useAgentProfile(agentId: string) {
  return useQuery({
    queryKey: ['intelligence', agentId, 'profile'],
    queryFn: () =>
      apiFetch<AgentProfile>(`/app/v1/intelligence/agents/${agentId}/profile`),
    enabled: !!agentId,
  });
}

export function useUpdateAgentProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, content }: { agentId: string; content: string }) =>
      apiPut<AgentProfile>(`/app/v1/intelligence/agents/${agentId}/profile`, {
        content,
      }),
    onSuccess: (_data, { agentId }) => {
      void qc.invalidateQueries({ queryKey: ['intelligence', agentId, 'profile'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Intelligence Hub — Working Memory
// ---------------------------------------------------------------------------

export interface WorkingMemory {
  agent_id: string;
  memory_type: string;
  key: string;
  content: string;
}

export function useWorkingMemory(agentId: string) {
  return useQuery({
    queryKey: ['intelligence', agentId, 'memory', 'working'],
    queryFn: () =>
      apiFetch<WorkingMemory>(
        `/app/v1/intelligence/agents/${agentId}/memory/working`,
      ),
    enabled: !!agentId,
  });
}

export interface CompactResponse {
  agent_id: string;
  archived_as: string;
  working_context_replaced: boolean;
  context_before_chars: number;
  context_after_chars: number;
  reduction_pct: number;
}

export function useCompactWorkingMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, summary, session_label }: { agentId: string; summary: string; session_label?: string }) =>
      apiPost<CompactResponse>(`/app/v1/intelligence/agents/${agentId}/memory/compact`, { summary, session_label }),
    onSuccess: (_data, { agentId }) => {
      void qc.invalidateQueries({ queryKey: ['intelligence', agentId, 'memory'] });
    },
  });
}

export interface WorkingArchiveEntry {
  name: string;
  size_chars: number;
  created_at?: string;
}

export function useWorkingMemoryArchive(agentId: string) {
  return useQuery({
    queryKey: ['intelligence', agentId, 'memory', 'working', 'archive'],
    queryFn: () =>
      apiFetch<WorkingArchiveEntry[]>(
        `/app/v1/intelligence/agents/${agentId}/memory/working/archive`,
      ),
    enabled: !!agentId,
  });
}

export function useUpdateWorkingMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, content }: { agentId: string; content: string }) =>
      apiPut<WorkingMemory>(`/app/v1/intelligence/agents/${agentId}/memory/working`, { content }),
    onSuccess: (_data, { agentId }) => {
      void qc.invalidateQueries({ queryKey: ['intelligence', agentId, 'memory', 'working'] });
    },
  });
}

export interface ContextUsage {
  agent_id: string;
  working_chars: number;
  episodic_chars: number;
  semantic_chars: number;
  total_chars: number;
  budget_chars: number;
  utilization_pct: number;
}

export function useContextUsage(agentId: string) {
  return useQuery({
    queryKey: ['intelligence', agentId, 'memory', 'estimate'],
    queryFn: () =>
      apiFetch<ContextUsage>(`/app/v1/intelligence/agents/${agentId}/memory/estimate`),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Intelligence Hub — Episodic Memory
// ---------------------------------------------------------------------------

export interface EpisodicMemoryEntry {
  name: string;
  content: string;
  created_at?: string;
  status: 'active' | 'archived';
}

export function useEpisodicMemory(agentId: string) {
  return useQuery({
    queryKey: ['intelligence', agentId, 'memory', 'episodic'],
    queryFn: () =>
      apiFetch<EpisodicMemoryEntry[]>(
        `/app/v1/intelligence/agents/${agentId}/memory/episodic`,
      ),
    enabled: !!agentId,
  });
}

export function useArchiveEpisodicEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, entryName }: { agentId: string; entryName: string }) =>
      apiPost(`/app/v1/intelligence/agents/${agentId}/memory/episodic/${entryName}/archive`),
    onSuccess: (_data, { agentId }) => {
      void qc.invalidateQueries({ queryKey: ['intelligence', agentId, 'memory', 'episodic'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Intelligence Hub — Semantic Memory
// ---------------------------------------------------------------------------

export interface SemanticMemoryEntry {
  key: string;    // topic slug (e.g. "knowledge", "users")
  path: string;
}

export interface SemanticMemoryList {
  agent_id: string;
  memory_type: string;
  entries: SemanticMemoryEntry[];
}

export interface SemanticMemoryContent {
  agent_id: string;
  memory_type: string;
  key: string;
  content: string;
}

export function useSemanticMemory(agentId: string) {
  return useQuery({
    queryKey: ['intelligence', agentId, 'memory', 'semantic'],
    queryFn: () =>
      apiFetch<SemanticMemoryList>(
        `/app/v1/intelligence/agents/${agentId}/memory/semantic`,
      ),
    enabled: !!agentId,
  });
}

export function useSemanticTopic(agentId: string, topic: string) {
  return useQuery({
    queryKey: ['intelligence', agentId, 'memory', 'semantic', topic],
    queryFn: () =>
      apiFetch<SemanticMemoryContent>(
        `/app/v1/intelligence/agents/${agentId}/memory/semantic/${topic}`,
      ),
    enabled: !!agentId && !!topic,
  });
}

export function useUpdateSemanticMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, topic, content }: { agentId: string; topic: string; content: string }) =>
      apiPut<SemanticMemoryContent>(`/app/v1/intelligence/agents/${agentId}/memory/semantic/${topic}`, { content }),
    onSuccess: (_data, { agentId }) => {
      void qc.invalidateQueries({ queryKey: ['intelligence', agentId, 'memory', 'semantic'] });
    },
  });
}

export function useDeleteSemanticMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, topic }: { agentId: string; topic: string }) =>
      apiDelete(`/app/v1/intelligence/agents/${agentId}/memory/semantic/${topic}`),
    onSuccess: (_data, { agentId }) => {
      void qc.invalidateQueries({ queryKey: ['intelligence', agentId, 'memory', 'semantic'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Intelligence Hub — Authored Skills
// ---------------------------------------------------------------------------

export interface AuthoredSkill {
  skill_id: string;
  forked_skill_id?: string;
  original_skill_id?: string;
  name?: string;
  version?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  path?: string;
  content?: string;
}

export function useAuthoredSkills() {
  return useQuery({
    queryKey: ['intelligence', 'skills', 'authored'],
    queryFn: () =>
      apiFetch<AuthoredSkill[]>('/app/v1/intelligence/skills/authored'),
  });
}

export function useAuthoredSkillDetail(skillId: string) {
  return useQuery({
    queryKey: ['intelligence', 'skills', 'authored', skillId],
    queryFn: () =>
      apiFetch<AuthoredSkill>(`/app/v1/intelligence/skills/authored/${skillId}`),
    enabled: !!skillId,
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; version?: string; content: string }) =>
      apiPost<AuthoredSkill>('/app/v1/intelligence/skills/authored', body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['intelligence', 'skills', 'authored'] });
    },
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, content, name, description, version }: { skillId: string; content: string; name?: string; description?: string; version?: string }) =>
      apiPut<AuthoredSkill>(`/app/v1/intelligence/skills/authored/${skillId}`, { content, name, description, version }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['intelligence', 'skills', 'authored'] });
    },
  });
}

export function useDeleteAuthoredSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) =>
      apiDelete(`/app/v1/intelligence/skills/authored/${skillId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['intelligence', 'skills', 'authored'] });
    },
  });
}

export function useValidateSkill() {
  return useMutation({
    mutationFn: (content: string) =>
      apiPost<{ valid: boolean; errors: string[] }>('/app/v1/intelligence/skills/validate', { content }),
  });
}

export function useForkSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, name }: { skillId: string; name?: string }) =>
      apiPost<AuthoredSkill>(`/app/v1/intelligence/skills/authored/${skillId}/fork`, { name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['intelligence', 'skills', 'authored'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export interface Approval {
  task_id: string;
  title: string;
  reason: string;
  requested_at: string;
}

export function useApprovals() {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: () => apiFetch<Approval[]>('/app/v1/approvals'),
    refetchInterval: 15_000,
  });
}

export function useApproveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiPost(`/app/v1/approvals/${taskId}/approve`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useDenyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiPost(`/app/v1/approvals/${taskId}/deny`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatMessage {
  message_id: string;
  role: 'user' | 'assistant' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  next_cursor: string | null;
}

export interface ChatResponse {
  user_message: ChatMessage;
  agent_message: ChatMessage;
}

export function useChatMessages() {
  return useQuery({
    queryKey: ['chat', 'messages'],
    queryFn: async () => {
      const res = await apiFetch<ChatHistoryResponse>('/app/v1/chat/messages');
      return res.messages;
    },
    refetchInterval: 5_000,
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      apiPost<ChatResponse>('/app/v1/chat/messages', { content: text }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'messages'] });
    },
  });
}

// ---------------------------------------------------------------------------
// App Config
// ---------------------------------------------------------------------------

export interface AppConfig {
  app_name: string;
  version: string;
  features: Record<string, boolean>;
}

export function useAppConfig() {
  return useQuery({
    queryKey: ['app', 'config'],
    queryFn: () => apiFetch<AppConfig>('/app/v1/config'),
    staleTime: 10 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Policies (FR-POL-002)
// ---------------------------------------------------------------------------

export type PolicyName =
  | 'delegation'
  | 'escalation'
  | 'counterparty_etiquette'
  | 'reply_tone';

export interface PolicyResponse {
  frontmatter: Record<string, unknown>;
  body: string;
  version: string;
}

export interface PolicyWriteRequest {
  frontmatter: Record<string, unknown>;
  body: string;
  expected_version?: string;
}

export function usePolicy(agentId: string, policyName: PolicyName) {
  return useQuery({
    queryKey: ['intelligence', 'policies', agentId, policyName],
    queryFn: () =>
      apiFetch<PolicyResponse>(`/app/v1/agents/${agentId}/policies/${policyName}`),
    enabled: !!agentId && !!policyName,
  });
}

export function useSavePolicy(agentId: string, policyName: PolicyName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: PolicyWriteRequest) =>
      apiPut<{ version: string }>(
        `/app/v1/agents/${agentId}/policies/${policyName}`,
        req,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['intelligence', 'policies', agentId, policyName],
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Conversations (FR-UI-001)
// ---------------------------------------------------------------------------

export interface CounterpartySummary {
  counterparty_id: string;
  last_activity_at: string | null;
  channels: string[];
  thread_count: number;
}

export interface ThreadSummary {
  channel: string;
  thread_id: string;
  message_count: number;
  last_message_at: string | null;
}

export interface ConversationMessage {
  direction: 'out' | 'in';
  role: string;
  content: string;
  timestamp: string | null;
  task_id: string | null;
  channel: string | null;
  counterparty_id: string | null;
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiFetch<CounterpartySummary[]>('/app/v1/conversations'),
  });
}

export function useConversationThreads(counterpartyId: string) {
  return useQuery({
    queryKey: ['conversations', counterpartyId, 'threads'],
    queryFn: () =>
      apiFetch<ThreadSummary[]>(`/app/v1/conversations/${counterpartyId}`),
    enabled: !!counterpartyId,
  });
}

export function useConversationMessages(
  counterpartyId: string,
  channel: string,
  threadId: string,
) {
  return useQuery({
    queryKey: ['conversations', counterpartyId, channel, threadId],
    queryFn: () =>
      apiFetch<ConversationMessage[]>(
        `/app/v1/conversations/${counterpartyId}/${channel}/${threadId}?reverse=true`,
      ),
    enabled: !!counterpartyId && !!channel && !!threadId,
  });
}

// ---------------------------------------------------------------------------
// User / Orgs (FR-UI-002)
// ---------------------------------------------------------------------------

export interface OrgSummary {
  org_id: string;
  name: string;
  role: string;
  domain: string | null;
}

export function useUserOrgs() {
  return useQuery({
    queryKey: ['user', 'orgs'],
    queryFn: () => apiFetch<OrgSummary[]>('/app/v1/user/orgs'),
    staleTime: 5 * 60_000,
  });
}
