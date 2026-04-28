/**
 * MCPServerNode — Canvas node representing a registered MCP server (F13).
 *
 * Visual: 200px wide, violet accent, Server icon.
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Server } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MCPServerNodeData {
  label: string;
  serverId: string;
  transport?: string;
  trustTier?: string;
  enabled?: boolean;
  agentId?: string;
}

export const MCPServerNode = memo(function MCPServerNode({ data, selected }: NodeProps) {
  const d = data as unknown as MCPServerNodeData;
  const trustColor =
    d.trustTier === 'AUTO'
      ? 'text-green-400'
      : d.trustTier === 'BLOCKED'
        ? 'text-red-400'
        : 'text-violet-300';

  return (
    <div
      className={cn(
        'relative w-[200px] rounded-lg border-2 bg-[var(--bg-surface)] shadow transition-shadow',
        d.enabled === false ? 'opacity-50' : '',
        selected
          ? 'border-violet-400 shadow-violet-400/20 shadow-lg'
          : 'border-violet-500/50 hover:border-violet-400',
      )}
      data-testid="mcp-server-node"
      data-server-id={d.serverId}
    >
      {/* Accent bar */}
      <div className="h-1 w-full rounded-t-lg bg-gradient-to-r from-violet-500 to-purple-400" />

      {/* Content */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
          <Server size={13} className="text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{d.label}</p>
          {d.trustTier && (
            <p className={cn('text-[10px]', trustColor)}>{d.trustTier}</p>
          )}
        </div>
      </div>

      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!bg-violet-400 !w-2 !h-2 !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!bg-violet-400/60 !w-2 !h-2 !border-0"
      />
    </div>
  );
});
