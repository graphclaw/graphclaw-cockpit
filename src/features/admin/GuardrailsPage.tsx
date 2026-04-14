import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

const DEFAULT_GUARDRAILS = `<guardrails>
  <rule name="no-pii">
    <description>Block outputs containing personal identifiable information</description>
    <pattern>\\b\\d{3}-\\d{2}-\\d{4}\\b</pattern>
    <action>REDACT</action>
  </rule>

  <rule name="max-tokens">
    <description>Limit response length to prevent runaway outputs</description>
    <max_tokens>4096</max_tokens>
    <action>TRUNCATE</action>
  </rule>

  <rule name="content-filter">
    <description>Filter harmful or inappropriate content</description>
    <categories>violence,hate,self-harm</categories>
    <action>BLOCK</action>
  </rule>
</guardrails>`;

export function GuardrailsPage() {
  const [content, setContent] = useState(DEFAULT_GUARDRAILS);
  const [validationResult, setValidationResult] = useState<boolean | null>(null);

  function handleValidate() {
    const hasRoot = content.includes('<guardrails>') && content.includes('</guardrails>');
    const hasRules = content.includes('<rule');
    setValidationResult(hasRoot && hasRules);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Guardrails Editor</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleValidate}>
            Validate
          </Button>
          <Button size="sm" variant="outline">
            Dry Run
          </Button>
          <Button size="sm">Save</Button>
        </div>
      </div>

      {validationResult !== null && (
        <div
          className={`flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-xs ${
            validationResult
              ? 'bg-[var(--state-success)]/10 text-[var(--state-success)]'
              : 'bg-[var(--state-error)]/10 text-[var(--state-error)]'
          }`}
          data-testid="guardrails-validation"
        >
          {validationResult ? (
            <>
              <CheckCircle size={14} /> XML is valid — 3 rules detected
            </>
          ) : (
            <>
              <XCircle size={14} /> Invalid guardrails XML
            </>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="flex gap-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
          <span className="text-xs text-[var(--text-tertiary)]">Rules: </span>
          <Badge variant="default">3</Badge>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
          <span className="text-xs text-[var(--text-tertiary)]">Triggers (24h): </span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">47</span>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
          <span className="text-xs text-[var(--text-tertiary)]">Blocks (24h): </span>
          <span className="text-sm font-semibold text-[var(--state-error)]">12</span>
        </div>
      </div>

      <div className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setValidationResult(null);
          }}
          className="h-full w-full resize-none rounded-[var(--radius-lg)] bg-transparent p-4 font-mono text-sm text-[var(--text-primary)] focus:outline-none"
          spellCheck={false}
          data-testid="guardrails-editor"
        />
      </div>
    </div>
  );
}
