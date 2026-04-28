import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Archive, AlertTriangle, RotateCcw } from 'lucide-react';
import { useWorkingMemory, useUpdateWorkingMemory, useCompactWorkingMemory, useWorkingMemoryArchive } from '@/lib/api-hooks';
import { toast } from 'sonner';
import { useSelectedAgentId } from './IntelligenceLayout';
import { MemoryEditor } from './MemoryEditor';

const SIZE_WARNING_THRESHOLD = 8000;

export function WorkingMemoryPage() {
  const agentId = useSelectedAgentId();
  const { data: mem, isLoading } = useWorkingMemory(agentId);
  const { data: archives = [] } = useWorkingMemoryArchive(agentId);
  const updateMem = useUpdateWorkingMemory();
  const compact = useCompactWorkingMemory();
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<string>('context.md');
  const [showCompact, setShowCompact] = useState(false);
  const [compactSummary, setCompactSummary] = useState('');
  const [compactLabel, setCompactLabel] = useState('');

  useEffect(() => {
    if (mem) {
      setContent(mem.content ?? '');
      setSavedContent(mem.content ?? '');
    }
  }, [mem]);

  const isDirty = selectedFile === 'context.md' && content !== savedContent;
  const isLarge = content.length > SIZE_WARNING_THRESHOLD;
  const isActiveFile = selectedFile === 'context.md';

  function handleSave() {
    updateMem.mutate(
      { agentId, content },
      {
        onSuccess: () => {
          setSavedContent(content);
          toast.success('Saved.');
        },
        onError: () => toast.error('Save failed.'),
      },
    );
  }

  function handleCompact() {
    if (!compactSummary.trim()) return;
    compact.mutate(
      { agentId, summary: compactSummary.trim(), session_label: compactLabel.trim() || undefined },
      {
        onSuccess: (data) => {
          setSavedContent(compactSummary.trim());
          setContent(compactSummary.trim());
          setShowCompact(false);
          setCompactSummary('');
          setCompactLabel('');
          toast.success(`Archived. Context reduced from ${data.context_before_chars.toLocaleString()} → ${data.context_after_chars.toLocaleString()} chars (${data.reduction_pct}% freed).`);
        },
        onError: () => toast.error('Compact failed.'),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left panel */}
      <div className="w-52 shrink-0 space-y-1">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Working Files
        </h2>
        <div
          className={`flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 text-sm ${
            selectedFile === 'context.md'
              ? 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
          }`}
          onClick={() => setSelectedFile('context.md')}
        >
          <span className="truncate font-medium">context.md</span>
          <span className="ml-2 text-xs text-[var(--text-tertiary)]">
            {mem?.content ? `${(mem.content.length / 1000).toFixed(1)}k` : '0'}
          </span>
        </div>

        {archives.length > 0 && (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Archive
            </p>
            {archives.map((a) => (
              <div
                key={a.name}
                className={`flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 text-sm ${
                  selectedFile === a.name
                    ? 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-inset)]'
                }`}
                onClick={() => setSelectedFile(a.name)}
              >
                <span className="truncate text-xs">{a.name.replace('.md', '')}</span>
                <span className="ml-2 text-xs text-[var(--text-tertiary)]">
                  {`${(a.size_chars / 1000).toFixed(1)}k`}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Editor panel */}
      <div className="flex flex-1 flex-col gap-3">
        {isLarge && isActiveFile && (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--state-warning)]/10 px-3 py-2 text-xs text-[var(--state-warning)]">
            <AlertTriangle size={14} />
            <span>
              Working memory is large ({content.length.toLocaleString()} chars). Consider{' '}
              <button className="underline" onClick={() => setShowCompact(true)}>
                compacting
              </button>
              .
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {selectedFile}
            </span>
            {!isActiveFile && (
              <span className="rounded border border-[var(--border-default)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">
                read-only
              </span>
            )}
            {isDirty && (
              <span className="text-xs text-[var(--state-warning)]">Unsaved changes</span>
            )}
          </div>
          {isActiveFile && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setContent(savedContent)} disabled={!isDirty}>
                <RotateCcw size={14} className="mr-1" /> Discard
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCompact(true)}>
                <Archive size={14} className="mr-1" /> Compact…
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!isDirty || updateMem.isPending}>
                <Save size={14} className="mr-1" />
                {updateMem.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1">
          <MemoryEditor
            value={isActiveFile ? content : ''}
            onChange={isActiveFile ? setContent : undefined}
            readOnly={!isActiveFile}
            data-testid="working-memory-editor"
          />
        </div>
      </div>

      {/* Compact dialog */}
      {showCompact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-lg">
            <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
              Compact Working Memory
            </h3>
            <p className="mb-4 text-xs text-[var(--text-tertiary)]">
              The current context will be archived to episodic memory and replaced with your summary.
            </p>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Summary <span className="text-[var(--state-error)]">*</span>
            </label>
            <textarea
              placeholder="Concise summary of what was in the working context…"
              value={compactSummary}
              onChange={(e) => setCompactSummary(e.target.value)}
              rows={4}
              className="mb-3 w-full resize-none rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
              data-testid="compact-summary"
            />
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Session label (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. sprint-12-planning"
              value={compactLabel}
              onChange={(e) => setCompactLabel(e.target.value)}
              className="mb-4 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text-primary)]"
              data-testid="compact-label"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowCompact(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCompact}
                disabled={!compactSummary.trim() || compact.isPending}
              >
                {compact.isPending ? 'Archiving…' : 'Archive & Clear'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
