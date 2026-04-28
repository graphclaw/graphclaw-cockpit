/**
 * PropertyInspector — Right panel with 4 tabs when a node is selected (F16-F20).
 *
 * Tabs:
 *  1. Profile  — Monaco editor for profile.md (F19)
 *  2. Config   — LLM model + timeout inputs (F18)
 *  3. Wiring   — Multi-select checklists: skills, MCP, tool sets, sub-agents (F17)
 *  4. Memory   — Overview stats + Intelligence Hub link (F20)
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, ExternalLink, Brain, Loader2, Wand2, Plug, Globe, ShieldCheck, ShieldX } from 'lucide-react';
import {
  useAgentProfile,
  useUpdateAgentProfile,
  useContextUsage,
} from '@/lib/api-hooks';
import {
  useAgentConfig,
  useSaveAgentConfig,
  useInstalledSkills,
  useMCPServers,
  useMCPServerTools,
  useA2AAgents,
  type AgentConfig,
  type A2AAgentEntry,
} from '@/features/canvas/hooks/useCanvasApi';
import { MemoryEditor } from '@/features/intelligence/MemoryEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PropertyInspectorProps {
  agentId: string;
  agentName: string;
  nodeType?: string; // 'orchestrator' | 'sub_agent' | 'skill' | 'mcp_server' | 'tool_set' | 'external_agent'
  onClose?: () => void;
}

type TabId = 'profile' | 'config' | 'wiring' | 'memory';

const LLM_MODELS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4', label: 'Claude Opus 4' },
  { value: 'claude-haiku-4', label: 'Claude Haiku 4' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
];

const TOOL_SETS = [
  { id: 'task_management', label: 'Task Management', description: 'Create, update, delete tasks' },
  { id: 'planning', label: 'Planning', description: 'Break down and schedule goals' },
  { id: 'skills', label: 'Skills', description: 'Discover and invoke skills' },
  { id: 'mcp', label: 'MCP', description: 'Call MCP server tools' },
  { id: 'delegation', label: 'Delegation', description: 'Delegate to sub-agents' },
];

// ---------------------------------------------------------------------------
// Sub-panels
// ---------------------------------------------------------------------------

function ProfilePanel({ agentId }: { agentId: string }) {
  const { data: profile, isLoading } = useAgentProfile(agentId);
  const update = useUpdateAgentProfile();
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (profile) {
      setContent(profile.content);
      setSaved(profile.content);
    }
  }, [profile]);

  const isDirty = content !== saved;

  function handleSave() {
    update.mutate(
      { agentId, content },
      {
        onSuccess: () => { setSaved(content); toast.success('Profile saved.'); },
        onError: () => toast.error('Profile save failed.'),
      },
    );
  }

  if (isLoading) return <PanelLoader />;

  return (
    <div className="flex h-full flex-col gap-3 p-3" data-testid="inspector-profile-panel">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-tertiary)]">Edit the agent&apos;s persona (Markdown)</p>
        <div className="flex gap-2">
          {isDirty && <span className="text-[10px] text-yellow-400">Unsaved</span>}
          <Button size="sm" variant="outline" onClick={() => setContent(saved)} disabled={!isDirty}>
            <RotateCcw size={12} className="mr-1" /> Discard
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || update.isPending}
            data-testid="profile-save-btn">
            {update.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Save size={12} className="mr-1" />}
            Save
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <MemoryEditor value={content} onChange={setContent} height="100%" data-testid="profile-monaco" />
      </div>
    </div>
  );
}

function ConfigPanel({
  agentId,
  onConfigSaved,
}: {
  agentId: string;
  onConfigSaved?: (config: AgentConfig) => void;
}) {
  const { data: config, isLoading } = useAgentConfig(agentId);
  const saveConfig = useSaveAgentConfig();
  const [form, setForm] = useState<Partial<AgentConfig>>({});

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  function handleSave() {
    if (!config) return;
    const next: AgentConfig = { ...config, ...form } as AgentConfig;
    saveConfig.mutate(
      { agentId, config: next },
      {
        onSuccess: () => {
          toast.success('Config saved.');
          onConfigSaved?.(next);
        },
        onError: () => toast.error('Config save failed.'),
      },
    );
  }

  if (isLoading) return <PanelLoader />;

  return (
    <div className="flex flex-col gap-4 p-4" data-testid="inspector-config-panel">
      {/* LLM Model */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--text-secondary)]">LLM Model</label>
        <Select
          value={form.llm_model ?? 'claude-sonnet-4-20250514'}
          onValueChange={(v) => setForm((f) => ({ ...f, llm_model: v }))}
        >
          <SelectTrigger
            className="h-8 text-xs"
            data-testid="config-llm-model-select"
          >
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {LLM_MODELS.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Heartbeat */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Heartbeat Interval (s)
        </label>
        <input
          type="number"
          className="h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-input)] px-2 text-xs text-[var(--text-primary)]"
          value={form.heartbeat_interval_seconds ?? 60}
          onChange={(e) =>
            setForm((f) => ({ ...f, heartbeat_interval_seconds: parseInt(e.target.value, 10) || 60 }))
          }
          data-testid="config-heartbeat-input"
        />
      </div>

      {/* Execution timeout */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Execution Timeout (s)
        </label>
        <input
          type="number"
          className="h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-input)] px-2 text-xs text-[var(--text-primary)]"
          value={form.execution_timeout_seconds ?? 600}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              execution_timeout_seconds: parseInt(e.target.value, 10) || 600,
            }))
          }
          data-testid="config-timeout-input"
        />
      </div>

      <Button size="sm" onClick={handleSave} disabled={saveConfig.isPending} data-testid="config-save-btn">
        {saveConfig.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Save size={12} className="mr-1" />}
        Save Config
      </Button>
    </div>
  );
}

