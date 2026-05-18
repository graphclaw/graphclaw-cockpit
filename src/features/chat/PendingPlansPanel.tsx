// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { ChevronDown, ChevronRight, ClipboardList, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAgentPlans } from '@/lib/api-hooks';
import type { PendingPlan } from '@/lib/api-hooks';

function statusVariant(status: string): 'default' | 'outline' | 'complete' | 'progress' {
  if (status === 'APPROVED') return 'progress';
  if (status === 'EXECUTED') return 'complete';
  return 'outline';
}

function PlanCard({ plan }: { plan: PendingPlan }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      <button
        className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-[var(--bg-inset)] transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="mt-0.5 shrink-0 text-[var(--text-tertiary)]">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {plan.goal_title || plan.plan_id}
            </span>
            <Badge variant={statusVariant(plan.status)} className="text-[10px] px-1.5 py-0">
              {plan.status}
            </Badge>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {plan.tasks.length} task{plan.tasks.length !== 1 ? 's' : ''}
            </span>
          </div>
          {plan.deadline && (
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--state-warning)]">
              <Clock size={10} />
              {new Date(plan.deadline).toLocaleDateString()}
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border-default)] px-3 py-2 space-y-2">
          {plan.goal_description && (
            <p className="text-xs text-[var(--text-secondary)]">{plan.goal_description}</p>
          )}
          {plan.tasks.length > 0 && (
            <div className="space-y-1">
              {plan.tasks.map((task) => (
                <div
                  key={task.draft_task_id}
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {task.title || task.draft_task_id}
                    </span>
                    {task.priority && (
                      <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                        {task.priority}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)] line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  {task.estimated_effort && (
                    <span className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                      ~{task.estimated_effort}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
            <span>rev {plan.revision}</span>
            <span>{new Date(plan.updated_at).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function PendingPlansPanel() {
  const { data: plans = [], isLoading } = useAgentPlans('main');
  const [collapsed, setCollapsed] = useState(false);

  const activePlans = plans.filter((p) => p.status !== 'EXECUTED');

  return (
    <div
      className="flex flex-col border-l border-[var(--border-default)] bg-[var(--bg-base)]"
      data-testid="pending-plans-panel"
      style={{ width: '260px', minWidth: '200px', maxWidth: '320px' }}
    >
      {/* Header */}
      <button
        className="flex items-center gap-2 border-b border-[var(--border-default)] px-3 py-3 text-left hover:bg-[var(--bg-inset)] transition-colors"
        onClick={() => setCollapsed((c) => !c)}
      >
        <ClipboardList size={14} className="text-[var(--brand-primary)] shrink-0" />
        <span className="flex-1 text-xs font-semibold text-[var(--text-primary)]">
          Pending Plans
        </span>
        {activePlans.length > 0 && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0">
            {activePlans.length}
          </Badge>
        )}
        {collapsed ? (
          <ChevronRight size={12} className="text-[var(--text-tertiary)]" />
        ) : (
          <ChevronDown size={12} className="text-[var(--text-tertiary)]" />
        )}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoading && (
            <p className="text-xs text-[var(--text-tertiary)] px-1 py-2">Loading plans…</p>
          )}
          {!isLoading && activePlans.length === 0 && (
            <p className="text-xs text-[var(--text-tertiary)] px-1 py-4 text-center">
              No pending plans
            </p>
          )}
          {activePlans.map((plan) => (
            <PlanCard key={plan.plan_id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
