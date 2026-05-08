// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * OrchestratorNode — Canvas node representing the main orchestrator agent (F4).
 *
 * Visual: 280px wide, cyan (#0EA5E9) accent, crown/brain icon.
 * Cannot be deleted. Always present at canvas top.
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OrchestratorNodeData {
  label: string;
  agentId: string;
  llmModel?: string;
  skillsCount?: number;
  mcpCount?: number;
  toolSetsCount?: number;
  subAgentsCount?: number;
  isSelected?: boolean;
  status?: 'idle' | 'running' | 'blocked';
}

export const OrchestratorNode = memo(function OrchestratorNode({
  data,
  selected,
}: NodeProps) {
  const d = data as unknown as OrchestratorNodeData;
  const skillsCount = d.skillsCount ?? 0;
  const mcpCount = d.mcpCount ?? 0;
  const toolSetsCount = d.toolSetsCount ?? 0;
  const subAgentsCount = d.subAgentsCount ?? 0;

  const wiringSummary = [
    skillsCount > 0 && `${skillsCount} skill${skillsCount !== 1 ? 's' : ''}`,
    mcpCount > 0 && `${mcpCount} MCP`,
    toolSetsCount > 0 && `${toolSetsCount} tool set${toolSetsCount !== 1 ? 's' : ''}`,
    subAgentsCount > 0 && `${subAgentsCount} sub-agent${subAgentsCount !== 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={cn(
        'relative w-[280px] rounded-xl border-2 bg-[var(--bg-surface)] shadow-lg transition-shadow',
        selected
          ? 'border-sky-400 shadow-sky-400/20 shadow-xl'
          : 'border-sky-500/60 hover:border-sky-400',
      )}
      data-testid="orchestrator-node"
    >
      {/* Accent bar */}
      <div className="h-1 w-full rounded-t-xl bg-gradient-to-r from-sky-400 to-cyan-400" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/20">
          <Brain size={16} className="text-sky-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{d.label}</div>
          <div className="text-[10px] text-[var(--text-tertiary)]">Orchestrator</div>
        </div>
        {d.status === 'running' && (
          <Loader2 size={12} className="shrink-0 animate-spin text-sky-400" />
        )}
        {d.status === 'idle' && (
          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
        )}
      </div>

      {/* LLM model badge */}
      {d.llmModel && (
        <div className="mx-3 mb-2">
          <span className="inline-block rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-mono text-sky-300">
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
      {/* Left: skill/MCP/toolset wiring sources */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!border-sky-500 !bg-sky-400"
        style={{ right: -6 }}
      />
      {/* Bottom: delegation to sub-agents */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-delegation"
        className="!border-sky-500 !bg-sky-400"
        style={{ bottom: -6 }}
      />
      {/* Left: A2A incoming */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!border-sky-500 !bg-sky-500/40"
        style={{ left: -6 }}
      />
    </div>
  );
});
