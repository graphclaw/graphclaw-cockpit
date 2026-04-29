/**
 * Graph Explorer — Node Inspector panel.
 *
 * Shown in the right panel when a node is selected.
 * Renders editable form for Tasks, Goals, Resources, Constraints.
 * Shows 7-factor scoring grid for tasks.
 * Shows outgoing/incoming edge list.
 */

import { useEffect, useState } from 'react';
import { X, ExternalLink, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { ExplorerNode, ExplorerEdge, TaskScoring } from '../types';
import { useUpdateTask, useDeleteTask } from '../hooks/useGraphMutations';
import { useNodeEdges } from '../hooks/useGraphExplorerData';

interface Props {
  node: ExplorerNode;
  allNodes: ExplorerNode[];
  allEdges: ExplorerEdge[];
  onClose: () => void;
  onNodeDeleted: () => void;
}

export function NodeInspector({ node, allNodes, allEdges: _allEdges, onClose, onNodeDeleted }: Props) {
  // ── Edge data ────────────────────────────────────────────────────────────
  const { data: nodeEdgesData } = useNodeEdges(node.id);
  const nodeEdges = nodeEdgesData?.items ?? [];

  const outgoing = nodeEdges.filter((e) => e.source_id === node.id);
  const incoming = nodeEdges.filter((e) => e.target_id === node.id);

  const getNodeTitle = (id: string) => {
    const n = allNodes.find((n) => n.id === id);
    if (!n) return id;
    return n.kind === 'resource' ? n.name : n.title;
  };

  // ── Edit state ────────────────────────────────────────────────────────────
  const [dirty, setDirty] = useState(false);
  const [title, setTitle] = useState('');
  const [state, setState] = useState('');
  const [priority, setPriority] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (node.kind === 'task') {
      setTitle(node.title);
      setState(node.state);
      setPriority(node.priority);
      setDeadline(node.deadline?.slice(0, 10) ?? '');
      setDescription(node.description ?? '');
    } else if (node.kind === 'goal') {
      setTitle(node.title);
      setState(node.state);
      setPriority(node.priority);
      setDescription(node.description ?? '');
    }
    setDirty(false);
  }, [node]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleApply = () => {
    if (node.kind !== 'task') return;
    updateTask.mutate(
      {
        id: node.id,
        title: title || undefined,
        state: state || undefined,
        priority: priority || undefined,
        deadline: deadline || null,
        description: description || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Task updated');
          setDirty(false);
        },
        onError: (err) => toast.error(`Update failed: ${err.message}`),
      },
    );
  };

  const handleDelete = () => {
    if (node.kind !== 'task') return;
    deleteTask.mutate(node.id, {
      onSuccess: () => {
        toast.success('Task deleted');
        onNodeDeleted();
      },
      onError: (err) => toast.error(`Delete failed: ${err.message}`),
    });
  };

  const copyId = async () => {
    await navigator.clipboard.writeText(node.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const label = node.kind === 'resource' ? node.name : node.title;

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      data-testid="node-inspector"
    >
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-default)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase text-white"
              style={{ backgroundColor: KIND_COLOR[node.kind] }}
            >
              {node.kind}
            </span>
          </div>
          <h3
            className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]"
            title={label}
          >
            {label}
          </h3>
          <div className="mt-0.5 flex items-center gap-1">
            <span className="font-mono text-[10px] text-[var(--text-tertiary)]">{node.id}</span>
            <button
              onClick={() => void copyId()}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              title="Copy ID"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
          data-testid="inspector-close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Task / Goal editable fields */}
        {(node.kind === 'task' || node.kind === 'goal') && (
          <div className="space-y-3">
            <Field label="Title">
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                data-testid="inspector-title"
              />
            </Field>

            <Field label="State">
              <select
                value={state}
                onChange={(e) => { setState(e.target.value); setDirty(true); }}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                data-testid="inspector-state"
              >
                {(node.kind === 'task' ? TASK_STATE_OPTIONS : GOAL_STATE_OPTIONS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => { setPriority(e.target.value); setDirty(true); }}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                data-testid="inspector-priority"
              >
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>

            {node.kind === 'task' && (
              <Field label="Deadline">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => { setDeadline(e.target.value); setDirty(true); }}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
                  data-testid="inspector-deadline"
                />
              </Field>
            )}

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
                rows={3}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none resize-none"
                data-testid="inspector-description"
              />
            </Field>

            {node.kind === 'task' && node.task_type && (
              <Field label="Task Type">
                <span className="text-xs text-[var(--text-secondary)]">{node.task_type}</span>
              </Field>
            )}
          </div>
        )}

        {/* Resource fields (read-only) */}
        {node.kind === 'resource' && (
          <div className="space-y-2">
            <Field label="Resource Type">
              <span className="text-xs text-[var(--text-secondary)]">{node.resource_type}</span>
            </Field>
            {node.reliability !== null && node.reliability !== undefined && (
              <Field label="Reliability">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-[var(--bg-inset)]">
                    <div
                      className="h-full rounded-full bg-[var(--state-progress)]"
                      style={{ width: `${Math.round((node.reliability ?? 0) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {Math.round((node.reliability ?? 0) * 100)}%
                  </span>
                </div>
              </Field>
            )}
          </div>
        )}

        {/* 7-factor scoring grid (tasks only) */}
        {node.kind === 'task' && node.scoring && (
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Priority Scoring
            </div>
            <ScoringGrid scoring={node.scoring} />
          </div>
        )}

        {/* Edges */}
        {nodeEdges.length > 0 && (
          <div>
            {outgoing.length > 0 && (
              <div className="mb-3">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Outgoing ({outgoing.length})
                </div>
                <div className="space-y-1">
                  {outgoing.slice(0, 6).map((e) => (
                    <EdgeRow
                      key={e.edge_id}
                      label={`→ ${getNodeTitle(e.target_id)}`}
                      type={e.edge_type}
                    />
                  ))}
                  {outgoing.length > 6 && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      +{outgoing.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
            {incoming.length > 0 && (
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Incoming ({incoming.length})
                </div>
                <div className="space-y-1">
                  {incoming.slice(0, 6).map((e) => (
                    <EdgeRow
                      key={e.edge_id}
                      label={`← ${getNodeTitle(e.source_id)}`}
                      type={e.edge_type}
                    />
                  ))}
                  {incoming.length > 6 && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      +{incoming.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--border-default)] px-4 py-3">
        {/* Open detail link */}
        {(node.kind === 'task') && (
          <a
            href={`/tasks/${node.id}`}
            className="mb-3 flex items-center gap-1.5 text-xs text-[var(--brand-primary)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={11} />
            Open Full Detail
          </a>
        )}

        <div className="flex items-center gap-2">
          {node.kind === 'task' && (
            <>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--state-blocked)] px-3 py-1.5 text-xs text-[var(--state-blocked)] hover:bg-[var(--state-blocked)]/10 transition-colors"
                  data-testid="inspector-delete"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--text-secondary)]">Confirm?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleteTask.isPending}
                    className="rounded px-2 py-1 text-xs font-medium text-[var(--state-blocked)] hover:bg-[var(--state-blocked)]/10 disabled:opacity-50"
                    data-testid="inspector-delete-confirm"
                  >
                    {deleteTask.isPending ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded px-2 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          {(node.kind === 'task' || node.kind === 'goal') && (
            <button
              onClick={handleApply}
              disabled={!dirty || updateTask.isPending}
              className="ml-auto rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              data-testid="inspector-apply"
            >
              {updateTask.isPending ? 'Saving…' : 'Apply Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-medium text-[var(--text-tertiary)]">{label}</div>
      {children}
    </div>
  );
}

function EdgeRow({ label, type }: { label: string; type: string }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--bg-inset)] px-2 py-1">
      <span className="truncate text-[10px] text-[var(--text-secondary)]">{label}</span>
      <span className="ml-2 shrink-0 rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--text-tertiary)]">
        {type}
      </span>
    </div>
  );
}

function ScoringGrid({ scoring }: { scoring: TaskScoring }) {
  const factors: { key: keyof TaskScoring; label: string }[] = [
    { key: 'timeline_urgency', label: 'Timeline' },
    { key: 'dependency_weight', label: 'Dependency' },
    { key: 'critical_path', label: 'Crit. Path' },
    { key: 'blocker', label: 'Blocker' },
    { key: 'human_override', label: 'Override' },
    { key: 'resource_risk', label: 'Res. Risk' },
    { key: 'constraint_pressure', label: 'Constraint' },
  ];

  return (
    <div className="space-y-1.5">
      {factors.map(({ key, label }) => {
        const val = scoring[key] ?? 0;
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[10px] text-[var(--text-tertiary)]">{label}</span>
            <div className="h-1.5 flex-1 rounded-full bg-[var(--bg-inset)]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, val) * 100)}%`,
                  backgroundColor:
                    val >= 0.7
                      ? 'var(--state-blocked)'
                      : val >= 0.4
                        ? 'var(--state-delayed)'
                        : 'var(--state-progress)',
                }}
              />
            </div>
            <span className="w-8 text-right text-[10px] tabular-nums text-[var(--text-secondary)]">
              {val.toFixed(2)}
            </span>
          </div>
        );
      })}
      <div className="mt-2 flex items-center justify-between rounded bg-[var(--bg-inset)] px-2 py-1.5">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Priority Score</span>
        <span className="text-sm font-semibold text-[var(--brand-primary)]">
          {(scoring.computed_priority ?? 0).toFixed(3)}
        </span>
      </div>
    </div>
  );
}

const KIND_COLOR: Record<string, string> = {
  task: '#3b82f6',
  goal: '#10b981',
  resource: '#06b6d4',
  constraint: '#f59e0b',
};

const TASK_STATE_OPTIONS = [
  'ACTIVE', 'IN_PROGRESS', 'BLOCKED', 'DELAYED', 'PENDING',
  'COMPLETE', 'CANCELLED', 'SNOOZED', 'NEEDS_REVIEW', 'INACTIVE_PENDING',
];

const GOAL_STATE_OPTIONS = ['ACTIVE', 'IN_PROGRESS', 'COMPLETE', 'ARCHIVED'];
