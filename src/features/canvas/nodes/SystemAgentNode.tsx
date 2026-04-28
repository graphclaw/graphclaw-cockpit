/**
 * SystemAgentNode — Canvas node for read-only system agents (F26).
 *
 * Visual: 200px wide, gray accent, Shield icon, dimmed/read-only appearance.
 * Not selectable for PropertyInspector; not deletable.
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SystemAgentNodeData {
  label: string;
  agentId: string;
  description?: string;
}

export const SystemAgentNode = memo(function SystemAgentNode({ data, selected }: NodeProps) {
  const d = data as unknown as SystemAgentNodeData;

  return (
    <div
      className={cn(
        'relative w-[200px] rounded-xl border-2 bg-[var(--bg-surface)] opacity-60 shadow-sm transition-shadow',
        selected
          ? 'border-gray-400 shadow-gray-400/20 shadow-lg'
          : 'border-gray-600/50 hover:border-gray-500',
      )}
      data-testid="system-agent-node"
      data-agent-id={d.agentId}
    >
      {/* Accent bar */}
      <div className="h-1 w-full rounded-t-xl bg-gradient-to-r from-gray-500 to-gray-600" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-500/20">
          <Shield size={14} className="text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-[var(--text-secondary)]">{d.label}</div>
          <div className="text-[10px] text-[var(--text-tertiary)]">System Agent</div>
        </div>
      </div>

      {/* Read-only badge */}
      <div className="border-t border-[var(--border-subtle)] px-3 py-1.5">
        <span className="rounded bg-gray-500/20 px-1.5 py-0.5 text-[9px] text-gray-400 uppercase tracking-wide">
          Read-only
        </span>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top-delegation" className="!bg-gray-500" />
      <Handle type="source" position={Position.Bottom} id="bottom-delegation" className="!bg-gray-500" />
    </div>
  );
});
