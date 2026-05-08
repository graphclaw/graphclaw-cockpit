// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { AlertTriangle } from 'lucide-react';

interface PanelErrorProps {
  error: Error | string;
  onRetry: () => void;
}

export function PanelError({ error, onRetry }: PanelErrorProps) {
  const message = typeof error === 'string' ? error : error.message;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--state-blocked)] bg-[var(--state-blocked-light)] p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 text-[var(--state-blocked)]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Something went wrong</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{message}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
