// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * SubAgentNode — Canvas node representing a user-created sub-agent (F5).
 *
 * Visual: 220px wide, green (#10B981) accent, Bot icon.
 * Can be deleted (shows delete affordance when selected).
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubAgentNodeData {
  label: string;
  agentId: string;
  llmModel?: string;
  skillsCount?: number;
  mcpCount?: number;
  toolSetsCount?: number;
  status?: 'idle' | 'running' | 'blocked';
}

export const SubAgentNode = memo(function SubAgentNode({ data, selected }: NodeProps) {
  const d = data as unknown as SubAgentNodeData;
  const skillsCount = d.skillsCount ?? 0;
  const mcpCount = d.mcpCount ?? 0;
  const toolSetsCount = d.toolSetsCount ?? 0;

  const wiringSummary = [
    skillsCount > 0 && `${skillsCount} skill${skillsCount !== 1 ? 's' : ''}`,
    mcpCount > 0 && `${mcpCount} MCP`,
    toolSetsCount > 0 && `${toolSetsCount} tool set${toolSetsCount !== 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={cn(
        'relative w-[220px] rounded-xl border-2 bg-[var(--bg-surface)] shadow-md transition-shadow',
        selected
          ? 'border-emerald-400 shadow-emerald-400/20 shadow-lg'
          : 'border-emerald-600/60 hover:border-emerald-500',
      )}
      data-testid="sub-agent-node"
      data-agent-id={d.agentId}
    >
      {/* Accent bar */}
      <div className="h-1 w-full rounded-t-xl bg-gradient-to-r from-emerald-500 to-green-400" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <Bot size={14} className="text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-[var(--text-primary)]">{d.label}</div>
          <div className="text-[10px] text-[var(--text-tertiary)]">Sub-Agent</div>
        </div>
        {d.status === 'running' && (
          <Loader2 size={11} className="shrink-0 animate-spin text-emerald-400" />
        )}
        {d.status === 'idle' && (
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
        )}
        {d.status === 'blocked' && (
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
        )}
      </div>

      {/* LLM model badge */}
      {d.llmModel && (
        <div className="mx-3 mb-2">
          <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300">
            {d.llmModel.replace('claude-', '').replace('-20250514', '')}
          </span>
        </div>
      )}

      {/* Wiring summary */}
      <div className="border-t border-[var(--border-subtle)] px-3 py-2">
        <div className="text-[11px] text-[var(--text-tertiary)]">
          {wiringSummary || 'No capabilities wired'}
        </div>
      </div>

      {/* Handles */}
      {/* Top: target for delegation edge from orchestrator */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-delegation"
        className="!border-emerald-600 !bg-emerald-500/40"
        style={{ top: -6 }}
      />
      {/* Right: source for wiring edges to resources */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!border-emerald-600 !bg-emerald-400"
        style={{ right: -6 }}
      />
      {/* Left: target for wiring edges from resources */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!border-emerald-600 !bg-emerald-500/40"
        style={{ left: -6 }}
      />
    </div>
  );
});
