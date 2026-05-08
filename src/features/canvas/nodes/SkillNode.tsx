// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * SkillNode — Canvas node representing a skill wired to an agent (F12).
 *
 * Visual: 200px wide, amber accent, Zap icon.
 * Placed when a skill wiring edge is created from palette → agent.
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SkillNodeData {
  label: string;
  skillId: string;
  description?: string;
  version?: string;
  enabled?: boolean;
  agentId?: string; // which agent this skill is wired to
}

export const SkillNode = memo(function SkillNode({ data, selected }: NodeProps) {
  const d = data as unknown as SkillNodeData;

  return (
    <div
      className={cn(
        'relative w-[200px] rounded-lg border-2 bg-[var(--bg-surface)] shadow transition-shadow',
        d.enabled === false ? 'opacity-50' : '',
        selected
          ? 'border-amber-400 shadow-amber-400/20 shadow-lg'
          : 'border-amber-500/50 hover:border-amber-400',
      )}
      data-testid="skill-node"
      data-skill-id={d.skillId}
    >
      {/* Accent bar */}
      <div className="h-1 w-full rounded-t-lg bg-gradient-to-r from-amber-400 to-yellow-400" />

      {/* Content */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <Zap size={13} className="text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{d.label}</p>
          {d.version && (
            <p className="text-[10px] text-[var(--text-muted)]">v{d.version}</p>
          )}
        </div>
      </div>

      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!bg-amber-400 !w-2 !h-2 !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!bg-amber-400/60 !w-2 !h-2 !border-0"
      />
    </div>
  );
});
