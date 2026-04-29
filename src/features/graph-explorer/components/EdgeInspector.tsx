/**
 * Graph Explorer — Edge Inspector panel.
 *
 * Shown in the right panel when an edge is selected.
 * Displays edge type, source → target, typed properties.
 * Allows deleting the edge.
 */

import { X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import type { ExplorerEdge, ExplorerNode } from '../types';
import { EDGE_TYPE_CONFIG } from '../types';
import { useDeleteEdge } from '../hooks/useGraphMutations';

interface Props {
  edge: ExplorerEdge;
  allNodes: ExplorerNode[];
  onClose: () => void;
  onEdgeDeleted: () => void;
}

export function EdgeInspector({ edge, allNodes, onClose, onEdgeDeleted }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteEdge = useDeleteEdge();

  const getNodeLabel = (id: string) => {
    const n = allNodes.find((n) => n.id === id);
    if (!n) return id;
    return n.kind === 'resource' ? n.name : n.title;
  };

  const edgeCfg = EDGE_TYPE_CONFIG[edge.edge_type] ?? {
    color: '#94a3b8',
    lineStyle: 'solid',
    width: 1.5,
  };

  const handleDelete = () => {
    deleteEdge.mutate(edge.id, {
      onSuccess: () => {
        toast.success('Edge deleted');
        onEdgeDeleted();
      },
      onError: (err) => toast.error(`Delete failed: ${err.message}`),
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden" data-testid="edge-inspector">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-default)] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: edgeCfg.color }}
            />
            <span
              className="rounded bg-[var(--bg-inset)] px-2 py-0.5 text-xs font-semibold text-[var(--text-primary)]"
              data-testid="edge-type-label"
            >
              {edge.edge_type}
            </span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--text-tertiary)]">{edge.id}</div>
        </div>
        <button
          onClick={onClose}
          className="ml-2 rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
          data-testid="edge-inspector-close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Source → Target */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3">
          <div className="flex flex-col gap-2">
            <div>
              <div className="mb-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                Source
              </div>
              <div className="truncate text-xs font-medium text-[var(--text-primary)]">
                {getNodeLabel(edge.source)}
              </div>
              <div className="font-mono text-[9px] text-[var(--text-tertiary)]">{edge.source}</div>
            </div>
            <div
              className="my-1 flex items-center gap-2 text-xs text-[var(--text-tertiary)]"
            >
              <div className="h-px flex-1" style={{ backgroundColor: edgeCfg.color }} />
              <span style={{ color: edgeCfg.color }}>→ {edge.edge_type}</span>
              <div className="h-px flex-1" style={{ backgroundColor: edgeCfg.color }} />
            </div>
            <div>
              <div className="mb-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                Target
              </div>
              <div className="truncate text-xs font-medium text-[var(--text-primary)]">
                {getNodeLabel(edge.target)}
              </div>
              <div className="font-mono text-[9px] text-[var(--text-tertiary)]">{edge.target}</div>
            </div>
          </div>
        </div>

        {/* Type-specific properties */}
        {(edge.gate_type || edge.strength || edge.sequence_order != null || edge.note || edge.created_by) && (
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Properties
            </div>
            <div className="space-y-2">
              {edge.gate_type && (
                <PropRow label="Gate Type" value={edge.gate_type} />
              )}
              {edge.strength && (
                <PropRow label="Strength" value={edge.strength} />
              )}
              {edge.sequence_order != null && (
                <PropRow label="Sequence Order" value={String(edge.sequence_order)} />
              )}
              {edge.created_by && (
                <PropRow label="Created By" value={edge.created_by} />
              )}
              {edge.note && (
                <PropRow label="Note" value={edge.note} />
              )}
            </div>
          </div>
        )}

        {/* Visual indicator */}
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Visual Style
          </div>
          <div className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--bg-inset)] px-3 py-2">
            <svg width="48" height="12" xmlns="http://www.w3.org/2000/svg">
              <line
                x1="4"
                y1="6"
                x2="44"
                y2="6"
                stroke={edgeCfg.color}
                strokeWidth={edgeCfg.width}
                strokeDasharray={
                  edgeCfg.lineStyle === 'dashed'
                    ? '6 3'
                    : edgeCfg.lineStyle === 'dotted'
                      ? '2 3'
                      : undefined
                }
              />
              <polygon points="44,3 48,6 44,9" fill={edgeCfg.color} />
            </svg>
            <span className="text-xs text-[var(--text-secondary)]">
              {edgeCfg.lineStyle} · {edgeCfg.width}px
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--border-default)] px-4 py-3">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--state-blocked)] px-3 py-1.5 text-xs text-[var(--state-blocked)] hover:bg-[var(--state-blocked)]/10 transition-colors"
            data-testid="edge-delete"
          >
            <Trash2 size={12} />
            Delete Edge
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Delete this edge?</span>
            <button
              onClick={handleDelete}
              disabled={deleteEdge.isPending}
              className="rounded px-2 py-1 text-xs font-medium text-[var(--state-blocked)] hover:bg-[var(--state-blocked)]/10 disabled:opacity-50"
              data-testid="edge-delete-confirm"
            >
              {deleteEdge.isPending ? 'Deleting…' : 'Yes'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded px-2 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PropRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-[var(--text-tertiary)]">{label}</span>
      <span className="text-xs text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
