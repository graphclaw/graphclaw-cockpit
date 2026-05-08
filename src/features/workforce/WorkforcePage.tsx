// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { User, Cpu, AlertTriangle, Search } from 'lucide-react';
import { WorkforceCard } from './components/WorkforceCard';
import { useWorkforceData, type WorkforceResource } from './hooks/useWorkforceData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'humans' | 'agents';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface KpiCardProps {
  value: React.ReactNode;
  label: string;
  sub?: string;
  subColor?: string;
}

function KpiCard({ value, label, sub, subColor }: KpiCardProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-1)]">
      <div className="text-xl font-bold text-[var(--text-primary)]">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">{label}</div>
      {sub && (
        <div className={`mt-1 text-xs font-medium ${subColor ?? 'text-[var(--text-tertiary)]'}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI helpers
// ---------------------------------------------------------------------------

function computeKpis(resources: WorkforceResource[], tab: Tab) {
  const isAgents = tab === 'agents';
  const overCap = resources.filter((r) => r.load_factor > 1);
  const avgUtil =
    resources.length
      ? Math.round(
          (resources.reduce((sum, r) => sum + r.load_factor, 0) / resources.length) * 100,
        )
      : 0;
  const activeTasks = resources.reduce(
    (sum, r) => sum + r.task_counts.in_progress + r.task_counts.review + r.task_counts.blocked,
    0,
  );
  const doneTasks = resources.reduce((sum, r) => sum + r.task_counts.done, 0);

  return {
    count: { value: resources.length, label: isAgents ? 'Active Agents' : 'Active Members', sub: 'All available', subColor: 'text-[var(--state-progress)]' },
    util:  { value: `${avgUtil}%`,    label: 'Avg Utilisation', sub: '↑ vs last period', subColor: avgUtil > 90 ? 'text-[var(--state-delayed)]' : 'text-[var(--state-progress)]' },
    over:  {
      value: <span className={overCap.length > 0 ? 'text-[var(--state-blocked)]' : ''}>{overCap.length}</span>,
      label: 'Over Capacity',
      sub: overCap.length > 0 ? overCap.map((r) => r.name).join(', ') : 'None — healthy',
      subColor: overCap.length > 0 ? 'text-[var(--state-blocked)]' : 'text-[var(--state-progress)]',
    },
    active: { value: activeTasks, label: isAgents ? 'Tasks Processing' : 'Active Tasks', sub: 'In progress or review' },
    done:   { value: <span className="text-[var(--state-progress)]">{doneTasks}</span>, label: 'Completed', sub: 'Total done tasks', subColor: 'text-[var(--state-progress)]' },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'humans', label: 'Humans', icon: User },
  { id: 'agents', label: 'AI Agents', icon: Cpu },
];

export function WorkforcePage() {
  const [tab, setTab] = useState<Tab>('humans');
  const [search, setSearch] = useState('');
  const [showOverCapOnly, setShowOverCapOnly] = useState(false);

  const { workforce, isLoading, isError } = useWorkforceData();

  const humans = workforce.filter((r) => r.type === 'HUMAN');
  const agents = workforce.filter((r) => r.type === 'AI_AGENT');
  const current = tab === 'humans' ? humans : agents;

  const filtered = current.filter((r) => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
    const matchOverCap = !showOverCapOnly || r.load_factor > 1;
    return matchSearch && matchOverCap;
  });

  const kpis = computeKpis(current, tab);

  function switchTab(next: Tab) {
    setTab(next);
    setSearch('');
    setShowOverCapOnly(false);
  }

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Workforce</h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          {isLoading
            ? 'Loading…'
            : `Task assignments across ${humans.length} human${humans.length !== 1 ? 's' : ''} and ${agents.length} AI agent${agents.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-[var(--border-default)]">
        <div className="flex gap-1">
          {TABS.map((t) => {
            const count = t.id === 'humans' ? humans.length : agents.length;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <t.icon size={14} />
                {t.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                      : 'bg-[var(--bg-inset)] text-[var(--text-tertiary)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--state-blocked-light)] bg-[var(--state-blocked-light)] px-4 py-3 text-sm text-[var(--state-blocked)]">
          Failed to load workforce data. Check that the backend is running.
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && (
        <>
          {/* KPI bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard {...kpis.count} />
            <KpiCard {...kpis.util} />
            <KpiCard {...kpis.over} />
            <KpiCard {...kpis.active} />
            <KpiCard {...kpis.done} />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-56">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--icon-tertiary)]"
              />
              <input
                type="text"
                placeholder={`Filter ${tab === 'humans' ? 'by name' : 'by agent name'}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] pl-7 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] focus:shadow-[var(--shadow-focus)] transition-all"
              />
            </div>

            <button
              onClick={() => setShowOverCapOnly((v) => !v)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-sm font-medium transition-colors ${
                showOverCapOnly
                  ? 'border-[var(--state-blocked)] bg-[var(--state-blocked-light)] text-[var(--state-blocked)]'
                  : 'border-[var(--state-blocked)] text-[var(--state-blocked)] hover:bg-[var(--state-blocked-light)]'
              }`}
            >
              <AlertTriangle size={12} />
              Over capacity
            </button>
          </div>

          {/* Resource grid */}
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-[var(--text-tertiary)]">
              {search || showOverCapOnly
                ? 'No resources match the current filter.'
                : tab === 'humans'
                  ? 'No human resources registered.'
                  : 'No AI agents registered.'}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((resource) => (
                <WorkforceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border-default)] pt-4 text-xs text-[var(--text-tertiary)]">
            <span className="font-semibold text-[var(--text-secondary)]">Capacity:</span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-3 rounded-full"
                style={{ background: 'linear-gradient(90deg,#34D399,#10B981)' }}
              />
              Under 80%
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-3 rounded-full"
                style={{ background: 'linear-gradient(90deg,#FBBF24,#F59E0B)' }}
              />
              80–100%
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-3 rounded-full"
                style={{ background: 'linear-gradient(90deg,#F87171,#EF4444)' }}
              />
              Over capacity
            </span>
            <span className="ml-auto">Click a card to expand its task list</span>
          </div>
        </>
      )}
    </div>
  );
}
