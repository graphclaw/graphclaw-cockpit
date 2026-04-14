interface SkeletonPageProps {
  title: string;
}

export function SkeletonPage({ title }: SkeletonPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 h-12 w-12 rounded-[var(--radius-lg)] bg-[var(--bg-inset)]" />
      <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="text-sm text-[var(--text-tertiary)]">Coming soon — this page is under construction.</p>
    </div>
  );
}
