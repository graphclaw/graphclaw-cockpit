// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import { History } from 'lucide-react';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { type AgentSessionItem, useInfiniteAgentSessions } from '@/lib/api-hooks';

interface DisplaySession {
  rowKey: string;
  sessionId: string;
  startedAt: string | null;
  completedAt: string | null;
  triggerType: string;
  toolCallCount: number;
  skillCount: number;
  messagesSent: number;
  messagesReceived: number;
  inputTokens: number;
  outputTokens: number;
  status: string;
}

function readFirstString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
}

function readFirstNumber(...values: Array<unknown>): number {
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

  return 0;
}

function normalizeSessions(rawRows: AgentSessionItem[]): DisplaySession[] {
  return rawRows.map((rawRow, index) => {
    const row = (rawRow ?? {}) as Record<string, unknown>;

    const sessionId = readFirstString(row.sessionId, row.session_id) ?? `session-${index + 1}`;
    const startedAt = readFirstString(row.startedAt, row.started_at);

    return {
      rowKey: `${sessionId}-${startedAt ?? index}`,
      sessionId,
      startedAt,
      completedAt: readFirstString(row.completedAt, row.completed_at),
      triggerType: readFirstString(row.triggerType, row.trigger_type) ?? 'scheduled',
      toolCallCount: readFirstNumber(row.toolCallCount, row.tool_call_count),
      skillCount: readFirstNumber(row.skillCount, row.skill_count),
      messagesSent: readFirstNumber(row.messagesSent, row.messages_sent),
      messagesReceived: readFirstNumber(row.messagesReceived, row.messages_received),
      inputTokens: readFirstNumber(row.inputTokens, row.input_tokens),
      outputTokens: readFirstNumber(row.outputTokens, row.output_tokens),
      status: (readFirstString(row.status) ?? 'completed').toUpperCase(),
    };
  });
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

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) {
    return '--';
  }

  const startMs = Date.parse(startedAt);
  const endMs = Date.parse(completedAt);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return '--';
  }

  const totalSeconds = Math.floor((endMs - startMs) / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${seconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function truncateSession(value: string): string {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 10)}...`;
}

function statusClass(status: string): string {
  if (status === 'FAILED' || status === 'ERROR' || status === 'BLOCKED') {
    return 'border-[var(--state-blocked)] bg-[var(--state-blocked-light)] text-[var(--state-blocked)]';
  }

  if (status === 'RUNNING' || status === 'IN_PROGRESS') {
    return 'border-[var(--state-running)] bg-[var(--state-running-light)] text-[var(--state-running)]';
  }

  return 'border-[var(--state-progress)] bg-[var(--state-progress-light)] text-[var(--state-progress)]';
}

function formatTriggerType(triggerType: string): string {
  const normalized = triggerType.trim().toLowerCase();
  if (normalized === 'manual') {
    return 'Manual';
  }
  if (normalized === 'event') {
    return 'Event';
  }
  return 'Scheduled';
}

export function SchedulingRunHistoryTable() {
  const query = useInfiniteAgentSessions({ limit: 10 });

  const sessions = useMemo(() => {
    const rawItems = (query.data?.pages ?? []).flatMap((page) => page?.items ?? []);
    return normalizeSessions(rawItems);
  }, [query.data?.pages]);

  if (query.isLoading) {
    return <PanelSkeleton rows={5} withHeader={false} />;
  }

  if (query.error) {
    return <PanelError error={query.error as Error} onRetry={() => void query.refetch()} />;
  }

  if (sessions.length === 0) {
    return (
      <div data-testid="scheduling-run-history-empty">
        <EmptyPanel
          icon={History}
          title="No recent run history."
          subtitle="Session summaries will appear here after the next agent run."
        />
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      data-testid="scheduling-run-history"
    >
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Run history</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              <th className="px-3 py-2 font-semibold">Session</th>
              <th className="px-3 py-2 font-semibold">Trigger</th>
              <th className="px-3 py-2 font-semibold">Started</th>
              <th className="px-3 py-2 font-semibold">Duration</th>
              <th className="px-3 py-2 font-semibold">Calls</th>
              <th className="px-3 py-2 font-semibold">Messages</th>
              <th className="px-3 py-2 font-semibold">Tokens</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr
                key={session.rowKey}
                className="border-b border-[var(--border-subtle)] align-top last:border-b-0"
                data-testid="scheduling-run-history-row"
              >
                <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]" title={session.sessionId}>
                  {truncateSession(session.sessionId)}
                </td>
                <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{formatTriggerType(session.triggerType)}</td>
                <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{formatDateTime(session.startedAt)}</td>
                <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">
                  {formatDuration(session.startedAt, session.completedAt)}
                </td>
                <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                  {session.toolCallCount} tool · {session.skillCount} skill
                </td>
                <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                  {session.messagesSent} out · {session.messagesReceived} in
                </td>
                <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">
                  {session.inputTokens} / {session.outputTokens}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(session.status)}`}>
                    {session.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {query.hasNextPage && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2">
          <button
            type="button"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="scheduling-run-history-load-more"
          >
            {query.isFetchingNextPage ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}