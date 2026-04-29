// Timeline Hierarchical Gantt — Legend strip (Wave 4b)

const STATE_SWATCHES = [
  { label: 'Active', color: 'var(--brand-primary)' },
  { label: 'In Progress', color: 'var(--status-success, var(--state-success, #22c55e))' },
  { label: 'Blocked', color: 'var(--status-error, var(--state-error, #ef4444))' },
  { label: 'Delayed', color: 'var(--status-warning, var(--state-warning, #f59e0b))' },
  { label: 'In Review', color: 'var(--status-info, var(--state-info, #6366f1))' },
  { label: 'Done', color: 'var(--text-tertiary)' },
  { label: 'Pending', color: 'var(--bg-muted, #94a3b8)' },
];

export function TimelineLegend() {
  return (
    <div
      className="tl-legend flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2"
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
      }}
    >
      {/* Task state swatches */}
      {STATE_SWATCHES.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span
            className="inline-block rounded-sm"
            style={{ width: '12px', height: '8px', backgroundColor: color }}
          />
          <span>{label}</span>
        </div>
      ))}

      {/* Separator */}
      <div className="h-3 w-px" style={{ backgroundColor: 'var(--border-subtle)' }} />

      {/* Goal bracket */}
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block"
          style={{
            width: '16px',
            height: '8px',
            backgroundColor: 'var(--brand-primary)',
            opacity: 0.25,
            borderRadius: '2px',
          }}
        />
        <span>Goal</span>
      </div>

      {/* Composite bracket */}
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block"
          style={{
            width: '16px',
            height: '6px',
            backgroundColor: 'var(--text-tertiary)',
            opacity: 0.35,
            borderRadius: '2px',
          }}
        />
        <span>Composite</span>
      </div>

      {/* Milestone diamond */}
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block"
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: 'var(--brand-primary)',
            transform: 'rotate(45deg)',
          }}
        />
        <span>Milestone</span>
      </div>
    </div>
  );
}
