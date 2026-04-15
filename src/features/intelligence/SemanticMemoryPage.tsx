import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useSemanticMemory } from '@/lib/api-hooks';
import { useSelectedAgentId } from './IntelligenceLayout';

export function SemanticMemoryPage() {
  const agentId = useSelectedAgentId();
  const { data: mem, isLoading } = useSemanticMemory(agentId);

  const topics = mem?.entries ?? [];
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [localTopics, setLocalTopics] = useState<
    { topic: string; content: string; updated_at: string }[]
  >([]);

  const allTopics = [...topics, ...localTopics];
  const selected = allTopics.find((t) => t.topic === selectedTopic);
  const isDirty = selected ? editedContent !== selected.content : false;

  function selectTopic(slug: string) {
    const t = allTopics.find((t) => t.topic === slug);
    if (t) {
      setSelectedTopic(slug);
      setEditedContent(t.content);
    }
  }

  function handleCreateTopic() {
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug || allTopics.some((t) => t.topic === slug)) return;
    const newTopic = {
      topic: slug,
      content: `# ${newSlug.trim()}\n\n`,
      updated_at: new Date().toISOString(),
    };
    setLocalTopics((prev) => [...prev, newTopic]);
    setSelectedTopic(slug);
    setEditedContent(newTopic.content);
    setNewSlug('');
    setShowNew(false);
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
      {/* Topic List */}
      <div className="w-56 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Topics</h2>
          <Button size="sm" variant="ghost" onClick={() => setShowNew(true)}>
            <Plus size={14} />
          </Button>
        </div>

        {showNew && (
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="topic-slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1 text-xs text-[var(--text-primary)]"
              data-testid="new-topic-input"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
            />
            <Button size="sm" variant="outline" onClick={handleCreateTopic}>
              Add
            </Button>
          </div>
        )}

        {allTopics.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)] py-4">No topics yet.</p>
        ) : (
          <div className="space-y-1" data-testid="semantic-topics">
            {allTopics.map((t) => (
              <div
                key={t.topic}
                className={`group flex items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                  selectedTopic === t.topic
                    ? 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
                }`}
                onClick={() => selectTopic(t.topic)}
              >
                <span className="truncate">{t.topic}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hidden group-hover:flex"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocalTopics((prev) => prev.filter((lt) => lt.topic !== t.topic));
                    if (selectedTopic === t.topic) setSelectedTopic(null);
                  }}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex flex-1 flex-col gap-3">
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selected.topic}</Badge>
                {isDirty && (
                  <span className="text-xs text-[var(--state-warning)]">Unsaved changes</span>
                )}
              </div>
              <Button size="sm" disabled={!isDirty} onClick={() => {}}>
                <Save size={14} className="mr-1" /> Save
              </Button>
            </div>
            <div className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="h-full w-full resize-none rounded-[var(--radius-lg)] bg-transparent p-4 font-mono text-sm text-[var(--text-primary)] focus:outline-none"
                spellCheck={false}
                data-testid="semantic-editor"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-tertiary)]">
            Select a topic or create a new one
          </div>
        )}
      </div>
    </div>
  );
}
