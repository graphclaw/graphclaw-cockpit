/**
 * Graph Explorer — floating toolbar above the canvas.
 * Mode toggle (Select / Pan), Add Node, Add Edge, Show Labels, Layout select, Fit.
 */

import { MousePointer2, Hand, Plus, GitBranch, Tag, LayoutGrid, Maximize2, RefreshCw } from 'lucide-react';
import type { InteractionMode, LayoutName } from '../types';
import { LAYOUT_OPTIONS } from '../types';

interface Props {
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  layout: LayoutName;
  onLayoutChange: (layout: LayoutName) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  onAddNode: () => void;
  onAddEdge: () => void;
  onFit: () => void;
  onRefresh: () => void;
}

export function GraphExplorerToolbar({
  mode,
  onModeChange,
  layout,
  onLayoutChange,
  showLabels,
  onToggleLabels,
  onAddNode,
  onAddEdge,
  onFit,
  onRefresh,
}: Props) {
  return (
    <div
      className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 shadow-[var(--shadow-3)]"
      data-testid="graph-explorer-toolbar"
    >
      {/* Mode toggle */}
      <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-0.5">
        <ToolbarButton
          active={mode === 'select'}
          onClick={() => onModeChange('select')}
          title="Select mode (S)"
          data-testid="toolbar-select"
        >
          <MousePointer2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={mode === 'pan'}
          onClick={() => onModeChange('pan')}
          title="Pan mode (P)"
          data-testid="toolbar-pan"
        >
          <Hand size={14} />
        </ToolbarButton>
      </div>

      <Divider />

      {/* Add buttons */}
      <ToolbarButton onClick={onAddNode} title="Add node" data-testid="toolbar-add-node">
        <Plus size={14} />
        <span className="text-xs">Node</span>
      </ToolbarButton>
      <ToolbarButton onClick={onAddEdge} title="Add edge" data-testid="toolbar-add-edge">
        <GitBranch size={14} />
        <span className="text-xs">Edge</span>
      </ToolbarButton>

      <Divider />

      {/* Labels toggle */}
      <ToolbarButton
        active={showLabels}
        onClick={onToggleLabels}
        title="Toggle labels"
        data-testid="toolbar-labels"
      >
        <Tag size={14} />
        <span className="text-xs">Labels</span>
      </ToolbarButton>

      <Divider />

      {/* Layout select */}
      <div className="flex items-center gap-1">
        <LayoutGrid size={14} className="shrink-0 text-[var(--text-secondary)]" />
        <select
          value={layout}
          onChange={(e) => onLayoutChange(e.target.value as LayoutName)}
          className="rounded border-0 bg-transparent py-0.5 text-xs text-[var(--text-primary)] outline-none hover:bg-[var(--bg-inset)] focus:ring-0"
          data-testid="toolbar-layout-select"
        >
          {LAYOUT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Divider />

      {/* Fit + Refresh */}
      <ToolbarButton onClick={onFit} title="Fit to view" data-testid="toolbar-fit">
        <Maximize2 size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={onRefresh} title="Refresh data" data-testid="toolbar-refresh">
        <RefreshCw size={14} />
      </ToolbarButton>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-[var(--border-default)]" />;
}

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ active, children, className, ...props }: ToolbarButtonProps) {
  return (
    <button
      {...props}
      className={`flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs transition-colors ${
        active
          ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]'
      } ${className ?? ''}`}
    >
      {children}
    </button>
  );
}
