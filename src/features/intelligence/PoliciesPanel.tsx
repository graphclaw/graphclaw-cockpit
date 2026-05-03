import { useState } from 'react';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { useSelectedAgentId } from './IntelligenceLayout';
import { PolicyEditor } from './PolicyEditor';
import type { PolicyName } from '@/lib/api-hooks';

interface PolicyMeta {
  name: PolicyName;
  label: string;
  description: string;
}

const POLICIES: PolicyMeta[] = [
  {
    name: 'delegation',
    label: 'Delegation',
    description:
      'Controls how sub-tasks are delegated: deadline extensions, allowed transitions, and escalation on blockers.',
  },
  {
    name: 'escalation',
    label: 'Escalation',
    description:
      'Defines when to escalate: deadline misses, blocked tasks, interrupt threshold, and quiet-hours behaviour.',
  },
  {
    name: 'counterparty_etiquette',
    label: 'Counterparty Etiquette',
    description:
      'Sets follow-up limits, gap days between follow-ups, communication tone, and sign-off style.',
  },
  {
    name: 'reply_tone',
    label: 'Reply Tone',
    description:
      'Governs agent voice (first/third/neutral), brevity level, and whether emoji are allowed.',
  },
];

export function PoliciesPanel() {
  const agentId = useSelectedAgentId();
  const [selected, setSelected] = useState<PolicyName | null>(null);

  if (selected) {
    return (
      <PolicyEditor
        agentId={agentId}
        policyName={selected}
        policyLabel={POLICIES.find((p) => p.name === selected)?.label ?? selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <ShieldCheck size={16} />
        <span>
          Configure how <strong className="text-[var(--text-primary)]">{agentId}</strong> behaves
          across delegation, escalation, and communications.
        </span>
      </div>

      <ul className="flex flex-col gap-2" data-testid="policies-list">
        {POLICIES.map((policy) => (
          <li key={policy.name}>
            <button
              type="button"
              data-testid={`policy-card-${policy.name}`}
              onClick={() => setSelected(policy.name)}
              className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 text-left transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {policy.label}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">{policy.description}</span>
              </div>
              <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
