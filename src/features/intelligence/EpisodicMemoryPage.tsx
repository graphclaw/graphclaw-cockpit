import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Eye, X } from 'lucide-react';
import { useEpisodicMemory } from '@/lib/api-hooks';
import { useSelectedAgentId } from './IntelligenceLayout';

export function EpisodicMemoryPage() {
  const agentId = useSelectedAgentId();
  const { data: mem, isLoading } = useEpisodicMemory(agentId);
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const entries = mem?.entries ?? [];
  const filtered = entries.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = entries.find((e) => e.name === selectedName);

  return (
    <div className="flex h-full gap-4">
      {/* List */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Episodic Memory</h2>
          <Badge variant="outline">{entries.length} entries</Badge>
        </div>

        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search episodes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-3 text-sm text-[var(--text-primary)]"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]" data-testid="episodic-list">
            <div className="grid grid-cols-[1fr_140px_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              <span>Label</span>
              <span>Date</span>
              <span className="text-right">Actions</span>
            </div>
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[var(--text-tertiary)] text-center">
                No episodic memory entries yet.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((ep) => (
                  <div
                    key={ep.name}
                    className={`grid grid-cols-[1fr_140px_80px] items-center gap-4 px-4 py-3 text-sm ${
                      selectedName === ep.name ? 'bg-[var(--bg-inset)]' : ''
                    }`}
                  >
                    <span className="font-medium text-[var(--text-primary)]">{ep.name}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {new Date(ep.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="View"
                        onClick={() => setSelectedName(ep.name)}
                      >
                        <Eye size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-over viewer */}
      {selected && (
        <div className="w-96 shrink-0 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{selected.name}</h3>
            <Button size="sm" variant="ghost" onClick={() => setSelectedName(null)}>
              <X size={14} />
            </Button>
          </div>
          <p className="mb-3 text-xs text-[var(--text-tertiary)]">
            {new Date(selected.created_at).toLocaleString()}
          </p>
          <div
            className="rounded-[var(--radius-md)] bg-[var(--bg-inset)] p-3 font-mono text-xs text-[var(--text-secondary)]"
            data-testid="episode-viewer"
          >
            {selected.content}
          </div>
        </div>
      )}
    </div>
  );
}
