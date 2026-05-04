import { useMemo, useState } from 'react';
import { Activity, Download } from 'lucide-react';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import {
  useActivityFeed,
  type ActivityTimeRange,
} from '@/features/agent-monitor/hooks/useActivityFeed';
import type { AgentActivityItem, AgentActivityType } from '@/lib/api-hooks';

function formatClock(value: string): string {
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

function statusBadgeClass(status: string | null | undefined): string {
  if (status === 'failed') {
    return 'border border-[var(--state-blocked)] bg-[var(--state-blocked-light)] text-[var(--state-blocked)]';
  }

  if (status === 'running') {
    return 'border border-[var(--state-active)] bg-[var(--state-active-light)] text-[var(--state-active)]';
  }

  if (status === 'trigger') {
    return 'border border-[var(--state-complete)] bg-[var(--bg-inset)] text-[var(--text-secondary)]';
  }

  return 'border border-[var(--state-progress)] bg-[var(--state-progress-light)] text-[var(--state-progress)]';
}

function statusLabel(status: string | null | undefined): string {
  if (!status) {
    return 'Done';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function timeOptions(): Array<{ value: ActivityTimeRange; label: string }> {
  return [
    { value: 'last-hour', label: 'Last hour' },
    { value: 'today', label: 'Today' },
    { value: 'last-7-days', label: 'Last 7 days' },
  ];
}

function typeOptions(): Array<{ value: AgentActivityType; label: string }> {
  return [
    { value: 'all', label: 'All events' },
    { value: 'decisions', label: 'Decisions' },
    { value: 'comms', label: 'Communications' },
    { value: 'skills', label: 'Skills' },
    { value: 'errors', label: 'Errors only' },
  ];
}

export function ActivityFeed() {
  const [timeRange, setTimeRange] = useState<ActivityTimeRange>('today');
  const [activityType, setActivityType] = useState<AgentActivityType>('all');
  const [selectedRaw, setSelectedRaw] = useState<AgentActivityItem | null>(null);

  const { items, isLoading, isLoadingMore, error, hasNextPage, loadMore, refetch } = useActivityFeed(
    timeRange,
    activityType,
    25,
  );

  const rawPreview = useMemo(() => {
    if (!selectedRaw?.raw) {
      return null;
    }
    return JSON.stringify(selectedRaw.raw, null, 2);
  }, [selectedRaw?.raw]);

  return (
    <div data-testid="agent-monitor-activity-feed" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-3 py-2">
        <span className="text-xs font-medium text-[var(--text-tertiary)]">Time:</span>
        <select
          value={timeRange}
          onChange={(event) => setTimeRange(event.target.value as ActivityTimeRange)}
          className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-primary)]"
          data-testid="activity-filter-time"
        >
          {timeOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="ml-1 text-xs font-medium text-[var(--text-tertiary)]">Type:</span>
        <select
          value={activityType}
          onChange={(event) => setActivityType(event.target.value as AgentActivityType)}
          className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-primary)]"
          data-testid="activity-filter-type"
        >
          {typeOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
          <Download size={12} />
          Export (coming soon)
        </span>
      </div>

      {isLoading ? (
        <PanelSkeleton rows={8} withHeader={false} />
      ) : error ? (
        <PanelError error={error} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyPanel
          icon={Activity}
          title="No activity in this range."
          subtitle="Try widening the time filter or switching event type."
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                  <th className="px-3 py-2 font-semibold">Time</th>
                  <th className="px-3 py-2 font-semibold">What happened</th>
                  <th className="px-3 py-2 font-semibold">Task</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const rowId = `${item.timestamp}-${item.event_type}-${item.task_id ?? 'none'}-${index}`;
                  const isErrorRow = item.status === 'failed';

                  return (
                    <tr
                      key={rowId}
                      className={`border-b border-[var(--border-subtle)] align-top last:border-b-0 ${
                        isErrorRow ? 'bg-[var(--state-blocked-light)]/40' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{formatClock(item.timestamp)}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">
                        <div className="flex items-start gap-2">
                          <span className="min-w-0 flex-1">{item.message}</span>
                          {item.raw && (
                            <button
                              type="button"
                              onClick={() => setSelectedRaw(item)}
                              className="text-[11px] font-medium text-[var(--text-link)] hover:text-[var(--text-link-hover)]"
                            >
                              Details
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {item.task_id ? (
                          <a
                            href={`/tasks/${item.task_id}`}
                            className="inline-flex rounded-full border border-[var(--border-default)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]"
                          >
                            #{item.task_id}
                          </a>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(item.status)}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasNextPage && (
            <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-3 py-2 text-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={isLoadingMore}
                className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] disabled:opacity-60"
                data-testid="activity-load-more"
              >
                {isLoadingMore ? 'Loading...' : 'Load more events'}
              </button>
            </div>
          )}
        </div>
      )}

      {rawPreview && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3" data-testid="activity-raw-drawer">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Raw event JSON
            </span>
            <button
              type="button"
              onClick={() => setSelectedRaw(null)}
              className="text-xs text-[var(--text-link)] hover:text-[var(--text-link-hover)]"
            >
              Close
            </button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-[var(--radius-sm)] bg-[var(--bg-inset)] p-2 text-[11px] text-[var(--text-secondary)]">
            {rawPreview}
          </pre>
        </div>
      )}
    </div>
  );
}
