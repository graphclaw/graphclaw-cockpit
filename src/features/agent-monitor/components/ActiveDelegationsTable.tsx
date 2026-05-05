import { Network } from 'lucide-react';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { useAgentDelegations } from '@/lib/api-hooks';

interface DisplayDelegation {
  rowKey: string;
  agentId: string;
  taskId: string | null;
  sessionId: string | null;
  status: string;
  startedAt: string | null;
  heartbeatAgeSeconds: number | null;
  durationSeconds: number | null;
}

function readFirstString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
}

function readFirstNumber(...values: Array<unknown>): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '--';
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return '--';
  }

  return new Date(parsed).toLocaleString([], {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) {
    return '--';
  }

  if (seconds < 60) {
    return `${Math.max(0, Math.round(seconds))}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  if (minutes < 60) {
    return `${minutes}m ${remaining}s`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatHeartbeatAge(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) {
    return '--';
  }

  if (seconds < 60) {
    return `${Math.max(0, Math.round(seconds))}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function computeSecondsFromTimestamp(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - parsed) / 1000));
}

function normalizeDelegations(rawRows: unknown[]): DisplayDelegation[] {
  return rawRows.map((rawRow, index) => {
    const row = (rawRow ?? {}) as Record<string, unknown>;

    const agentId = readFirstString(row.agent_id, row.agentId) ?? `agent-${index + 1}`;
    const taskId = readFirstString(row.task_id, row.taskId);
    const sessionId = readFirstString(row.session_id, row.sessionId);
    const status = (readFirstString(row.status) ?? 'UNKNOWN').toUpperCase();
    const startedAt = readFirstString(row.started_at, row.startedAt);

    const heartbeatAgeSeconds =
      readFirstNumber(row.heartbeat_age_seconds, row.heartbeatAgeSeconds) ??
      computeSecondsFromTimestamp(readFirstString(row.last_heartbeat, row.lastHeartbeat));

    const durationSeconds =
      readFirstNumber(row.duration_seconds, row.durationSeconds) ??
      computeSecondsFromTimestamp(startedAt);

    return {
      rowKey: readFirstString(sessionId, taskId, agentId) ?? `delegation-${index + 1}`,
      agentId,
      taskId,
      sessionId,
      status,
      startedAt,
      heartbeatAgeSeconds,
      durationSeconds,
    };
  });
}

function statusClass(status: string): string {
  if (status === 'BLOCKED' || status === 'FAILED' || status === 'ERROR') {
    return 'border-[var(--state-blocked)] bg-[var(--state-blocked-light)] text-[var(--state-blocked)]';
  }

  if (status === 'RUNNING' || status === 'WORKING' || status === 'BUSY') {
    return 'border-[var(--state-running)] bg-[var(--state-running-light)] text-[var(--state-running)]';
  }

  if (status === 'PENDING' || status === 'QUEUED') {
    return 'border-[var(--state-delayed)] bg-[var(--state-delayed-light)] text-[var(--state-delayed)]';
  }

  if (status === 'COMPLETED' || status === 'DONE') {
    return 'border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-[var(--text-tertiary)]';
  }

  return 'border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-[var(--text-secondary)]';
}

function truncateSession(value: string | null): string {
  if (!value) {
    return '--';
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}...`;
}

export function ActiveDelegationsTable() {
  const query = useAgentDelegations();

  if (query.isLoading) {
    return <PanelSkeleton rows={5} withHeader={false} />;
  }

  if (query.error) {
    return <PanelError error={query.error as Error} onRetry={() => void query.refetch()} />;
  }

  const rows = normalizeDelegations(query.data ?? []);

  if (rows.length === 0) {
    return (
      <div data-testid="active-delegations-empty">
        <EmptyPanel
          icon={Network}
          title="No active delegations."
          subtitle="Delegations will appear here when sub-agents are assigned active tasks."
        />
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      data-testid="active-delegations-table"
    >
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Active delegations</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              <th className="px-3 py-2 font-semibold">Agent ID</th>
              <th className="px-3 py-2 font-semibold">Task</th>
              <th className="px-3 py-2 font-semibold">Session</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Started</th>
              <th className="px-3 py-2 font-semibold">Heartbeat</th>
              <th className="px-3 py-2 font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const blocked = row.status === 'BLOCKED';
              const stale = !blocked && row.heartbeatAgeSeconds !== null && row.heartbeatAgeSeconds > 300;
              const rowClass = blocked
                ? 'bg-[var(--state-blocked-light)]'
                : stale
                  ? 'bg-[var(--state-delayed-light)]'
                  : '';
              const rowTestId = blocked
                ? 'active-delegation-row-blocked'
                : stale
                  ? 'active-delegation-row-stale'
                  : 'active-delegation-row';

              return (
                <tr
                  key={row.rowKey}
                  className={`border-b border-[var(--border-subtle)] align-top last:border-b-0 ${rowClass}`}
                  data-testid={rowTestId}
                >
                  <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{row.agentId}</td>
                  <td className="px-3 py-2 text-xs">
                    {row.taskId ? (
                      <span className="inline-flex rounded-full border border-[var(--border-default)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
                        {row.taskId}
                      </span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{truncateSession(row.sessionId)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{formatDateTime(row.startedAt)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{formatHeartbeatAge(row.heartbeatAgeSeconds)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{formatDuration(row.durationSeconds)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
