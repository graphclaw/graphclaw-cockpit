// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Eye, Pencil, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePolicy, useSavePolicy } from '@/lib/api-hooks';
import { MemoryEditor } from './MemoryEditor';
import type { PolicyName } from '@/lib/api-hooks';

// ---------------------------------------------------------------------------
// Per-policy frontmatter field definitions
// ---------------------------------------------------------------------------

type FieldType = 'bool' | 'int' | 'float' | 'text' | 'select';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

const POLICY_FIELDS: Record<PolicyName, FieldDef[]> = {
  delegation: [
    { key: 'auto_acknowledge', label: 'Auto Acknowledge', type: 'bool' },
    {
      key: 'accept_deadline_extension_max_days',
      label: 'Max Extension Days',
      type: 'int',
      min: 0,
      max: 30,
    },
    { key: 'escalate_on_blocker', label: 'Escalate on Blocker', type: 'bool' },
    {
      key: 'fail_mode',
      label: 'Fail Mode',
      type: 'select',
      options: ['closed', 'degraded'],
    },
  ],
  escalation: [
    { key: 'escalate_on_deadline_miss', label: 'Escalate on Deadline Miss', type: 'bool' },
    { key: 'escalate_on_blocked_task', label: 'Escalate on Blocked Task', type: 'bool' },
    {
      key: 'interrupt_threshold',
      label: 'Interrupt Threshold (0–1)',
      type: 'float',
      min: 0,
      max: 1,
      step: 0.05,
    },
    { key: 'quiet_hours_escalate', label: 'Escalate During Quiet Hours', type: 'bool' },
    {
      key: 'fail_mode',
      label: 'Fail Mode',
      type: 'select',
      options: ['closed', 'degraded'],
    },
  ],
  counterparty_etiquette: [
    { key: 'max_follow_ups', label: 'Max Follow-Ups', type: 'int', min: 0, max: 10 },
    { key: 'follow_up_gap_days', label: 'Follow-Up Gap (days)', type: 'int', min: 1, max: 30 },
    {
      key: 'tone',
      label: 'Tone',
      type: 'select',
      options: ['professional', 'formal', 'casual'],
    },
    { key: 'sign_off', label: 'Sign-Off Template', type: 'text' },
    {
      key: 'fail_mode',
      label: 'Fail Mode',
      type: 'select',
      options: ['closed', 'degraded'],
    },
  ],
  reply_tone: [
    {
      key: 'voice',
      label: 'Voice',
      type: 'select',
      options: ['first_person', 'third_person', 'neutral'],
    },
    {
      key: 'brevity',
      label: 'Brevity',
      type: 'select',
      options: ['terse', 'medium', 'verbose'],
    },
    { key: 'emoji_allowed', label: 'Emoji Allowed', type: 'bool' },
    {
      key: 'fail_mode',
      label: 'Fail Mode',
      type: 'select',
      options: ['closed', 'degraded'],
    },
  ],
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PolicyEditorProps {
  agentId: string;
  policyName: PolicyName;
  policyLabel: string;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PolicyEditor({
  agentId,
  policyName,
  policyLabel,
  onBack,
}: PolicyEditorProps) {
  const { data, isLoading, error } = usePolicy(agentId, policyName);
  const savePolicy = useSavePolicy(agentId, policyName);

  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({});
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isDirty, setIsDirty] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | undefined>();

  // Populate from server data on load
  useEffect(() => {
    if (!data) return;
    setFrontmatter(data.frontmatter ?? {});
    setBody(data.body ?? '');
    setCurrentVersion(data.version);
    setIsDirty(false);
  }, [data]);

  const handleFrontmatterChange = useCallback(
    (key: string, value: unknown) => {
      setFrontmatter((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    [],
  );

  const handleBodyChange = useCallback((value: string) => {
    setBody(value);
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    try {
      const result = await savePolicy.mutateAsync({
        frontmatter,
        body,
        expected_version: currentVersion,
      });
      setCurrentVersion(result.version);
      setIsDirty(false);
      toast.success(`${policyLabel} policy saved.`);
    } catch (err) {
      if (err instanceof Error && err.message.includes('409')) {
        toast.error('Version conflict — someone else saved first. Reload to get latest.');
      } else {
        toast.error(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  const fields = POLICY_FIELDS[policyName] ?? [];

  return (
    <div className="flex h-full flex-col gap-4" data-testid="policy-editor">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            data-testid="policy-back-btn"
          >
            <ArrowLeft size={14} />
            <span>Policies</span>
          </button>
          <span className="text-sm text-[var(--text-tertiary)]">/</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">{policyLabel}</span>
          {isDirty && (
            <span className="rounded-full bg-[var(--brand-primary)] px-1.5 py-0.5 text-[10px] font-medium text-white">
              unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'edit' ? 'preview' : 'edit'))}
            className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          >
            {mode === 'edit' ? <Eye size={12} /> : <Pencil size={12} />}
            <span>{mode === 'edit' ? 'Preview' : 'Edit'}</span>
          </button>
          <Button
            size="sm"
            disabled={!isDirty || savePolicy.isPending}
            onClick={() => void handleSave()}
            data-testid="policy-save-btn"
          >
            <Save size={14} />
            {savePolicy.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <AlertCircle size={14} />
          <span>{error.message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-tertiary)]">
          Loading policy…
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left — structured form */}
          <div
            className="flex w-64 shrink-0 flex-col gap-3 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
            data-testid="policy-frontmatter-form"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Settings
            </p>
            {fields.map((field) => (
              <FieldControl
                key={field.key}
                field={field}
                value={frontmatter[field.key]}
                onChange={(v) => handleFrontmatterChange(field.key, v)}
              />
            ))}
          </div>

          {/* Right — body editor / preview */}
          <div className="flex flex-1 flex-col gap-2 overflow-hidden">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Notes / Body
            </p>
            <div className="flex-1 overflow-hidden">
              <MemoryEditor
                value={body}
                onChange={handleBodyChange}
                mode={mode}
                data-testid="policy-body-editor"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field control sub-component
// ---------------------------------------------------------------------------

interface FieldControlProps {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

function FieldControl({ field, value, onChange }: FieldControlProps) {
  const baseInput =
    'w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]';

  return (
    <label className="flex flex-col gap-1" data-testid={`field-${field.key}`}>
      <span className="text-xs text-[var(--text-secondary)]">{field.label}</span>

      {field.type === 'bool' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--brand-primary)]"
          />
          <span className="text-xs text-[var(--text-tertiary)]">
            {value ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      )}

      {field.type === 'int' && (
        <input
          type="number"
          className={baseInput}
          value={typeof value === 'number' ? value : ''}
          min={field.min}
          max={field.max}
          step={1}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      )}

      {field.type === 'float' && (
        <input
          type="number"
          className={baseInput}
          value={typeof value === 'number' ? value : ''}
          min={field.min}
          max={field.max}
          step={field.step ?? 0.1}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      )}

      {field.type === 'text' && (
        <input
          type="text"
          className={baseInput}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="optional"
        />
      )}

      {field.type === 'select' && (
        <select
          className={baseInput}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}
