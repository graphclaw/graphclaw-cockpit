// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * NodePalette — Agent-centric canvas palette (F7 rewrite).
 *
 * AGENTS section: lists all agents (orchestrator, sub-agents, system)
 * RESOURCES section: Skills, MCP Servers, Tool Sets with wired checkmarks
 */
import { useState } from 'react';
import {
  Brain,
  Bot,
  Shield,
  Globe,
  Wand2,
  Plug,
  Package,
  ChevronDown,
  ChevronRight,
  Check,
  Plus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInstalledSkills, useMCPServers } from './hooks/useCanvasApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaletteAgent {
  agent_id: string;
  name: string;
  type: 'orchestrator' | 'sub_agent' | 'system' | 'a2a';
}

const TOOL_SETS = [
  { id: 'task_management', name: 'Task Management', tools: 4 },
  { id: 'planning', name: 'Planning', tools: 3 },
  { id: 'skills', name: 'Skills', tools: 2 },
  { id: 'mcp', name: 'MCP', tools: 2 },
  { id: 'delegation', name: 'Delegation', tools: 3 },
];

interface NodePaletteProps {
  agents: PaletteAgent[];
  selectedAgentId: string | null;
  wiredSkills: string[];
  wiredMcpServers: string[];
  wiredToolSets: string[];
  onAgentClick: (agentId: string) => void;
  onAddAgent: () => void;
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

function PaletteSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        {title}
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NodePalette
// ---------------------------------------------------------------------------

export function NodePalette({
  agents,
  selectedAgentId,
  wiredSkills,
  wiredMcpServers,
  wiredToolSets,
  onAgentClick,
  onAddAgent,
}: NodePaletteProps) {
  const { data: skills, isLoading: skillsLoading } = useInstalledSkills();
  const { data: mcpServers, isLoading: mcpLoading } = useMCPServers();

  const orchestrators = agents.filter((a) => a.type === 'orchestrator');
  const subAgents = agents.filter((a) => a.type === 'sub_agent');
  const systemAgents = agents.filter((a) => a.type === 'system');
  const a2aAgents = agents.filter((a) => a.type === 'a2a');

  return (
    <div className="hidden w-[220px] shrink-0 flex-col gap-2 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 lg:flex">
      {/* Add Agent button */}
      <button
        onClick={onAddAgent}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-400 transition-colors"
        data-testid="add-agent-button"
      >
        <Plus size={14} />
        Add Agent
      </button>

      {/* AGENTS section */}
      <PaletteSection title="Agents">
        {orchestrators.map((a) => (
          <button
            key={a.agent_id}
            onClick={() => onAgentClick(a.agent_id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs transition-colors',
              selectedAgentId === a.agent_id
                ? 'bg-sky-500/20 text-sky-300'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]',
            )}
          >
            <Brain size={12} className="shrink-0 text-sky-400" />
            <span className="flex-1 truncate">{a.name}</span>
            <span className="rounded bg-sky-500/20 px-1 text-[9px] text-sky-400">ORCH</span>
          </button>
        ))}

        {subAgents.map((a) => (
          <button
            key={a.agent_id}
            onClick={() => onAgentClick(a.agent_id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs transition-colors',
              selectedAgentId === a.agent_id
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]',
            )}
          >
            <Bot size={12} className="shrink-0 text-emerald-400" />
            <span className="flex-1 truncate">{a.name}</span>
          </button>
        ))}

        {a2aAgents.map((a) => (
          <button
            key={a.agent_id}
            onClick={() => onAgentClick(a.agent_id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs transition-colors',
              selectedAgentId === a.agent_id
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]',
            )}
          >
            <Globe size={12} className="shrink-0 text-purple-400" />
            <span className="flex-1 truncate">{a.name}</span>
            <span className="rounded bg-purple-500/20 px-1 text-[9px] text-purple-400">A2A</span>
          </button>
        ))}

        {systemAgents.map((a) => (
          <button
            key={a.agent_id}
            onClick={() => onAgentClick(a.agent_id)}
            className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs opacity-60 hover:opacity-80 transition-opacity text-[var(--text-tertiary)] hover:bg-[var(--bg-inset)]"
          >
            <Shield size={12} className="shrink-0 text-gray-400" />
            <span className="flex-1 truncate">{a.name}</span>
            <span className="rounded bg-gray-500/20 px-1 text-[9px] text-gray-400">SYS</span>
          </button>
        ))}

        {agents.length === 0 && (
          <p className="px-2 py-1 text-[11px] text-[var(--text-tertiary)]">No agents yet</p>
        )}
      </PaletteSection>

      {/* RESOURCES section */}
      <PaletteSection title="Resources">
        {/* Skills */}
        <PaletteSection title="Skills" defaultOpen={false}>
          {skillsLoading && (
            <div className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--text-tertiary)]">
              <Loader2 size={10} className="animate-spin" /> Loading…
            </div>
          )}
          {skills?.map((s) => (
            <div
              key={s.skill_id}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--text-secondary)]"
            >
              <Wand2 size={11} className="shrink-0 text-amber-400" />
              <span className="flex-1 truncate">{s.name}</span>
              {wiredSkills.includes(s.skill_id) && (
                <Check size={10} className="shrink-0 text-emerald-400" />
              )}
            </div>
          ))}
          {!skillsLoading && (!skills || skills.length === 0) && (
            <p className="px-2 py-1 text-[11px] text-[var(--text-tertiary)]">No skills installed</p>
          )}
        </PaletteSection>

        {/* MCP Servers */}
        <PaletteSection title="MCP Servers" defaultOpen={false}>
          {mcpLoading && (
            <div className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--text-tertiary)]">
              <Loader2 size={10} className="animate-spin" /> Loading…
            </div>
          )}
          {mcpServers?.map((s) => (
            <div
              key={s.server_id}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--text-secondary)]"
            >
              <Plug size={11} className="shrink-0 text-red-400" />
              <span className="flex-1 truncate">{s.name}</span>
              {wiredMcpServers.includes(s.server_id) && (
                <Check size={10} className="shrink-0 text-emerald-400" />
              )}
            </div>
          ))}
          {!mcpLoading && (!mcpServers || mcpServers.length === 0) && (
            <p className="px-2 py-1 text-[11px] text-[var(--text-tertiary)]">No MCP servers</p>
          )}
        </PaletteSection>

        {/* Tool Sets */}
        <PaletteSection title="Tool Sets" defaultOpen={false}>
          {TOOL_SETS.map((ts) => (
            <div
              key={ts.id}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--text-secondary)]"
            >
              <Package size={11} className="shrink-0 text-blue-400" />
              <span className="flex-1 truncate">{ts.name}</span>
              {wiredToolSets.includes(ts.id) && (
                <Check size={10} className="shrink-0 text-emerald-400" />
              )}
            </div>
          ))}
        </PaletteSection>
      </PaletteSection>
    </div>
  );
}
