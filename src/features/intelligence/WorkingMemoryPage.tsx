import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Archive, AlertTriangle } from 'lucide-react';
import { useWorkingMemory, useCompactWorkingMemory } from '@/lib/api-hooks';
import { useSelectedAgentId } from './IntelligenceLayout';

const SIZE_WARNING_THRESHOLD = 8000;

export function WorkingMemoryPage() {
  const agentId = useSelectedAgentId();
  const { data: mem, isLoading } = useWorkingMemory(agentId);
  const compact = useCompactWorkingMemory();

  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [showCompact, setShowCompact] = useState(false);
  const [compactLabel, setCompactLabel] = useState('');

  useEffect(() => {
    if (mem) {
      setContent(mem.content ?? '');
      setSavedContent(mem.content ?? '');
    }
  }, [mem]);

  const isDirty = content !== savedContent;
  const isLarge = content.length > SIZE_WARNING_THRESHOLD;

  // Working memory is a plain text field — PATCH is not directly supported
  // by the compact endpoint; we use that for archiving. For raw save we call
  // the compact endpoint with the content label, then reload.
  function handleCompact() {
    if (compactLabel.trim()) {
      compact.mutate(agentId, {
        onSuccess: () => {
          setContent('');
          setSavedContent('');
          setShowCompact(false);
          setCompactLabel('');
        },
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Working Memory</h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            {content.length.toLocaleString()} characters
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-[var(--state-warning)]">Unsaved changes</span>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowCompact(true)}>
            <Archive size={14} className="mr-1" /> Compact
          </Button>
          <Button size="sm" onClick={() => setSavedContent(content)} disabled={!isDirty}>
            <Save size={14} className="mr-1" /> Save
          </Button>
        </div>
      </div>

      {isLarge && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--state-warning)]/10 px-3 py-2 text-xs text-[var(--state-warning)]">
          <AlertTriangle size={14} />
          <span>
            Working memory is large ({content.length.toLocaleString()} chars). Consider compacting.
          </span>
        </div>
      )}

      <div className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-full w-full resize-none rounded-[var(--radius-lg)] bg-transparent p-4 font-mono text-sm text-[var(--text-primary)] focus:outline-none"
          spellCheck={false}
          data-testid="working-memory-editor"
          placeholder="Working memory content will appear here..."
        />
      </div>

      {showCompact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-lg">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              Compact Working Memory
            </h3>
            <p className="mb-4 text-xs text-[var(--text-tertiary)]">
              Archive current working memory to episodic memory. This will clear the editor.
            </p>
            <input
              type="text"
              placeholder="Session label (e.g., 'Sprint 12 planning')"
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
                disabled={!compactLabel.trim() || compact.isPending}
              >
                Archive & Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