function WiringPanel({
  agentId,
  onConfigChange,
}: {
  agentId: string;
  onConfigChange?: () => void;
}) {
  const { data: config, isLoading: configLoading } = useAgentConfig(agentId);
  const { data: skills, isLoading: skillsLoading } = useInstalledSkills();
  const { data: mcpServers, isLoading: mcpLoading } = useMCPServers();
  const saveConfig = useSaveAgentConfig();

  const loading = configLoading || skillsLoading || mcpLoading;

  function toggleArrayItem(
    arr: string[] | null | undefined,
    id: string,
  ): string[] {
    const current = arr ?? [];
    return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  }

  function handleToggle(
    field: 'skills' | 'mcp_servers' | 'tool_sets',
    id: string,
  ) {
    if (!config) return;
    const next: AgentConfig = {
      ...config,
      [field]: toggleArrayItem(config[field], id),
    };
    saveConfig.mutate(
      { agentId, config: next },
      {
        onSuccess: () => onConfigChange?.(),
        onError: () => toast.error('Wiring save failed.'),
      },
    );
  }

  if (loading) return <PanelLoader />;

  const wiredSkills = config?.skills ?? [];
  const wiredMcp = config?.mcp_servers ?? [];
  const wiredTools = config?.tool_sets ?? [];

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-4" data-testid="inspector-wiring-panel">
      {/* Skills */}
      <WiringSection title="Skills" count={wiredSkills.length}>
        {(skills ?? []).length === 0 ? (
          <p className="text-[11px] text-[var(--text-muted)] italic">No skills installed.</p>
        ) : (
          (skills ?? []).map((skill) => (
            <WiringCheckItem
              key={skill.skill_id}
              id={skill.skill_id}
              label={skill.name ?? skill.skill_id}
              description={skill.description}
              checked={wiredSkills.includes(skill.skill_id)}
              onChange={() => handleToggle('skills', skill.skill_id)}
              testId={`wiring-skill-${skill.skill_id}`}
            />
          ))
        )}
      </WiringSection>

      {/* MCP Servers */}
      <WiringSection title="MCP Servers" count={wiredMcp.length}>
        {(mcpServers ?? []).length === 0 ? (
          <p className="text-[11px] text-[var(--text-muted)] italic">No MCP servers registered.</p>
        ) : (
          (mcpServers ?? []).map((server) => (
            <WiringCheckItem
              key={server.server_id}
              id={server.server_id}
              label={server.name}
              description={server.transport}
              checked={wiredMcp.includes(server.server_id)}
              onChange={() => handleToggle('mcp_servers', server.server_id)}
              testId={`wiring-mcp-${server.server_id}`}
            />
          ))
        )}
      </WiringSection>

      {/* Tool Sets */}
      <WiringSection title="Tool Sets" count={wiredTools.length}>
        {TOOL_SETS.map((ts) => (
          <WiringCheckItem
            key={ts.id}
            id={ts.id}
            label={ts.label}
            description={ts.description}
            checked={wiredTools.includes(ts.id)}
            onChange={() => handleToggle('tool_sets', ts.id)}
            testId={`wiring-toolset-${ts.id}`}
          />
        ))}
      </WiringSection>
    </div>
  );
}

function WiringSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          {title}
        </h4>
        {count > 0 && (
          <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-400">
            {count}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function WiringCheckItem({
  label,
  description,
  checked,
  onChange,
  testId,
}: {
  id?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  testId?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2 rounded-md p-2 transition-colors',
        checked ? 'bg-sky-500/10' : 'hover:bg-[var(--bg-hover)]',
      )}
      data-testid={testId}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-3.5 w-3.5 accent-sky-500"
        aria-label={label}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">{label}</p>
        {description && (
          <p className="text-[10px] text-[var(--text-muted)]">{description}</p>
        )}
      </div>
    </label>
  );
}

function MemoryPanelContent({ agentId }: { agentId: string }) {
  const { data: usage, isLoading } = useContextUsage(agentId);

  if (isLoading) return <PanelLoader />;

  const u = usage as { working_chars?: number; semantic_chars?: number; episodic_chars?: number } | undefined;
  const workingKB = Math.round((u?.working_chars ?? 0) / 1024);
  const semanticKB = Math.round((u?.semantic_chars ?? 0) / 1024);
  const episodicKB = Math.round((u?.episodic_chars ?? 0) / 1024);

  return (
    <div className="flex flex-col gap-4 p-4" data-testid="inspector-memory-panel">
      <div className="grid grid-cols-3 gap-2">
        <MemoryStat label="Working" value={`${workingKB} KB`} />
        <MemoryStat label="Semantic" value={`${semanticKB} KB`} />
        <MemoryStat label="Episodic" value={`${episodicKB} KB`} />
      </div>

      <a
        href={`/intelligence?agent=${agentId}`}
        className="flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        data-testid="open-intelligence-hub"
      >
        <ExternalLink size={12} />
        Open in Intelligence Hub
      </a>
    </div>
  );
}

function MemoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-[var(--bg-subtle)] p-2">
      <p className="text-[10px] text-[var(--text-muted)] uppercase">{label}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function PanelLoader() {
  return (
    <div className="flex h-32 items-center justify-center">
      <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// F24 — Skill detail panel
// ---------------------------------------------------------------------------

function SkillDetailPanel({ skillId }: { skillId: string }) {
  const { data: skills, isLoading } = useInstalledSkills();
  if (isLoading) return <PanelLoader />;
  const skill = (skills ?? []).find((s) => s.skill_id === skillId);
  if (!skill) return <p className="p-4 text-xs text-[var(--text-muted)]">Skill not found.</p>;
  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <p className="text-[10px] uppercase text-[var(--text-muted)]">Skill ID</p>
        <p className="text-xs font-mono text-[var(--text-secondary)]">{skill.skill_id}</p>
      </div>
      {skill.description && (
        <div>
          <p className="text-[10px] uppercase text-[var(--text-muted)]">Description</p>
          <p className="text-xs text-[var(--text-primary)]">{skill.description}</p>
        </div>
      )}
      <div className="flex gap-3">
        {skill.version && (
          <div>
            <p className="text-[10px] uppercase text-[var(--text-muted)]">Version</p>
            <p className="text-xs text-[var(--text-secondary)]">{skill.version}</p>
          </div>
        )}
        {skill.output_type && (
          <div>
            <p className="text-[10px] uppercase text-[var(--text-muted)]">Output</p>
            <span className="inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
              {skill.output_type}
            </span>
          </div>
        )}
        {skill.source && (
          <div>
            <p className="text-[10px] uppercase text-[var(--text-muted)]">Source</p>
            <p className="text-xs text-[var(--text-secondary)]">{skill.source}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// F25 — MCP server detail panel
// ---------------------------------------------------------------------------

function MCPDetailPanel({ serverId }: { serverId: string }) {
  const { data: servers, isLoading: serversLoading } = useMCPServers();
  const { data: tools, isLoading: toolsLoading } = useMCPServerTools(serverId);
  const server = (servers ?? []).find((s) => s.server_id === serverId);
  const loading = serversLoading || toolsLoading;
  if (loading) return <PanelLoader />;
  if (!server) return <p className="p-4 text-xs text-[var(--text-muted)]">Server not found.</p>;
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex gap-3">
        {server.transport && (
          <div>
            <p className="text-[10px] uppercase text-[var(--text-muted)]">Transport</p>
            <span className="inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
              {server.transport.toUpperCase()}
            </span>
          </div>
        )}
        {server.trust_tier && (
          <div>
            <p className="text-[10px] uppercase text-[var(--text-muted)]">Trust</p>
            <span className="inline-block rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] text-orange-400">
              {server.trust_tier}
            </span>
          </div>
        )}
      </div>

      {/* Tools list */}
      <div>
        <p className="mb-1.5 text-[10px] uppercase text-[var(--text-muted)]">Tools ({(tools ?? []).length})</p>
        {(tools ?? []).length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic">No tools exposed.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {(tools ?? []).map((t) => (
              <div key={t.name} className="rounded-md bg-[var(--bg-inset)] px-2 py-1.5">
                <p className="text-xs font-medium text-[var(--text-primary)]">{t.name}</p>
                {t.description && (
                  <p className="text-[10px] text-[var(--text-muted)]">{t.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// F29 — A2A external agent detail panel
// ---------------------------------------------------------------------------

function A2ADetailPanel({ agentId }: { agentId: string }) {
  const { data: agents, isLoading } = useA2AAgents();
  const [endpointEdit, setEndpointEdit] = useState('');
  const [showKey, setShowKey] = useState(false);

  const agent: A2AAgentEntry | undefined = (agents ?? []).find((a) => a.agent_id === agentId);

  useEffect(() => {
    if (agent?.endpoint) setEndpointEdit(agent.endpoint);
  }, [agent?.endpoint]);

  if (isLoading) return <PanelLoader />;
  if (!agent) return <p className="p-4 text-xs text-[var(--text-muted)]">External agent not found.</p>;

  const isRevoked = agent.trust_status === 'REVOKED';

  return (
    <div className="flex flex-col gap-4 p-4" data-testid="inspector-a2a-panel">
      {/* Trust status */}
      <div className="flex items-center gap-2">
        {isRevoked ? (
          <ShieldX size={14} className="text-red-400" />
        ) : (
          <ShieldCheck size={14} className="text-emerald-400" />
        )}
        <span
          className={cn(
            'rounded px-2 py-0.5 text-[11px] font-medium uppercase',
            isRevoked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400',
          )}
        >
          {agent.trust_status ?? 'ACTIVE'}
        </span>
      </div>

      {/* Endpoint URL */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase text-[var(--text-muted)]">Endpoint URL</label>
        <input
          type="text"
          className="h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-input)] px-2 text-[11px] font-mono text-[var(--text-primary)]"
          value={endpointEdit}
          onChange={(e) => setEndpointEdit(e.target.value)}
          placeholder="https://agent.example.com/a2a"
          data-testid="a2a-endpoint-input"
        />
      </div>

      {/* Auth key (masked) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase text-[var(--text-muted)]">Auth Key</label>
          <button
            onClick={() => setShowKey((v) => !v)}
            className="text-[10px] text-purple-400 hover:text-purple-300"
            data-testid="a2a-toggle-key"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <input
          type={showKey ? 'text' : 'password'}
          className="h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-input)] px-2 text-[11px] font-mono text-[var(--text-primary)]"
          defaultValue="••••••••••••••••"
          readOnly
          data-testid="a2a-key-input"
        />
        <button
          className="mt-0.5 self-start rounded border border-purple-500/40 px-2 py-0.5 text-[10px] text-purple-400 hover:bg-purple-500/10"
          data-testid="a2a-rotate-key-btn"
          onClick={() => toast.info('Key rotation not yet supported via canvas.')}
        >
          Rotate Key
        </button>
      </div>

      {/* Capabilities */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase text-[var(--text-muted)]">
          Capabilities ({(agent.capabilities ?? []).length})
        </label>
        {(agent.capabilities ?? []).length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic">No capabilities declared.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {(agent.capabilities ?? []).map((cap) => (
              <span
                key={cap}
                className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-300"
              >
                {cap}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PropertyInspector — main component (F16)
// ---------------------------------------------------------------------------

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'config', label: 'Config' },
  { id: 'wiring', label: 'Wiring' },
  { id: 'memory', label: 'Memory' },
];

export function PropertyInspector({ agentId, agentName, nodeType, onClose }: PropertyInspectorProps) {
  const [activeTab, setActiveTab] = useState<TabId>('config');

  // F24/F25/F29: if a resource or external node is selected, show detail view instead of agent tabs
  const isSkillNode = nodeType === 'skill';
  const isMCPNode = nodeType === 'mcp_server';
  const isA2ANode = nodeType === 'external_agent';
  const isResourceNode = isSkillNode || isMCPNode || isA2ANode;

  const headerIcon = isSkillNode ? (
    <Wand2 size={14} className="shrink-0 text-amber-400" />
  ) : isMCPNode ? (
    <Plug size={14} className="shrink-0 text-red-400" />
  ) : isA2ANode ? (
    <Globe size={14} className="shrink-0 text-purple-400" />
  ) : (
    <Brain size={14} className="shrink-0 text-sky-400" />
  );

  return (
    <aside
      className="flex h-full w-[300px] shrink-0 flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)]"
      data-testid="property-inspector"
      data-agent-id={agentId}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-3 py-2">
        {headerIcon}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{agentName}</p>
          <p className="truncate text-[10px] text-[var(--text-muted)]">{agentId}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            aria-label="Close inspector"
            data-testid="inspector-close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Resource detail (no tabs) */}
      {isResourceNode ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isSkillNode && <SkillDetailPanel skillId={agentId} />}
          {isMCPNode && <MCPDetailPanel serverId={agentId} />}
          {isA2ANode && <A2ADetailPanel agentId={agentId} />}
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-[var(--border-default)]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 py-2 text-[11px] font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-b-2 border-sky-400 text-sky-400'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                )}
                data-testid={`inspector-tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeTab === 'profile' && <ProfilePanel agentId={agentId} />}
            {activeTab === 'config' && <ConfigPanel agentId={agentId} />}
            {activeTab === 'wiring' && <WiringPanel agentId={agentId} />}
            {activeTab === 'memory' && <MemoryPanelContent agentId={agentId} />}
          </div>
        </>
      )}
    </aside>
  );
}
