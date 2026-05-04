import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Send } from 'lucide-react';
import { ChannelBadge } from '@/features/agent-monitor/components/ChannelBadge';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { useOutboundLog, type OutboundLogItem } from '@/lib/api-hooks';

function todayBounds(now = new Date()): { from: string; to: string } {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return {
    from: from.toISOString(),
    to: now.toISOString(),
  };
}

function readFirstString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return null;
}

function shortTime(value: string | null): string {
  if (!value) {
    return '--:--:--';
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return '--:--:--';
  }

  return new Date(parsed).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function channelValue(item: OutboundLogItem): string {
  return readFirstString(item.channel, item.channel_type, item.channelType) ?? 'unknown';
}

function taskId(item: OutboundLogItem): string | null {
  return readFirstString(item.task_id, item.taskId);
}

function toDisplay(item: OutboundLogItem): string {
  return readFirstString(item.to_display, item.toDisplay, item.to) ?? '-';
}

function subjectSummary(item: OutboundLogItem): string {
  return readFirstString(item.subject, item.summary) ?? '-';
}

function statusLabel(item: OutboundLogItem): string {
  return readFirstString(item.status) ?? 'Logged';
}

export function OutboundCommsTable() {
  const navigate = useNavigate();
  const bounds = useMemo(() => todayBounds(), []);

  const query = useOutboundLog({
    from: bounds.from,
    to: bounds.to,
    limit: 50,
  });

  const items = query.data?.items ?? [];

  if (query.isLoading) {
    return <PanelSkeleton rows={6} withHeader={false} />;
  }

  if (query.error) {
    return <PanelError error={query.error as Error} onRetry={() => void query.refetch()} />;
  }

  if (items.length === 0) {
    return (
      <EmptyPanel
        icon={Send}
        title="No outbound messages yet."
        subtitle="When the agent sends a follow-up it will appear here."
      />
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      data-testid="outbound-log-table"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              <th className="px-3 py-2 font-semibold">Time</th>
              <th className="px-3 py-2 font-semibold">Channel</th>
              <th className="px-3 py-2 font-semibold">To</th>
              <th className="px-3 py-2 font-semibold">Subject/Summary</th>
              <th className="px-3 py-2 font-semibold">Task</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const rowTaskId = taskId(item);
              const rowKey = `${readFirstString(item.timestamp) ?? 'row'}-${index}`;

              return (
                <tr
                  key={rowKey}
                  onClick={() => {
                    if (rowTaskId) {
                      navigate(`/tasks/${rowTaskId}`);
                    }
                  }}
                  className={`border-b border-[var(--border-subtle)] align-top last:border-b-0 ${rowTaskId ? 'cursor-pointer hover:bg-[var(--bg-inset)]' : ''}`}
                >
                  <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">
                    {shortTime(readFirstString(item.timestamp))}
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                    <ChannelBadge channel={channelValue(item)} />
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{toDisplay(item)}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{subjectSummary(item)}</td>
                  <td className="px-3 py-2 text-xs">
                    {rowTaskId ? (
                      <a
                        href={`/tasks/${rowTaskId}`}
                        className="inline-flex rounded-full border border-[var(--border-default)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        #{rowTaskId}
                      </a>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                      {statusLabel(item)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
