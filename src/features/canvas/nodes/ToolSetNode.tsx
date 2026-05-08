// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * ToolSetNode — Canvas node representing a tool set wired to an agent (F14).
 *
 * Visual: 200px wide, teal accent, Package icon.
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolSetNodeData {
  label: string;
  toolSetId: string;
  description?: string;
  agentId?: string;
}

const TOOL_SET_DESCRIPTIONS: Record<string, string> = {
  task_management: 'Create, update, delete tasks',
  planning: 'Break down and schedule goals',
  skills: 'Discover and invoke skills',
  mcp: 'Call MCP server tools',
  delegation: 'Delegate to sub-agents',
};

export const ToolSetNode = memo(function ToolSetNode({ data, selected }: NodeProps) {
  const d = data as unknown as ToolSetNodeData;
  const description = d.description ?? TOOL_SET_DESCRIPTIONS[d.toolSetId] ?? '';

  return (
    <div
      className={cn(
        'relative w-[200px] rounded-lg border-2 bg-[var(--bg-surface)] shadow transition-shadow',
        selected
          ? 'border-teal-400 shadow-teal-400/20 shadow-lg'
          : 'border-teal-500/50 hover:border-teal-400',
      )}
      data-testid="tool-set-node"
      data-toolset-id={d.toolSetId}
    >
      {/* Accent bar */}
      <div className="h-1 w-full rounded-t-lg bg-gradient-to-r from-teal-500 to-emerald-400" />

      {/* Content */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/20">
          <Package size={13} className="text-teal-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{d.label}</p>
          {description && (
            <p className="truncate text-[10px] text-[var(--text-muted)]">{description}</p>
          )}
        </div>
      </div>

      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!bg-teal-400 !w-2 !h-2 !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!bg-teal-400/60 !w-2 !h-2 !border-0"
      />
    </div>
  );
});
