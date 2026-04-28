import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, RotateCcw } from 'lucide-react';
import {
  useSemanticMemory,
  useSemanticTopic,
  useUpdateSemanticMemory,
  useDeleteSemanticMemory,
} from '@/lib/api-hooks';
import { toast } from 'sonner';
import { useSelectedAgentId } from './IntelligenceLayout';
import { MemoryEditor } from './MemoryEditor';

export function SemanticMemoryPage() {
  const agentId = useSelectedAgentId();
  const { data: mem, isLoading } = useSemanticMemory(agentId);
  const updateTopic = useUpdateSemanticMemory();
  const deleteTopic = useDeleteSemanticMemory();
  const serverTopics = mem?.entries ?? [];

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Local topics: new ones not yet persisted to server
  const [localTopics, setLocalTopics] = useState<{ topic: string; content: string }[]>([]);

  const serverKeys = serverTopics.map((t) => t.key);
  // knowledge.md first, then rest alphabetically
  const sortedKeys = [
    ...serverKeys.filter((k) => k === 'knowledge'),
    ...serverKeys.filter((k) => k !== 'knowledge').sort(),
  ];
  const localKeys = localTopics.map((t) => t.topic).filter((k) => !serverKeys.includes(k));
  const isLocal = selectedTopic ? localKeys.includes(selectedTopic) : false;

  const isDirty = selectedTopic ? editedContent !== savedContent : false;

  // Fetch the selected topic's content from server when it changes
  const { data: topicData } = useSemanticTopic(
    agentId,
    selectedTopic && !isLocal ? selectedTopic : '',
  );

  useEffect(() => {
    if (!selectedTopic) return;
    if (isLocal) {
      const lt = localTopics.find((t) => t.topic === selectedTopic);
      const c = lt?.content ?? '';
      setEditedContent(c);
      setSavedContent(''); // local topic hasn't been saved yet
    } else if (topicData) {
      setEditedContent(topicData.content);
      setSavedContent(topicData.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic, topicData, isLocal]);

  function handleSelectTopic(slug: string) {
    setSelectedTopic(slug);
  }

  function handleCreateTopic() {
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug || sortedKeys.includes(slug) || localKeys.includes(slug)) return;
    const initContent = `# ${newSlug.trim()}\n\n`;
    setLocalTopics((prev) => [...prev, { topic: slug, content: initContent }]);
    setSelectedTopic(slug);
    setEditedContent(initContent);
    setSavedContent('');
    setNewSlug('');
    setShowNew(false);
  }

  function handleSave() {
    if (!selectedTopic) return;
    updateTopic.mutate(
      { agentId, topic: selectedTopic, content: editedContent },
      {
        onSuccess: () => {
          setSavedContent(editedContent);
          // Remove from local list since it's now persisted
          setLocalTopics((prev) => prev.filter((t) => t.topic !== selectedTopic));
          toast.success(`${selectedTopic}.md saved.`);
        },
        onError: () => toast.error('Save failed.'),
      },
    );
  }

  function handleDiscard() {
    if (isLocal) {
      setEditedContent(localTopics.find((t) => t.topic === selectedTopic)?.content ?? '');
    } else {
      setEditedContent(savedContent);
    }
  }

  function handleDelete() {
    if (!selectedTopic) return;
    if (isLocal) {
      setLocalTopics((prev) => prev.filter((t) => t.topic !== selectedTopic));
      setSelectedTopic(null);
      setShowDeleteConfirm(false);
      return;
    }
    deleteTopic.mutate(
      { agentId, topic: selectedTopic },
      {
        onSuccess: () => {
          setSelectedTopic(null);
          setShowDeleteConfirm(false);
          toast.success(`${selectedTopic}.md deleted.`);
        },
        onError: () => toast.error('Delete failed.'),
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

        {sortedKeys.length === 0 && localKeys.length === 0 ? (
          <p className="py-4 text-xs text-[var(--text-tertiary)]">No topics yet.</p>
        ) : (
          <div className="space-y-1" data-testid="semantic-topics">
            {sortedKeys.map((slug) => (
              <div
                key={slug}
                className={`group flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 text-sm ${
                  selectedTopic === slug
                    ? 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
                }`}
                onClick={() => handleSelectTopic(slug)}
              >
                <span className="truncate">{slug}</span>
              </div>
            ))}
            {localKeys.map((slug) => (
              <div
                key={slug}
                className={`group flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 text-sm ${
                  selectedTopic === slug
                    ? 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
                }`}
                onClick={() => handleSelectTopic(slug)}
              >
                <span className="truncate italic">{slug}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hidden group-hover:flex"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocalTopics((prev) => prev.filter((lt) => lt.topic !== slug));
                    if (selectedTopic === slug) setSelectedTopic(null);
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
        {selectedTopic ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {selectedTopic}.md
                </span>
                {isLocal && (
                  <span className="rounded border border-[var(--state-warning)] px-1.5 py-0.5 text-xs text-[var(--state-warning)]">
                    unsaved
                  </span>
                )}
                {isDirty && !isLocal && (
                  <span className="text-xs text-[var(--state-warning)]">Unsaved changes</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[var(--state-error)]"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={14} className="mr-1" /> Delete File
                </Button>
                <Button size="sm" variant="outline" onClick={handleDiscard} disabled={!isDirty && !isLocal}>
                  <RotateCcw size={14} className="mr-1" /> Discard
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!isDirty && !isLocal || updateTopic.isPending}>
                  <Save size={14} className="mr-1" />
                  {updateTopic.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <MemoryEditor
                value={editedContent}
                onChange={setEditedContent}
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

      {/* Delete confirmation */}
      {showDeleteConfirm && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-lg">
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Delete File?</h3>
            <p className="mb-5 text-xs text-[var(--text-tertiary)]">
              Delete <strong>{selectedTopic}.md</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={deleteTopic.isPending}
              >
                {deleteTopic.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
