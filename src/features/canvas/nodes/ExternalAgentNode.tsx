/**
 * ExternalAgentNode — Canvas node for A2A-registered external agents (F27).
 *
 * Visual: 220px wide, purple (#A855F7) accent, Globe icon, dotted border.
 * Read-only link: no delegation/wiring handles outgoing from this node.
 * Handle: Top only (target for A2A link from orchestrator).
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Globe, ShieldCheck, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExternalAgentNodeData {
  label: string;
  agentId: string;
  endpoint?: string;
  capabilities?: string[];
  trustStatus?: 'ACTIVE' | 'REVOKED' | string;
}

export const ExternalAgentNode = memo(function ExternalAgentNode({
  data,
  selected,
}: NodeProps) {
  const d = data as unknown as ExternalAgentNodeData;
  const isRevoked = d.trustStatus === 'REVOKED';

  // Mask endpoint: show only the host portion
  const maskedEndpoint = d.endpoint
    ? (() => {
        try {
          const url = new URL(d.endpoint);
          return `${url.protocol}//${url.host}/***`;
        } catch {
          return d.endpoint.slice(0, 30) + '…';
        }
      })()
    : null;

  return (
    <div
      className={cn(
        'relative w-[220px] rounded-xl border-2 bg-[var(--bg-surface)] shadow-md transition-shadow',
        isRevoked
          ? 'border-dashed border-red-500/50 opacity-60'
          : selected
            ? 'border-dashed border-purple-400 shadow-purple-400/20 shadow-xl'
            : 'border-dashed border-purple-500/60 hover:border-purple-400',
      )}
      data-testid="external-agent-node"
      data-agent-id={d.agentId}
    >
      {/* Top handle: target for A2A link from orchestrator */}
      <Handle
        id="top-a2a"
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-purple-400 !bg-[var(--bg-surface)]"
      />

      {/* Accent bar */}
      <div className="h-1 w-full rounded-t-xl bg-gradient-to-r from-purple-500 to-fuchsia-500" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
          <Globe size={15} className="text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{d.label}</div>
          <div className="text-[10px] text-[var(--text-tertiary)]">External Agent (A2A)</div>
        </div>
        {isRevoked ? (
          <ShieldX size={12} className="shrink-0 text-red-400" />
        ) : (
          <ShieldCheck size={12} className="shrink-0 text-purple-400" />
        )}
      </div>

      {/* Endpoint (masked) */}
      {maskedEndpoint && (
        <div className="mx-3 mb-2">
          <span className="block truncate rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-mono text-purple-300">
            {maskedEndpoint}
          </span>
        </div>
      )}

      {/* Trust status + capabilities */}
      <div className="flex flex-wrap items-center gap-1 px-3 pb-3">
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[9px] font-medium uppercase',
            isRevoked
              ? 'bg-red-500/20 text-red-400'
              : 'bg-emerald-500/20 text-emerald-400',
          )}
        >
          {d.trustStatus ?? 'ACTIVE'}
        </span>
        {(d.capabilities ?? []).slice(0, 3).map((cap) => (
          <span
            key={cap}
            className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] text-purple-300"
          >
            {cap}
          </span>
        ))}
        {(d.capabilities?.length ?? 0) > 3 && (
          <span className="text-[9px] text-[var(--text-muted)]">
            +{(d.capabilities?.length ?? 0) - 3} more
          </span>
        )}
      </div>
    </div>
  );
});
