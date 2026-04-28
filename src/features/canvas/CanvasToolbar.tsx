/**
 * CanvasToolbar — Floating toolbar above the React Flow canvas (F9).
 *
 * Select | Pan | Undo | Redo | Auto-layout (placeholder) | Save
 */
import { MousePointer2, Hand, Undo2, Redo2, LayoutGrid, Save, Loader2, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CanvasToolbarProps {
  mode: 'select' | 'pan';
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  isSaving: boolean;
  onModeChange: (mode: 'select' | 'pan') => void;
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
}

export function CanvasToolbar({
  mode,
  canUndo,
  canRedo,
  isDirty,
  isSaving,
  onModeChange,
  onUndo,
  onRedo,
  onAutoLayout,
  onSave,
  onExport,
  onImport,
}: CanvasToolbarProps) {
  return (
    <div
      className="pointer-events-auto flex items-center gap-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 shadow-md"
      data-testid="canvas-toolbar"
    >
      {/* Select / Pan */}
      <ToolbarButton
        active={mode === 'select'}
        onClick={() => onModeChange('select')}
        title="Select (V)"
        data-testid="toolbar-select"
      >
        <MousePointer2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={mode === 'pan'}
        onClick={() => onModeChange('pan')}
        title="Pan (H)"
        data-testid="toolbar-pan"
      >
        <Hand size={14} />
      </ToolbarButton>

      <Separator />

      {/* Undo / Redo */}
      <ToolbarButton
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        data-testid="toolbar-undo"
      >
        <Undo2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        data-testid="toolbar-redo"
      >
        <Redo2 size={14} />
      </ToolbarButton>

      <Separator />

      {/* Auto-layout */}
      <ToolbarButton onClick={onAutoLayout} title="Auto-layout" data-testid="toolbar-auto-layout">
        <LayoutGrid size={14} />
      </ToolbarButton>

      <Separator />

      {/* Export / Import */}
      <ToolbarButton onClick={onExport} title="Export canvas JSON" data-testid="toolbar-export">
        <Download size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={onImport} title="Import canvas JSON" data-testid="toolbar-import">
        <Upload size={14} />
      </ToolbarButton>

      <Separator />

      {/* Save */}
      <button
        onClick={onSave}
        disabled={isSaving || !isDirty}
        title="Save canvas (Ctrl+S)"
        data-testid="toolbar-save"
        className={cn(
          'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors',
          isDirty && !isSaving
            ? 'bg-sky-500 text-white hover:bg-sky-400'
            : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-inset)] disabled:opacity-40',
        )}
      >
        {isSaving ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Save size={12} />
        )}
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function ToolbarButton({
  children,
  active,
  disabled,
  onClick,
  title,
  'data-testid': testId,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  'data-testid'?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-testid={testId}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors',
        active
          ? 'bg-sky-500/20 text-sky-400'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]',
        disabled && 'opacity-30 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />;
}
