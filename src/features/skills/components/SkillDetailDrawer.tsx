import { useState } from 'react';
import { X, Save, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSkillDetail, useUpdateSkillConfig, type SkillItem } from '@/lib/api-hooks';

interface SkillDetailDrawerProps {
  skill: SkillItem;
  onClose: () => void;
}

export function SkillDetailDrawer({ skill, onClose }: SkillDetailDrawerProps) {
  const { data: detail } = useSkillDetail(skill.skill_id);
  const updateConfig = useUpdateSkillConfig();

  const [llmOverride, setLlmOverride] = useState(detail?.config?.llm_override ?? '');
  const [modelOverride, setModelOverride] = useState(detail?.config?.model_override ?? '');
  const [outputType, setOutputType] = useState<'DRAFT_FOR_REVIEW' | 'AUTO_COMPLETE'>(
    detail?.config?.output_type ?? 'DRAFT_FOR_REVIEW',
  );
  const [requiresApproval, setRequiresApproval] = useState(
    detail?.config?.requires_approval ?? false,
  );

  function handleSave() {
    updateConfig.mutate({
      skillId: skill.skill_id,
      config: {
        llm_override: llmOverride || undefined,
        model_override: modelOverride || undefined,
        output_type: outputType,
        requires_approval: requiresApproval,
      },
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-full flex-col bg-[var(--bg-surface)] shadow-xl"
        role="dialog"
        aria-label={`Skill details: ${skill.name}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">{skill.name}</span>
            <Badge variant="outline" className="font-mono text-xs">{skill.version}</Badge>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Description */}
          {skill.description && (
            <p className="text-sm text-[var(--text-secondary)]">{skill.description}</p>
          )}

          {/* Stats */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Executions', value: (skill.usage_count ?? 0).toLocaleString() },
                { label: 'Avg Quality', value: skill.avg_quality_score ? `${skill.avg_quality_score.toFixed(1)}/5` : '—' },
                { label: 'Source', value: skill.source_type?.toUpperCase() ?? 'LOCAL' },
                { label: 'Status', value: skill.enabled ? 'Enabled' : 'Disabled' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-3 py-2"
                >
                  <div className="text-xs text-[var(--text-tertiary)]">{stat.label}</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {skill.tags && skill.tags.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skill.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Configuration */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              <Settings size={12} /> Configuration
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  LLM Provider Override
                </label>
                <Input
                  value={llmOverride}
                  onChange={(e) => setLlmOverride(e.target.value)}
                  placeholder="e.g. anthropic (leave blank for default)"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  Model Override
                </label>
                <Input
                  value={modelOverride}
                  onChange={(e) => setModelOverride(e.target.value)}
                  placeholder="e.g. claude-haiku-4-5 (leave blank for default)"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">Output Type</label>
                <select
                  value={outputType}
                  onChange={(e) => setOutputType(e.target.value as 'DRAFT_FOR_REVIEW' | 'AUTO_COMPLETE')}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                >
                  <option value="DRAFT_FOR_REVIEW">Draft for Review</option>
                  <option value="AUTO_COMPLETE">Auto Complete</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[var(--text-primary)]">Requires Approval</div>
                  <div className="text-xs text-[var(--text-tertiary)]">Agent must get approval before executing</div>
                </div>
                <button
                  onClick={() => setRequiresApproval((v) => !v)}
                  role="switch"
                  aria-checked={requiresApproval}
                  className={`h-5 w-9 rounded-full transition-colors ${
                    requiresApproval ? 'bg-[var(--state-active)]' : 'bg-[var(--border-default)]'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      requiresApproval ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-default)] px-5 py-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateConfig.isPending}
          >
            <Save size={14} className="mr-1" />
            {updateConfig.isPending ? 'Saving…' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </>
  );
}
