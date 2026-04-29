interface MemoryEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  'data-testid'?: string;
}

export function MemoryEditor({
  value,
  onChange,
  readOnly = false,
  'data-testid': testId,
}: MemoryEditorProps) {
  return (
    <div
      className="h-full w-full rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]"
      data-testid={testId}
    >
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        className="h-full w-full resize-none rounded-[var(--radius-lg)] bg-transparent p-4 font-mono text-sm text-[var(--text-primary)] focus:outline-none"
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
      />
    </div>
  );
}
