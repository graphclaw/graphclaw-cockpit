interface PanelSkeletonProps {
  rows?: number;
  withHeader?: boolean;
}

export function PanelSkeleton({ rows = 5, withHeader = true }: PanelSkeletonProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      {withHeader && <div className="mb-4 h-4 w-40 animate-pulse rounded bg-[var(--bg-inset)]" />}

      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={`panel-skeleton-${index}`}
            className="h-3 w-full animate-pulse rounded bg-[var(--bg-inset)]"
            data-testid="agent-monitor-panel-skeleton-row"
          />
        ))}
      </div>
    </div>
  );
}
