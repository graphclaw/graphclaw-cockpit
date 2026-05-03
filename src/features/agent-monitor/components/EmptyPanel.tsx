import type { LucideIcon } from 'lucide-react';

interface EmptyPanelAction {
  label: string;
  onClick: () => void;
}

interface EmptyPanelProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: EmptyPanelAction;
}

export function EmptyPanel({ icon: Icon, title, subtitle, action }: EmptyPanelProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 text-center">
      <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-inset)] text-[var(--text-secondary)]">
        <Icon size={16} aria-hidden="true" />
      </div>

      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-[var(--text-tertiary)]">{subtitle}</p>}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
