import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MemoryEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  mode?: 'edit' | 'preview';
  'data-testid'?: string;
}

export function MemoryEditor({
  value,
  onChange,
  readOnly = false,
  mode = 'edit',
  'data-testid': testId,
}: MemoryEditorProps) {
  return (
    <div
      className="h-full w-full rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]"
    >
      {mode === 'preview' ? (
        <div className="h-full w-full overflow-auto p-4 prose prose-sm max-w-none prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-code:text-[var(--brand-primary)] prose-pre:bg-[var(--bg-surface)] prose-pre:border prose-pre:border-[var(--border-default)] prose-ul:text-[var(--text-secondary)] prose-ol:text-[var(--text-secondary)] prose-li:marker:text-[var(--text-tertiary)] prose-a:text-[var(--brand-primary)] prose-blockquote:border-l-[var(--brand-primary)] prose-blockquote:text-[var(--text-tertiary)] prose-hr:border-[var(--border-default)] prose-table:text-xs prose-th:text-[var(--text-primary)] prose-td:text-[var(--text-secondary)]">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-[var(--text-tertiary)] italic not-prose">Nothing to preview.</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          data-testid={testId}
          className="h-full w-full resize-none rounded-[var(--radius-lg)] bg-transparent p-4 font-mono text-sm text-[var(--text-primary)] focus:outline-none"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
        />
      )}
    </div>
  );
}
