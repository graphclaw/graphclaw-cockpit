/**
 * Graph Explorer — Add Edge dialog.
 *
 * Select source node, target node, edge type + type-specific properties.
 * POSTs to /app/v1/graph/edges.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import type { ExplorerNode } from '../types';
import { ALL_EDGE_TYPES } from '../types';
import { useCreateEdge } from '../hooks/useGraphMutations';

interface Props {
  open: boolean;
  nodes: ExplorerNode[];
  onClose: () => void;
  onEdgeCreated: (id: string) => void;
}

const addEdgeSchema = z.object({
  source_id: z.string().min(1, 'Source node is required'),
  target_id: z.string().min(1, 'Target node is required'),
  edge_type: z.string().min(1, 'Edge type is required'),
  gate_type: z.string(),
  strength: z.string(),
  sequence_order: z.string(),
  note: z.string(),
});
type AddEdgeForm = z.infer<typeof addEdgeSchema>;

export function AddEdgeDialog({ open, nodes, onClose, onEdgeCreated }: Props) {
  const createEdge = useCreateEdge();
  const [search, setSearch] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddEdgeForm>({
    resolver: zodResolver(addEdgeSchema),
    defaultValues: {
      edge_type: 'DEPENDS_ON',
      gate_type: '',
      strength: '',
      sequence_order: '',
      note: '',
    },
  });

  const edgeType = watch('edge_type');

  const handleClose = () => {
    reset();
    setSearch('');
    onClose();
  };

  const onSubmit = (data: AddEdgeForm) => {
    if (data.source_id === data.target_id) {
      toast.error('Source and target must be different nodes');
      return;
    }

    const metadata: Record<string, unknown> = {};
    if (data.gate_type) metadata.gate_type = data.gate_type;
    if (data.strength) metadata.strength = data.strength;
    if (data.sequence_order) metadata.sequence_order = Number(data.sequence_order);
    if (data.note) metadata.note = data.note;

    createEdge.mutate(
      {
        source_id: data.source_id,
        target_id: data.target_id,
        edge_type: data.edge_type,
        metadata: Object.keys(metadata).length > 0 ? metadata as Parameters<typeof createEdge.mutate>[0]['metadata'] : undefined,
      },
      {
        onSuccess: (created) => {
          toast.success(`Edge ${data.edge_type} created`);
          handleClose();
          onEdgeCreated(created.edge_id);
        },
        onError: (err) => toast.error(`Failed to create edge: ${err.message}`),
      },
    );
  };

  const getNodeLabel = (n: ExplorerNode) =>
    n.kind === 'resource' ? n.name : n.title;

  const filteredNodes = search
    ? nodes.filter((n) =>
        getNodeLabel(n).toLowerCase().includes(search.toLowerCase()) ||
        n.id.toLowerCase().includes(search.toLowerCase()),
      )
    : nodes;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={handleClose}
        data-testid="add-edge-backdrop"
      />
      <div
        className="fixed left-1/2 top-[15%] z-50 w-full max-w-md -translate-x-1/2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-4)]"
        data-testid="add-edge-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Add Edge</h2>
          <button
            onClick={handleClose}
            className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-inset)]"
          >
            <X size={14} />
          </button>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className="px-4 py-4 space-y-3"
        >
          {/* Source */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
              Source Node *
            </label>
            <select
              {...register('source_id')}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              data-testid="edge-source"
            >
              <option value="">Select source node…</option>
              {filteredNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  [{n.kind.toUpperCase()}] {getNodeLabel(n)}
                </option>
              ))}
            </select>
            {errors.source_id && (
              <p className="mt-0.5 text-[10px] text-[var(--state-blocked)]">
                {errors.source_id.message}
              </p>
            )}
          </div>

          {/* Target */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
              Target Node *
            </label>
            <select
              {...register('target_id')}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              data-testid="edge-target"
            >
              <option value="">Select target node…</option>
              {filteredNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  [{n.kind.toUpperCase()}] {getNodeLabel(n)}
                </option>
              ))}
            </select>
            {errors.target_id && (
              <p className="mt-0.5 text-[10px] text-[var(--state-blocked)]">
                {errors.target_id.message}
              </p>
            )}
          </div>

          {/* Edge type */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
              Edge Type *
            </label>
            <select
              {...register('edge_type')}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              data-testid="edge-type"
            >
              {ALL_EDGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional properties */}
          {edgeType === 'DEPENDS_ON' && (
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
                Gate Type
              </label>
              <select
                {...register('gate_type')}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                data-testid="edge-gate-type"
              >
                <option value="">Not specified</option>
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
          )}

          {edgeType === 'BLOCKS' && (
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
                Strength
              </label>
              <select
                {...register('strength')}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                data-testid="edge-strength"
              >
                <option value="">Not specified</option>
                <option value="HARD">HARD</option>
                <option value="SOFT">SOFT</option>
              </select>
            </div>
          )}

          {edgeType === 'PART_OF' && (
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
                Sequence Order
              </label>
              <input
                {...register('sequence_order')}
                type="number"
                min={0}
                placeholder="e.g. 1"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                data-testid="edge-sequence"
              />
            </div>
          )}

          {/* Note */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
              Note (optional)
            </label>
            <input
              {...register('note')}
              type="text"
              placeholder="Optional note"
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none"
              data-testid="edge-note"
            />
          </div>

          {/* Node search helper */}
          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">
              Filter nodes in dropdowns
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes by title or ID…"
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none"
              data-testid="edge-node-search"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEdge.isPending}
              className="rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-primary-hover)] disabled:opacity-40 transition-colors"
              data-testid="add-edge-submit"
            >
              {createEdge.isPending ? 'Creating…' : 'Create Edge'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
