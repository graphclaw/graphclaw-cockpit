import Editor from '@monaco-editor/react';

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
  height = '100%',
  'data-testid': testId,
}: MemoryEditorProps) {
  return (
    <div className="h-full w-full rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-default)]" data-testid={testId}>
      <Editor
        height={height}
        defaultLanguage="markdown"
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        options={{
          readOnly,
          wordWrap: 'on',
          minimap: { enabled: false },
          lineNumbers: 'on',
          fontSize: 13,
          scrollBeyondLastLine: false,
          renderLineHighlight: 'none',
          overviewRulerBorder: false,
          padding: { top: 12, bottom: 12 },
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
        }}
        theme="vs-dark"
        loading={
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
          </div>
        }
      />
    </div>
  );
}
