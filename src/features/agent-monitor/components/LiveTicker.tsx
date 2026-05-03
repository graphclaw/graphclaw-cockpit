import { Link } from 'react-router';
import { useLiveTickerEvents } from '@/features/agent-monitor/hooks/useLiveTickerEvents';
import type { TickerDotColor } from '@/features/agent-monitor/lib/formatEvent';

function dotColorClass(color: TickerDotColor): string {
  if (color === 'green') {
    return 'bg-[var(--state-progress)]';
  }

  if (color === 'blue') {
    return 'bg-[var(--state-active)]';
  }

  if (color === 'amber') {
    return 'bg-[var(--state-delayed)]';
  }

  if (color === 'red') {
    return 'bg-[var(--state-blocked)]';
  }

  if (color === 'purple') {
    return 'bg-[var(--state-review)]';
  }

  return 'bg-[var(--state-complete)]';
}

export function LiveTicker() {
  const { events, isLive } = useLiveTickerEvents(6);

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm" data-testid="agent-monitor-live-ticker">
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--text-primary)]">Recent Activity</span>
        {isLive && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--state-blocked)] bg-[var(--state-blocked-light)] px-2 py-0.5 text-[11px] font-semibold text-[var(--state-blocked)]" data-testid="agent-monitor-live-badge">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--state-blocked)]" aria-hidden="true" />
            LIVE
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div className="px-4 py-5 text-sm text-[var(--text-tertiary)]">No live activity yet for today.</div>
      ) : (
        <div>
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 border-b border-[var(--border-subtle)] px-4 py-2 text-sm last:border-b-0"
            >
              <span className="min-w-11 pt-0.5 font-mono text-[11px] text-[var(--text-tertiary)]">{event.time}</span>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColorClass(event.dotColor)}`} aria-hidden="true" />
              <span className="flex-1 text-[var(--text-secondary)]">{event.message}</span>
              <span className="pt-0.5 font-mono text-[11px] text-[var(--text-tertiary)]">{event.taskId ? `#${event.taskId}` : '-'}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-4 py-2 text-center">
        <Link to="/agent-monitor/activity" className="text-xs font-medium text-[var(--text-link)] hover:text-[var(--text-link-hover)] hover:underline">
          View full activity history -&gt;
        </Link>
      </div>
    </div>
  );
}
