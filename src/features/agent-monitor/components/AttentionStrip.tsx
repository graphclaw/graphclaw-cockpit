// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, Clock3, X } from 'lucide-react';
import { dismissAttentionItem } from '../lib/attentionDismiss';
import { useAttentionItems, type AttentionItem } from '../hooks/useAttentionItems';

function AttentionIcon({ item }: { item: AttentionItem }) {
  if (item.icon === 'alert-circle') {
    return <AlertCircle size={14} className="text-[var(--state-blocked)]" aria-hidden="true" />;
  }

  return <Clock3 size={14} className="text-[var(--state-delayed)]" aria-hidden="true" />;
}

export function AttentionStrip() {
  const { items, isLoading } = useAttentionItems();
  const [locallyDismissedIds, setLocallyDismissedIds] = useState<string[]>([]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => !locallyDismissedIds.includes(item.id));
  }, [items, locallyDismissedIds]);

  if (isLoading || visibleItems.length === 0) {
    return null;
  }

  function handleDismiss(id: string) {
    dismissAttentionItem(id);
    setLocallyDismissedIds((previous) => [...previous, id]);
  }

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--state-delayed-light)]"
      data-testid="agent-monitor-attention-strip"
    >
      {visibleItems.map((item) => (
        <div
          key={item.id}
          className={`flex items-center gap-2 border-b border-[var(--border-default)] px-4 py-2 text-sm last:border-b-0 ${
            item.severity === 'critical' ? 'border-l-2 border-l-[var(--state-blocked)]' : ''
          }`}
          data-testid="agent-monitor-attention-row"
        >
          <span className="shrink-0">
            <AttentionIcon item={item} />
          </span>

          <span className="flex-1 text-[var(--text-primary)]">{item.text}</span>

          {item.taskId && (
            <Link
              to={`/tasks/${item.taskId}`}
              className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--bg-inset)] px-2 py-0.5 text-xs font-semibold text-[var(--text-primary)]"
            >
              #{item.taskId}
            </Link>
          )}

          {item.actionHref && (
            <Link
              to={item.actionHref}
              className="shrink-0 text-xs font-medium text-[var(--brand-primary)] hover:underline"
            >
              View task -&gt;
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleDismiss(item.id)}
            aria-label={`Dismiss alert ${item.id}`}
            className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
