// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * Graph Explorer — 5-tier collapsible filter panel.
 *
 * Tier 0: Preset chips
 * Tier 1: Node type toggles
 * Tier 2: Task state chips
 * Tier 3: Goal state chips
 * Tier 4: Task Filters (collapsible) — priority + task type
 * Tier 5: Timeline (collapsible)
 * Tier 6: Edge Types (collapsible)
 * Tier 7: Risk & Health (collapsible)
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { useGraphExplorerStore } from '../hooks/useGraphExplorerStore';
import type {
  FilterPreset,
  TaskState,
  GoalState,
  TaskType,
  Priority,
  EdgeType,
} from '../types';
import { TASK_STATES, GOAL_STATES, TASK_TYPES, PRIORITIES, ALL_EDGE_TYPES } from '../types';

// ── Preset config ─────────────────────────────────────────────────────────────

const PRESETS: { value: FilterPreset; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active_work', label: 'Active Work' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'critical_path', label: 'Critical Path' },
  { value: 'my_tasks', label: 'My Tasks' },
  { value: 'overdue', label: 'Overdue' },
];

const STATE_COLORS: Record<string, string> = {
  ACTIVE: 'var(--state-active)',
  IN_PROGRESS: 'var(--state-progress)',
  BLOCKED: 'var(--state-blocked)',
  DELAYED: 'var(--state-delayed)',
  PENDING: 'var(--text-tertiary)',
  COMPLETE: 'var(--state-complete)',
  CANCELLED: 'var(--state-blocked)',
  SNOOZED: 'var(--text-tertiary)',
  NEEDS_REVIEW: 'var(--state-review)',
  INACTIVE_PENDING: 'var(--text-tertiary)',
  ARCHIVED: 'var(--text-tertiary)',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function GraphFilterPanel() {
  const {
    filters,
    activeFilterCount,
    applyPreset,
    toggleNodeType,
    toggleTaskState,
    setAllTaskStates,
    toggleGoalState,
    toggleTaskType,
    togglePriority,
    toggleTimelineFlag,
    toggleEdgeType,
    setAllEdgeTypes,
    toggleRiskFlag,
    resetFilters,
  } = useGraphExplorerStore();

  const [taskFiltersOpen, setTaskFiltersOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [edgeTypesOpen, setEdgeTypesOpen] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);

  return (
    <div
      className="flex h-full flex-col overflow-y-auto"
      data-testid="graph-filter-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Filters</span>
          {activeFilterCount > 0 && (
            <span
              className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
              data-testid="active-filter-count"
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            data-testid="reset-filters"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        )}
      </div>

      <div className="flex-1 space-y-0 overflow-y-auto">
        {/* Tier 0: Presets */}
        <Section label="Presets">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => applyPreset(p.value)}
                data-testid={`preset-${p.value}`}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                  filters.preset === p.value
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium'
                    : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Tier 1: Node types */}
        <Section label="Node Types">
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { key: 'showTasks', label: 'Tasks', color: 'var(--state-active)' },
                { key: 'showGoals', label: 'Goals', color: 'var(--state-progress)' },
                { key: 'showResources', label: 'Resources', color: '#06b6d4' },
                { key: 'showConstraints', label: 'Constraints', color: 'var(--state-delayed)' },
              ] as { key: 'showTasks' | 'showGoals' | 'showResources' | 'showConstraints'; label: string; color: string }[]
            ).map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => toggleNodeType(key)}
                data-testid={`node-type-${key}`}
                className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2 py-1 text-xs transition-colors ${
                  filters[key]
                    ? 'border-transparent text-[var(--text-primary)]'
                    : 'border-[var(--border-default)] text-[var(--text-tertiary)] opacity-50'
                }`}
                style={filters[key] ? { backgroundColor: color + '20', borderColor: color + '60' } : {}}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* Tier 2: Task states */}
        <Section
          label="Task States"
          action={
            <button
              onClick={() => setAllTaskStates(filters.taskStates.size < TASK_STATES.length)}
              className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--brand-primary)]"
            >
              {filters.taskStates.size === TASK_STATES.length ? 'None' : 'All'}
            </button>
          }
        >
          <div className="flex flex-wrap gap-1">
            {TASK_STATES.map((state) => (
              <StateChip
                key={state}
                label={state.replace(/_/g, ' ')}
                active={filters.taskStates.has(state)}
                color={STATE_COLORS[state] ?? 'var(--text-tertiary)'}
                onClick={() => toggleTaskState(state as TaskState)}
                data-testid={`state-chip-${state}`}
              />
            ))}
          </div>
        </Section>

        {/* Tier 3: Goal states */}
        <Section label="Goal States">
          <div className="flex flex-wrap gap-1">
            {GOAL_STATES.map((state) => (
              <StateChip
                key={state}
                label={state}
                active={filters.goalStates.has(state)}
                color={STATE_COLORS[state] ?? 'var(--text-tertiary)'}
                onClick={() => toggleGoalState(state as GoalState)}
                data-testid={`goal-state-${state}`}
              />
            ))}
          </div>
        </Section>

        {/* Tier 4: Task Filters (collapsible) */}
        <CollapsibleSection
          label="Task Filters"
          open={taskFiltersOpen}
          onToggle={() => setTaskFiltersOpen((v) => !v)}
        >
          <div className="space-y-2">
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Priority
              </div>
              <div className="flex flex-wrap gap-1">
                {PRIORITIES.map((p) => (
                  <StateChip
                    key={p}
                    label={p}
                    active={filters.priorities.has(p)}
                    color={
                      p === 'CRITICAL'
                        ? 'var(--state-blocked)'
                        : p === 'HIGH'
                          ? 'var(--state-delayed)'
                          : p === 'MEDIUM'
                            ? 'var(--state-active)'
                            : 'var(--text-tertiary)'
                    }
                    onClick={() => togglePriority(p as Priority)}
                    data-testid={`priority-chip-${p}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Task Type
              </div>
              <div className="flex flex-wrap gap-1">
                {TASK_TYPES.map((t) => (
                  <StateChip
                    key={t}
                    label={t}
                    active={filters.taskTypes.has(t)}
                    color="var(--brand-primary)"
                    onClick={() => toggleTaskType(t as TaskType)}
                    data-testid={`task-type-chip-${t}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Tier 5: Timeline (collapsible) */}
        <CollapsibleSection
          label="Timeline"
          open={timelineOpen}
          onToggle={() => setTimelineOpen((v) => !v)}
        >
          <div className="space-y-1.5">
            {(
              [
                { key: 'dueThisWeek', label: 'Due This Week' },
                { key: 'dueThisMonth', label: 'Due This Month' },
                { key: 'overdueOnly', label: 'Overdue' },
                { key: 'noDeadline', label: 'No Deadline' },
              ] as { key: 'dueThisWeek' | 'dueThisMonth' | 'overdueOnly' | 'noDeadline'; label: string }[]
            ).map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={() => toggleTimelineFlag(key)}
                  className="rounded border-[var(--border-default)] accent-[var(--brand-primary)]"
                  data-testid={`timeline-${key}`}
                />
                <span className="text-xs text-[var(--text-secondary)]">{label}</span>
              </label>
            ))}
          </div>
        </CollapsibleSection>

        {/* Tier 6: Edge Types (collapsible) */}
        <CollapsibleSection
          label="Edge Types"
          open={edgeTypesOpen}
          onToggle={() => setEdgeTypesOpen((v) => !v)}
          action={
            <button
              onClick={() => setAllEdgeTypes(filters.edgeTypes.size < ALL_EDGE_TYPES.length)}
              className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--brand-primary)]"
            >
              {filters.edgeTypes.size === ALL_EDGE_TYPES.length ? 'None' : 'All'}
            </button>
          }
        >
          <div className="space-y-1">
            {ALL_EDGE_TYPES.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.edgeTypes.has(t)}
                  onChange={() => toggleEdgeType(t as EdgeType)}
                  className="rounded border-[var(--border-default)] accent-[var(--brand-primary)]"
                  data-testid={`edge-type-${t}`}
                />
                <span className="text-xs text-[var(--text-secondary)]">{t.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </CollapsibleSection>

        {/* Tier 7: Risk & Health (collapsible) */}
        <CollapsibleSection
          label="Risk & Health"
          open={riskOpen}
          onToggle={() => setRiskOpen((v) => !v)}
        >
          <div className="space-y-1.5">
            {(
              [
                { key: 'onCriticalPath', label: 'On Critical Path' },
                { key: 'hasBlockingDep', label: 'Has Blocking Dependency' },
                { key: 'scoreAbove', label: 'Score ≥ 0.7' },
                { key: 'scoreBelow', label: 'Score < 0.3' },
              ] as { key: 'onCriticalPath' | 'hasBlockingDep' | 'scoreAbove' | 'scoreBelow'; label: string }[]
            ).map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={() => toggleRiskFlag(key)}
                  className="rounded border-[var(--border-default)] accent-[var(--brand-primary)]"
                  data-testid={`risk-${key}`}
                />
                <span className="text-xs text-[var(--text-secondary)]">{label}</span>
              </label>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--border-subtle)] px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          {label}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function CollapsibleSection({
  label,
  open,
  onToggle,
  action,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--border-subtle)]">
      <div className="flex w-full items-center justify-between px-3 py-2.5">
        <button
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left"
          data-testid={`section-toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {open ? (
            <ChevronDown size={12} className="text-[var(--text-tertiary)]" />
          ) : (
            <ChevronRight size={12} className="text-[var(--text-tertiary)]" />
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            {label}
          </span>
        </button>
        {action && <div>{action}</div>}
      </div>
      {open && <div className="px-3 pb-2.5">{children}</div>}
    </div>
  );
}

interface StateChipProps {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
  'data-testid'?: string;
}

function StateChip({ label, active, color, onClick, 'data-testid': testId }: StateChipProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
        active
          ? 'text-white'
          : 'border-[var(--border-default)] bg-transparent text-[var(--text-tertiary)] opacity-50 hover:opacity-80'
      }`}
      style={
        active
          ? { backgroundColor: color, borderColor: color }
          : {}
      }
    >
      {label}
    </button>
  );
}
