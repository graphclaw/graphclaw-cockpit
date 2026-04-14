import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, Trash2 } from 'lucide-react';

interface SemanticTopic {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

const MOCK_TOPICS: SemanticTopic[] = [
  {
    slug: 'task-scoring',
    title: 'Task Scoring',
    content: '# Task Scoring\n\nThe scoring system uses 7 weighted factors:\n1. Urgency (deadline proximity)\n2. Priority (explicit user-set)\n3. Dependencies (blocked chains)\n4. Effort estimation\n5. Impact assessment\n6. Resource availability\n7. Strategic alignment\n\nWeights normalize to 1.0.',
    updatedAt: '2026-04-12T10:00:00Z',
  },
  {
    slug: 'api-patterns',
    title: 'API Patterns',
    content: '# API Patterns\n\nAll endpoints follow REST conventions under /app/v1/.\n\n- GET for reads (paginated with cursor)\n- POST for creation\n- PATCH for partial updates\n- DELETE for removal\n\nErrors use RFC 7807 format.',
    updatedAt: '2026-04-10T14:30:00Z',
  },
  {
    slug: 'state-machine',
    title: 'Task State Machine',
    content: '# Task State Machine\n\nValid states: OPEN, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE, CANCELLED\n\nTransitions:\n- OPEN → IN_PROGRESS, BLOCKED, CANCELLED\n- IN_PROGRESS → IN_REVIEW, BLOCKED, CANCELLED\n- BLOCKED → OPEN, IN_PROGRESS\n- IN_REVIEW → DONE, IN_PROGRESS',
    updatedAt: '2026-04-08T09:00:00Z',
  },
];

export function SemanticMemoryPage() {
  const [topics, setTopics] = useState(MOCK_TOPICS);
  const [selectedSlug, setSelectedSlug] = useState<string>(topics[0]?.slug ?? '');
  const [editedContent, setEditedContent] = useState<string>(topics[0]?.content ?? '');
  const [newSlug, setNewSlug] = useState('');
  const [showNew, setShowNew] = useState(false);

  const selected = topics.find((t) => t.slug === selectedSlug);
  const isDirty = selected ? editedContent !== selected.content : false;

  function selectTopic(slug: string) {
    const topic = topics.find((t) => t.slug === slug);
    if (topic) {
      setSelectedSlug(slug);
      setEditedContent(topic.content);
    }
  }

  function handleSave() {
    setTopics((prev) =>
      prev.map((t) =>
        t.slug === selectedSlug
          ? { ...t, content: editedContent, updatedAt: new Date().toISOString() }
          : t,
      ),
    );
  }

  function handleCreateTopic() {
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug || topics.some((t) => t.slug === slug)) return;
    const newTopic: SemanticTopic = {
      slug,
      title: newSlug.trim(),
      content: `# ${newSlug.trim()}\n\n`,
      updatedAt: new Date().toISOString(),
    };
    setTopics((prev) => [...prev, newTopic]);
    setSelectedSlug(slug);
    setEditedContent(newTopic.content);
    setNewSlug('');
    setShowNew(false);
  }

  function handleDelete(slug: string) {
    setTopics((prev) => prev.filter((t) => t.slug !== slug));
    if (selectedSlug === slug) {
      const remaining = topics.filter((t) => t.slug !== slug);
      if (remaining.length > 0) {
        selectTopic(remaining[0].slug);
      } else {
        setSelectedSlug('');
        setEditedContent('');
      }
    }
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

        <div className="space-y-1">
          {topics.map((topic) => (
            <div
              key={topic.slug}
              className={`group flex items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                selectedSlug === topic.slug
                  ? 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
              }`}
              onClick={() => selectTopic(topic.slug)}
            >
              <span className="truncate">{topic.title}</span>
              <Button
                size="sm"
                variant="ghost"
                className="hidden group-hover:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(topic.slug);
                }}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 flex-col gap-3">
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selected.slug}</Badge>
                {isDirty && (
                  <span className="text-xs text-[var(--state-warning)]">Unsaved changes</span>
                )}
              </div>
              <Button size="sm" onClick={handleSave} disabled={!isDirty}>
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
