import { Activity } from 'lucide-react';
import { EmptyPanel } from '@/features/agent-monitor/components/EmptyPanel';
import { PanelError } from '@/features/agent-monitor/components/PanelError';
import { PanelSkeleton } from '@/features/agent-monitor/components/PanelSkeleton';
import { useAgentPoolRunners, useAgents } from '@/lib/api-hooks';

type SegmentTone = 'green' | 'amber' | 'red' | 'empty';

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

function segmentClass(tone: SegmentTone): string {
  if (tone === 'green') {
    return 'bg-[var(--state-progress)]';
  }

  if (tone === 'amber') {
    return 'bg-[var(--state-delayed)]';
  }

  if (tone === 'red') {
    return 'bg-[var(--state-blocked)]';
  }

  return 'bg-[var(--bg-inset)]';
}

function heartbeatAgeSeconds(lastHeartbeat: string | null, fallbackAge: number | null): number | null {
  if (typeof fallbackAge === 'number' && Number.isFinite(fallbackAge)) {
    return Math.max(0, fallbackAge);
  }

  if (!lastHeartbeat) {
    return null;
  }

  const parsed = Date.parse(lastHeartbeat);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - parsed) / 1000));
}

function toneFromAge(ageSeconds: number | null): SegmentTone {
  if (ageSeconds === null) {
    return 'empty';
  }

  if (ageSeconds <= 60) {
    return 'green';
  }

  if (ageSeconds <= 300) {
    return 'amber';
  }

  return 'red';
}

function buildSegments(ageSeconds: number | null, active: boolean): SegmentTone[] {
  if (!active || ageSeconds === null) {
    return Array.from({ length: 30 }, () => 'empty' as const);
  }

  const tone = toneFromAge(ageSeconds);
  const filled = Math.max(1, Math.min(30, Math.ceil(ageSeconds / 60)));

  return Array.from({ length: 30 }, (_, index) => (index < filled ? tone : 'empty'));
}

function heartbeatLabel(ageSeconds: number | null): string {
  if (ageSeconds === null) {
    return 'no heartbeat';
  }

  if (ageSeconds < 60) {
    return `${ageSeconds}s ago`;
  }

  return `${Math.floor(ageSeconds / 60)}m ago`;
}

function activeState(state: string | null): boolean {
  const normalized = (state ?? '').toUpperCase();
  return normalized === 'RUNNING' || normalized === 'BUSY' || normalized === 'WORKING';
}

interface RunnerRow {
  id: string;
  name: string;
  state: string;
  ageSeconds: number | null;
  active: boolean;
}

export function HeartbeatTimeline() {
  const poolQuery = useAgentPoolRunners();
  const agentsQuery = useAgents();

  if (poolQuery.isLoading && agentsQuery.isLoading) {
    return <PanelSkeleton rows={4} withHeader={false} />;
  }

  if (poolQuery.error && agentsQuery.error) {
    return <PanelError error={poolQuery.error as Error} onRetry={() => void poolQuery.refetch()} />;
  }

  const runnerRowsFromPool: RunnerRow[] = (poolQuery.data ?? []).map((runner, index) => {
    const runnerId = readFirstString(runner.runner_id, runner.runnerId) ?? `runner-${index + 1}`;
    const name = readFirstString(runner.agent_name, runner.agentName, runner.agent_id, runner.agentId, runnerId) ?? runnerId;
    const state = readFirstString(runner.state) ?? 'UNKNOWN';
    const lastHeartbeat = readFirstString(runner.last_heartbeat, runner.lastHeartbeat);
    const age = heartbeatAgeSeconds(lastHeartbeat, readFirstNumber(runner.heartbeat_age_seconds, runner.heartbeatAgeSeconds));

    return {
      id: runnerId,
      name,
      state,
      ageSeconds: age,
      active: activeState(state),
    };
  });

  const fallbackRows: RunnerRow[] = (agentsQuery.data ?? []).map((agent) => ({
    id: agent.agent_id,
    name: agent.name,
    state: agent.state,
    ageSeconds: null,
    active: activeState(agent.state),
  }));

  const rows = runnerRowsFromPool.length > 0 ? runnerRowsFromPool : fallbackRows;

  if (rows.length === 0) {
    return (
      <div data-testid="heartbeat-timeline">
        <EmptyPanel
          icon={Activity}
          title="No runner heartbeat data yet."
          subtitle="Heartbeat timelines will appear here when sub-agents are active."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="heartbeat-timeline">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Runner heartbeat timeline</p>
      <div className="space-y-2">
        {rows.map((row) => {
          const segments = buildSegments(row.ageSeconds, row.active);

          return (
            <div key={row.id} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2" data-testid="heartbeat-row">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[var(--text-primary)]">{row.name}</span>
                <span className="text-[var(--text-tertiary)]">{row.state} • {heartbeatLabel(row.ageSeconds)}</span>
              </div>
              <div className="flex flex-wrap gap-1" data-testid="heartbeat-segments">
                {segments.map((segment, index) => (
                  <span
                    key={`${row.id}-segment-${index}`}
                    className={`h-1.5 w-2 rounded-sm ${segmentClass(segment)} ${index >= 15 ? 'hidden md:inline-block' : 'inline-block'}`}
                    data-testid={segment === 'red' ? 'heartbeat-segment-red' : 'heartbeat-segment'}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
