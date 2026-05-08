// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; positive: boolean };
  icon?: ReactNode;
}

export function KpiCard({ label, value, trend, icon }: KpiCardProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          {label}
        </span>
        {icon && <span className="text-[var(--text-tertiary)]">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-bold text-[var(--text-primary)]">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.positive ? 'text-[var(--state-active)]' : 'text-[var(--state-blocked)]'
            }`}
          >
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
