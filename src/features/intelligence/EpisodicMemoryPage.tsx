import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Trash2, Eye, X } from 'lucide-react';

interface EpisodicEntry {
  id: string;
  label: string;
  timestamp: string;
  charCount: number;
  content: string;
}

const MOCK_EPISODES: EpisodicEntry[] = [
  {
    id: 'ep-1',
    label: 'Sprint 12 planning session',
    timestamp: '2026-04-12T14:30:00Z',
    charCount: 3200,
    content: 'Sprint 12 focused on completing the React cockpit build...',
  },
  {
    id: 'ep-2',
    label: 'Bug triage — scoring edge cases',
    timestamp: '2026-04-10T09:15:00Z',
    charCount: 1800,
    content: 'Investigated edge cases where scoring returned NaN for tasks without dependencies...',
  },
  {
    id: 'ep-3',
    label: 'API integration debugging',
    timestamp: '2026-04-08T16:45:00Z',
    charCount: 2500,
    content: 'Resolved CORS issues with the backend gateway. Had to add CORSMiddleware...',
  },
  {
    id: 'ep-4',
    label: 'Onboarding flow design',
    timestamp: '2026-04-05T11:00:00Z',
    charCount: 4100,
    content: 'Designed the new user onboarding flow with 4 steps: workspace setup, channel config...',
  },
];

export function EpisodicMemoryPage() {
  const [episodes, setEpisodes] = useState(MOCK_EPISODES);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = episodes.filter((ep) =>
    ep.label.toLowerCase().includes(query.toLowerCase()),
  );

  const selected = episodes.find((ep) => ep.id === selectedId);

  function handleDelete(id: string) {
    setEpisodes((prev) => prev.filter((ep) => ep.id !== id));
    setDeleteConfirm(null);
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="flex h-full gap-4">
      {/* List */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Episodic Memory</h2>
          <Badge variant="outline">{episodes.length} entries</Badge>
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

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="grid grid-cols-[1fr_140px_80px_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Label</span>
            <span>Date</span>
            <span>Size</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((ep) => (
              <div
                key={ep.id}
                className={`grid grid-cols-[1fr_140px_80px_80px] items-center gap-4 px-4 py-3 text-sm ${
                  selectedId === ep.id ? 'bg-[var(--bg-inset)]' : ''
                }`}
              >
                <span className="font-medium text-[var(--text-primary)]">{ep.label}</span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {new Date(ep.timestamp).toLocaleDateString()}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {(ep.charCount / 1000).toFixed(1)}k
                </span>
                <div className="flex justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    title="View"
                    onClick={() => setSelectedId(ep.id)}
                  >
                    <Eye size={14} />
                  </Button>
                  {deleteConfirm === ep.id ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[var(--state-error)]"
                      onClick={() => handleDelete(ep.id)}
                    >
                      Confirm
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Delete"
                      onClick={() => setDeleteConfirm(ep.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide-over viewer */}
      {selected && (
        <div className="w-96 shrink-0 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{selected.label}</h3>
            <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>
              <X size={14} />
            </Button>
          </div>
          <p className="mb-3 text-xs text-[var(--text-tertiary)]">
            {new Date(selected.timestamp).toLocaleString()} &middot;{' '}
            {selected.charCount.toLocaleString()} chars
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
