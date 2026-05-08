// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useCommsSummary, type CommsSummary } from '@/lib/api-hooks';

type CommsRange = 'today' | '7d' | '30d';

function toDisplayNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return String(value);
}

function readReceived(summary: CommsSummary | null | undefined): number | null {
  if (!summary) {
    return null;
  }

  return (
    summary.received ??
    summary.messages_received ??
    summary.messagesReceived ??
    null
  );
}

function readSent(summary: CommsSummary | null | undefined): number | null {
  if (!summary) {
    return null;
  }

  return (
    summary.sent ??
    summary.replies_sent ??
    summary.repliesSent ??
    null
  );
}

function todayDateKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function CommsSummaryBanner() {
  const [range, setRange] = useState<CommsRange>('today');

  const queryDate = useMemo(() => {
    if (range === 'today') {
      return todayDateKey();
    }
    return undefined;
  }, [range]);

  const summaryQuery = useCommsSummary(queryDate);

  const summary = summaryQuery.data ?? null;
  const received = readReceived(summary);
  const sent = readSent(summary);

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface-alt)] p-3"
      data-testid="comms-summary-banner"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          <MessageSquare size={12} />
          Comms summary
        </div>

        <div className="ml-auto inline-flex items-center gap-2">
          <span className="text-xs text-[var(--text-tertiary)]">Range:</span>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as CommsRange)}
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-primary)]"
            data-testid="comms-summary-range"
          >
            <option value="today">Today</option>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
          </select>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Received</div>
          <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]" data-testid="comms-summary-received">
            {toDisplayNumber(received)}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Sent</div>
          <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]" data-testid="comms-summary-sent">
            {toDisplayNumber(sent)}
          </div>
        </div>
      </div>

      {!summary && (
        <p className="mt-2 text-xs text-[var(--text-tertiary)]">
          Received falls back to - until gateway comms summary data is available.
        </p>
      )}
    </div>
  );
}
