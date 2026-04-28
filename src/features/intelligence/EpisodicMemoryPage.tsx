import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEpisodicMemory, useArchiveEpisodicEntry } from '@/lib/api-hooks';
import { toast } from 'sonner';
import { useSelectedAgentId } from './IntelligenceLayout';
import { MemoryEditor } from './MemoryEditor';

export function EpisodicMemoryPage() {
  const agentId = useSelectedAgentId();
  const { data: entries = [], isLoading } = useEpisodicMemory(agentId);
  const archiveEntry = useArchiveEpisodicEntry();

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const active = entries.filter((e) => e.status === 'active');
  const archived = entries.filter((e) => e.status === 'archived');
  const selected = entries.find((e) => e.name === selectedName);

  function handleArchive(entryName: string) {
    archiveEntry.mutate(
      { agentId, entryName },
      {
        onSuccess: () => {
          setShowConfirm(null);
          if (selectedName === entryName) setSelectedName(null);
          toast.success('Entry archived. It will no longer be loaded into the agent context.');
        },
        onError: () => toast.error('Archive failed.'),
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
      <div className="w-56 shrink-0 space-y-1" data-testid="episodic-list">
        {active.length === 0 && archived.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">
            No episodic memory entries yet.
          </p>
        )}

        {active.length > 0 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Active
            </p>
            {active.map((ep) => (
              <div
                key={ep.name}
                className={`flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-sm ${
                  selectedName === ep.name
                    ? 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
                }`}
                onClick={() => setSelectedName(ep.name)}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-primary)]" />
                <span className="truncate text-xs">{ep.name.replace('.md', '')}</span>
              </div>
            ))}
          </>
        )}

        {archived.length > 0 && (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Archived
            </p>
            {archived.map((ep) => (
              <div
                key={ep.name}
                className={`flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-sm ${
                  selectedName === ep.name
                    ? 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-inset)]'
                }`}
                onClick={() => setSelectedName(ep.name)}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-[var(--text-tertiary)]" />
                <span className="truncate text-xs">{ep.name.replace('.md', '')}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Viewer panel */}
      <div className="flex flex-1 flex-col gap-3">
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">{selected.name}</span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-xs ${
                    selected.status === 'active'
                      ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                      : 'border-[var(--border-default)] text-[var(--text-tertiary)]'
                  }`}
                >
                  {selected.status}
                </span>
              </div>
              {selected.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirm(selected.name)}
                >
                  Archive ↓
                </Button>
              )}
            </div>
            <div className="flex-1">
              <MemoryEditor value={selected.content} readOnly />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-tertiary)]">
            Select an entry to view its content
          </div>
        )}
      </div>

      {/* Archive confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-lg">
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
              Archive Entry?
            </h3>
            <p className="mb-5 text-xs text-[var(--text-tertiary)]">
              Archiving this entry removes it from the agent&apos;s context permanently and cannot be undone. Continue?
            </p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowConfirm(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleArchive(showConfirm)}
                disabled={archiveEntry.isPending}
              >
                {archiveEntry.isPending ? 'Archiving…' : 'Archive'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
