import { CalendarClock, Play } from 'lucide-react';
import { toast } from 'sonner';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { type AgentTrigger, useAgentTriggers, useFireAgentTrigger } from '@/lib/api-hooks';

function getTriggerId(trigger: AgentTrigger): string | null {
  return trigger.trigger_id ?? trigger.triggerId ?? null;
}

function getNextFireAt(trigger: AgentTrigger): string | undefined {
  return trigger.next_fire_at ?? trigger.nextFireAt;
}

function selectNextTrigger(triggers: AgentTrigger[]): AgentTrigger | null {
  const datedTriggers = triggers
    .map((trigger) => ({ trigger, nextFireAt: getNextFireAt(trigger) }))
    .filter((entry) => Boolean(entry.nextFireAt));

  if (datedTriggers.length === 0) {
    return triggers[0] ?? null;
  }

  datedTriggers.sort((a, b) => {
    const aTs = Date.parse(a.nextFireAt as string);
    const bTs = Date.parse(b.nextFireAt as string);

    if (Number.isNaN(aTs) && Number.isNaN(bTs)) {
      return 0;
    }

    if (Number.isNaN(aTs)) {
      return 1;
    }

    if (Number.isNaN(bTs)) {
      return -1;
    }

    return aTs - bTs;
  });

  return datedTriggers[0]?.trigger ?? null;
}

function formatNextRun(trigger: AgentTrigger | null): string {
  if (!trigger) {
    return 'No schedule configured';
  }

  const nextFireAt = getNextFireAt(trigger);
  if (!nextFireAt) {
    return 'Scheduled';
  }

  const timestampMs = Date.parse(nextFireAt);
  if (Number.isNaN(timestampMs)) {
    return 'Scheduled';
  }

  const deltaMinutes = Math.max(0, Math.ceil((timestampMs - Date.now()) / 60_000));
  return deltaMinutes === 0 ? 'Now' : `In ${deltaMinutes}m`;
}

function formatAbsoluteTime(trigger: AgentTrigger | null): string {
  const nextFireAt = trigger ? getNextFireAt(trigger) : null;
  if (!nextFireAt) {
    return 'Add triggers in Settings > Triggers to schedule the agent.';
  }

  const timestampMs = Date.parse(nextFireAt);
  if (Number.isNaN(timestampMs)) {
    return 'Trigger schedule is configured.';
  }

  return new Date(timestampMs).toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function SchedulingNextRunCard() {
  const triggerQuery = useAgentTriggers();
  const fireMutation = useFireAgentTrigger();

  if (triggerQuery.isLoading) {
    return <PanelSkeleton rows={2} withHeader={false} />;
  }

  if (triggerQuery.error) {
    return <PanelError error={triggerQuery.error as Error} onRetry={() => void triggerQuery.refetch()} />;
  }

  const nextTrigger = selectNextTrigger(triggerQuery.data ?? []);
  const triggerId = nextTrigger ? getTriggerId(nextTrigger) : null;

  function handleRunNow() {
    if (!triggerId) {
      toast.error('No runnable trigger is available right now.');
      return;
    }

    fireMutation.mutate(triggerId, {
      onSuccess: () => {
        toast.success('Run requested. The agent will start a cycle shortly.');
      },
      onError: () => {
        toast.error('Failed to trigger run. Please try again.');
      },
    });
  }

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
      data-testid="scheduling-next-run-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Next run</p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]" data-testid="scheduling-next-run-value">
            {formatNextRun(nextTrigger)}
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]" data-testid="scheduling-next-run-detail">
            {formatAbsoluteTime(nextTrigger)}
          </p>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]" data-testid="scheduling-trigger-name">
            Trigger: {nextTrigger?.name ?? 'Not configured'}
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] bg-[var(--brand-primary-light)] p-2 text-[var(--brand-primary)]">
          <CalendarClock size={16} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleRunNow}
          disabled={!triggerId || fireMutation.isPending}
          className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-on-brand)] hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="scheduling-run-now-button"
        >
          <Play size={12} />
          {fireMutation.isPending ? 'Running...' : 'Run Now'}
        </button>

        <span className="text-xs text-[var(--text-tertiary)]">
          Trigger list ships in M-E-2. Recent run history is shown below.
        </span>
      </div>
    </div>
  );
}
