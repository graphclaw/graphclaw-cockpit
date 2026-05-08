// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * Graph Explorer — bottom-center zoom controls.
 * Shows − / percentage / + / fit buttons.
 */

import { Minus, Plus, Maximize2 } from 'lucide-react';

interface Props {
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export function ZoomControls({ zoomPercent, onZoomIn, onZoomOut, onFit }: Props) {
  return (
    <div
      className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-1.5 py-1 shadow-[var(--shadow-2)]"
      data-testid="zoom-controls"
    >
      <ZoomButton onClick={onZoomOut} title="Zoom out" data-testid="zoom-out">
        <Minus size={12} />
      </ZoomButton>

      <span
        className="min-w-[42px] text-center text-xs text-[var(--text-secondary)]"
        data-testid="zoom-percent"
      >
        {zoomPercent}%
      </span>

      <ZoomButton onClick={onZoomIn} title="Zoom in" data-testid="zoom-in">
        <Plus size={12} />
      </ZoomButton>

      <div className="mx-1 h-4 w-px bg-[var(--border-default)]" />

      <ZoomButton onClick={onFit} title="Fit to view" data-testid="zoom-fit">
        <Maximize2 size={12} />
      </ZoomButton>
    </div>
  );
}

function ZoomButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      {...props}
      className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
    >
      {children}
    </button>
  );
}
