import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import {
  useAdminGuardrails,
  useUpdateAdminGuardrails,
  useValidateGuardrails,
  type GuardrailsConfig,
} from '@/lib/api-hooks';

export function GuardrailsPage() {
  const { data: guardrailsData, isLoading } = useAdminGuardrails();
  const updateGuardrails = useUpdateAdminGuardrails();
  const validateGuardrails = useValidateGuardrails();

  const [content, setContent] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (guardrailsData && content === '') {
      setContent(JSON.stringify(guardrailsData, null, 2));
    }
  }, [guardrailsData, content]);

  const validationResult = validateGuardrails.data;
  const ruleCount = guardrailsData?.rules?.length ?? 0;

  function parseContent(): GuardrailsConfig | null {
    try {
      const parsed = JSON.parse(content) as GuardrailsConfig;
      setParseError(null);
      return parsed;
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON');
      return null;
    }
  }

  function handleValidate() {
    const parsed = parseContent();
    if (parsed) validateGuardrails.mutate(parsed);
  }

  function handleSave() {
    const parsed = parseContent();
    if (parsed) updateGuardrails.mutate(parsed);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Guardrails Editor</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleValidate} disabled={validateGuardrails.isPending}>
            Validate
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateGuardrails.isPending}>
            {updateGuardrails.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {parseError && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--state-error)]/10 px-3 py-2 text-xs text-[var(--state-error)]">
          <XCircle size={14} /> JSON parse error: {parseError}
        </div>
      )}

      {validationResult !== undefined && !parseError && (
        <div
          className={`flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-xs ${
            validationResult.valid
              ? 'bg-[var(--state-success)]/10 text-[var(--state-success)]'
              : 'bg-[var(--state-error)]/10 text-[var(--state-error)]'
          }`}
          data-testid="guardrails-validation"
        >
          {validationResult.valid ? (
            <><CheckCircle size={14} /> Valid {validationResult.rule_count} rules</>
          ) : (
            <><XCircle size={14} /> {validationResult.errors.join(', ')}</>
          )}
        </div>
      )}

      {updateGuardrails.isSuccess && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--state-success)]/10 px-3 py-2 text-xs text-[var(--state-success)]">
          <CheckCircle size={14} /> Guardrails saved successfully
        </div>
      )}

      <div className="flex gap-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
          <span className="text-xs text-[var(--text-tertiary)]">Rules: </span>
          <Badge variant="default">{ruleCount}</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setParseError(null);
              validateGuardrails.reset();
            }}
            className="h-full w-full resize-none rounded-[var(--radius-lg)] bg-transparent p-4 font-mono text-sm text-[var(--text-primary)] focus:outline-none"
            spellCheck={false}
            data-testid="guardrails-editor"
          />
        </div>
      )}
    </div>
  );
}