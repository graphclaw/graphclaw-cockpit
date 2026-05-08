// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
interface CapacityBarProps {
  /** 0 – 1.5+ representing utilisation. >1 = over capacity. */
  loadFactor: number;
}

export function CapacityBar({ loadFactor }: CapacityBarProps) {
  const pct = Math.round(loadFactor * 100);
  const isOver = loadFactor > 1;
  const isWarn = loadFactor >= 0.8 && !isOver;

  const fillGradient = isOver
    ? 'linear-gradient(90deg,#F87171,#EF4444)'
    : isWarn
      ? 'linear-gradient(90deg,#FBBF24,#F59E0B)'
      : 'linear-gradient(90deg,#34D399,#10B981)';

  // Cap bar visual at 150% so it doesn't overflow the track on extreme values
  const barWidthPct = Math.min(pct, 150);

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-inset)]">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${barWidthPct}%`, background: fillGradient }}
        />
      </div>
      <span
        className={`min-w-[44px] text-right text-sm font-semibold tabular-nums ${
          isOver ? 'text-[var(--state-blocked)]' : 'text-[var(--text-secondary)]'
        }`}
      >
        {pct}%{isOver ? ' ↑' : ''}
      </span>
    </div>
  );
}
