// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { Fragment, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import {
  type AgentTrigger,
  useAgentTriggers,
  useResumeAgentTrigger,
  useSnoozeAgentTrigger,
} from '@/lib/api-hooks';

interface DisplayTrigger {
  rowKey: string;
  triggerId: string | null;
  name: string;
  triggerType: string;
  schedule: string;
  lastFiredAt: string | null;
  nextFireAt: string | null;
  enabled: boolean;
}

function readFirstString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function getTriggerId(trigger: AgentTrigger): string | null {
  return readFirstString(trigger.trigger_id, trigger.triggerId);
}

function normalizeTriggers(rawTriggers: AgentTrigger[]): DisplayTrigger[] {
  return rawTriggers.map((trigger, index) => {
    const triggerId = getTriggerId(trigger);

    return {
      rowKey: triggerId ?? `trigger-${index + 1}`,
      triggerId,
      name: readFirstString(trigger.name) ?? `Trigger ${index + 1}`,
      triggerType: readFirstString(trigger.trigger_type, trigger.triggerType) ?? 'scheduled',
      schedule: readFirstString(trigger.schedule, trigger.cron_expression, trigger.cronExpression) ?? 'On demand',
      lastFiredAt: readFirstString(trigger.last_fired_at, trigger.last_fired, trigger.lastFiredAt, trigger.lastFired),
      nextFireAt: readFirstString(trigger.next_fire_at, trigger.nextFireAt),
      enabled: readBoolean(trigger.enabled, true),
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

function formatTriggerType(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'manual') {
    return 'Manual';
  }
  if (normalized === 'event') {
    return 'Event';
  }
  return 'Scheduled';
}

function statusClass(enabled: boolean): string {
  if (enabled) {
    return 'border-[var(--state-progress)] bg-[var(--state-progress-light)] text-[var(--state-progress)]';
  }

  return 'border-[var(--state-delayed)] bg-[var(--state-delayed-light)] text-[var(--state-delayed)]';
}

export function SchedulingTriggerTable() {
  const triggerQuery = useAgentTriggers();
  const snoozeMutation = useSnoozeAgentTrigger();
  const resumeMutation = useResumeAgentTrigger();
  const [expandedTriggerId, setExpandedTriggerId] = useState<string | null>(null);

  const rows = useMemo(() => normalizeTriggers(triggerQuery.data ?? []), [triggerQuery.data]);
  const isMutating = snoozeMutation.isPending || resumeMutation.isPending;

  if (triggerQuery.isLoading) {
    return <PanelSkeleton rows={4} withHeader={false} />;
  }

  if (triggerQuery.error) {
    return <PanelError error={triggerQuery.error as Error} onRetry={() => void triggerQuery.refetch()} />;
  }

  if (rows.length === 0) {
    return (
      <div data-testid="scheduling-trigger-table-empty">
        <EmptyPanel
          icon={CalendarClock}
          title="No scheduling triggers configured."
          subtitle="Create triggers in Settings and they will appear here with snooze/resume controls."
        />
      </div>
    );
  }

  function handleAction(row: DisplayTrigger) {
    if (!row.triggerId) {
      toast.error('Trigger id is missing.');
      return;
    }

    if (row.enabled) {
      snoozeMutation.mutate(row.triggerId, {
        onSuccess: () => toast.success(`Trigger "${row.name}" snoozed.`),
        onError: () => toast.error(`Failed to snooze "${row.name}".`),
      });
      return;
    }

    resumeMutation.mutate(row.triggerId, {
      onSuccess: () => toast.success(`Trigger "${row.name}" resumed.`),
      onError: () => toast.error(`Failed to resume "${row.name}".`),
    });
  }

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      data-testid="scheduling-trigger-table"
    >
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Triggers</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              <th className="px-3 py-2 font-semibold">Trigger</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Schedule</th>
              <th className="px-3 py-2 font-semibold">Last fired</th>
              <th className="px-3 py-2 font-semibold">Next fire</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isExpanded = row.triggerId !== null && expandedTriggerId === row.triggerId;

              return (
                <Fragment key={row.rowKey}>
                  <tr
                    className="cursor-pointer border-b border-[var(--border-subtle)] align-top hover:bg-[var(--bg-inset)]"
                    onClick={() => setExpandedTriggerId(isExpanded ? null : row.triggerId)}
                    data-testid="scheduling-trigger-row"
                  >
                    <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{row.name}</td>
                    <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{formatTriggerType(row.triggerType)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{row.schedule}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{formatDateTime(row.lastFiredAt)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--text-tertiary)]">{formatDateTime(row.nextFireAt)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.enabled)}`}>
                        {row.enabled ? 'ACTIVE' : 'SNOOZED'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAction(row);
                        }}
                        disabled={!row.triggerId || isMutating}
                        className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                        data-testid="scheduling-trigger-action"
                      >
                        {row.enabled ? 'Snooze' : 'Resume'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-alt)]" data-testid="scheduling-trigger-details">
                      <td colSpan={7} className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">Trigger ID:</span> {row.triggerId}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
