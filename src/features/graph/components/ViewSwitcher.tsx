type ViewMode = 'graph' | 'table' | 'dependencies';

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const VIEWS: Array<{ value: ViewMode; label: string }> = [
  { value: 'graph', label: 'Graph' },
  { value: 'table', label: 'Table' },
  { value: 'dependencies', label: 'Dependencies' },
];

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-0.5">
      {VIEWS.map((v) => (
        <button
          key={v.value}
          onClick={() => onChange(v.value)}
          className={`rounded-[var(--radius-sm)] px-3 py-1 text-sm transition-colors ${
            value === v.value
              ? 'bg-[var(--bg-surface)] font-medium text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
