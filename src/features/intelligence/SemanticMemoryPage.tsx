// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, RotateCcw, Eye, Pencil, Check, X } from 'lucide-react';
import {
  useSemanticMemory,
  useSemanticTopic,
  useSemanticIndex,
  useUpdateSemanticMemory,
  useDeleteSemanticMemory,
  useRenameSemanticTopic,
} from '@/lib/api-hooks';
import { toast } from 'sonner';
import { useSelectedAgentId } from './IntelligenceLayout';
import { MemoryEditor } from './MemoryEditor';

export function SemanticMemoryPage() {
  const agentId = useSelectedAgentId();
  const { data: mem, isLoading } = useSemanticMemory(agentId);
  const { data: indexData } = useSemanticIndex(agentId);
  const updateTopic = useUpdateSemanticMemory();
  const deleteTopic = useDeleteSemanticMemory();
  const renameTopic = useRenameSemanticTopic();
  const serverTopics = mem?.entries ?? [];

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [savedDescription, setSavedDescription] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  // Inline rename state
  const [renamingTopic, setRenamingTopic] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  // Local topics: new ones not yet persisted to server
  const [localTopics, setLocalTopics] = useState<{ topic: string; content: string; description: string }[]>([]);

  const serverKeys = serverTopics.map((t) => t.key);
  // knowledge.md first, then rest alphabetically
  const sortedKeys = [
    ...serverKeys.filter((k) => k === 'knowledge'),
    ...serverKeys.filter((k) => k !== 'knowledge').sort(),
  ];
  const localKeys = localTopics.map((t) => t.topic).filter((k) => !serverKeys.includes(k));
  const isLocal = selectedTopic ? localKeys.includes(selectedTopic) : false;

  const isDirty = selectedTopic
    ? editedContent !== savedContent || editedDescription !== savedDescription
    : false;

  // Build a lookup map from index
  const indexMap = new Map((indexData?.topics ?? []).map((t) => [t.name, t.description]));

  // Fetch the selected topic's content from server when it changes
  const { data: topicData } = useSemanticTopic(
    agentId,
    selectedTopic && !isLocal ? selectedTopic : '',
  );

  useEffect(() => {
    if (!selectedTopic) return;
    if (isLocal) {
      const lt = localTopics.find((t) => t.topic === selectedTopic);
      setEditedContent(lt?.content ?? '');
      setEditedDescription(lt?.description ?? '');
      setSavedContent('');
      setSavedDescription('');
    } else if (topicData) {
      setEditedContent(topicData.content);
      setSavedContent(topicData.content);
      const desc = indexMap.get(selectedTopic) ?? '';
      setEditedDescription(desc);
      setSavedDescription(desc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic, topicData, isLocal]);

  // Sync description from index when index loads/changes
  useEffect(() => {
    if (!selectedTopic || isLocal) return;
    const desc = indexMap.get(selectedTopic) ?? '';
    setEditedDescription(desc);
    setSavedDescription(desc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexData]);

  function handleSelectTopic(slug: string) {
    setSelectedTopic(slug);
    setMode('edit');
    setRenamingTopic(null);
  }

  function handleCreateTopic() {
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug || sortedKeys.includes(slug) || localKeys.includes(slug)) return;
    const initContent = `# ${newSlug.trim()}\n\n`;
    setLocalTopics((prev) => [...prev, { topic: slug, content: initContent, description: newDescription.trim() }]);
    setSelectedTopic(slug);
    setEditedContent(initContent);
    setEditedDescription(newDescription.trim());
    setSavedContent('');
    setSavedDescription('');
    setNewSlug('');
    setNewDescription('');
    setShowNew(false);
  }

  function handleSave() {
    if (!selectedTopic) return;
    updateTopic.mutate(
      { agentId, topic: selectedTopic, content: editedContent, description: editedDescription || undefined },
      {
        onSuccess: () => {
          setSavedContent(editedContent);
          setSavedDescription(editedDescription);
          setLocalTopics((prev) => prev.filter((t) => t.topic !== selectedTopic));
          toast.success(`${selectedTopic}.md saved.`);
        },
        onError: () => toast.error('Save failed.'),
      },
    );
  }

  function handleDiscard() {
    if (isLocal) {
      const lt = localTopics.find((t) => t.topic === selectedTopic);
      setEditedContent(lt?.content ?? '');
      setEditedDescription(lt?.description ?? '');
    } else {
      setEditedContent(savedContent);
      setEditedDescription(savedDescription);
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

  function startRename(slug: string) {
    setRenamingTopic(slug);
    setRenameValue(slug);
  }

  function commitRename(slug: string) {
    const newName = renameValue.trim().toLowerCase().replace(/\s+/g, '-');
    setRenamingTopic(null);
    if (!newName || newName === slug) return;
    renameTopic.mutate(
      { agentId, topic: slug, newName },
      {
        onSuccess: () => {
          if (selectedTopic === slug) setSelectedTopic(newName);
          toast.success(`Renamed to ${newName}.md`);
        },
        onError: () => toast.error('Rename failed.'),
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
          <Button size="sm" variant="ghost" onClick={() => setShowNew(true)} data-testid="add-topic-btn">
            <Plus size={14} />
          </Button>
        </div>

        {showNew && (
          <div className="space-y-1">
            <input
              type="text"
              placeholder="topic-slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1 text-xs text-[var(--text-primary)]"
              data-testid="new-topic-input"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
            />
            <input
              type="text"
              placeholder="Short description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1 text-xs text-[var(--text-primary)]"
              data-testid="new-topic-description-input"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
            />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={handleCreateTopic}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNew(false); setNewSlug(''); setNewDescription(''); }}>
                <X size={12} />
              </Button>
            </div>
          </div>
        )}

        {sortedKeys.length === 0 && localKeys.length === 0 ? (
          <p className="py-4 text-xs text-[var(--text-tertiary)]">No topics yet.</p>
        ) : (
          <div className="space-y-1" data-testid="semantic-topics">
            {sortedKeys.map((slug) => {
              const description = indexMap.get(slug);
              const isRenaming = renamingTopic === slug;
              return (
                <div
                  key={slug}
                  className={`group rounded-[var(--radius-md)] px-2 py-1.5 ${
                    selectedTopic === slug ? 'bg-[var(--bg-inset)]' : 'hover:bg-[var(--bg-inset)]'
                  }`}
                  onClick={() => !isRenaming && handleSelectTopic(slug)}
                >
                  <div className="flex cursor-pointer items-center justify-between">
                    {isRenaming ? (
                      <div className="flex flex-1 items-center gap-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="flex-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-1 py-0.5 text-xs text-[var(--text-primary)]"
                          data-testid={`rename-input-${slug}`}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(slug);
                            if (e.key === 'Escape') setRenamingTopic(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          data-testid={`rename-confirm-${slug}`}
                          onClick={(e) => { e.stopPropagation(); commitRename(slug); }}
                        >
                          <Check size={11} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={(e) => { e.stopPropagation(); setRenamingTopic(null); }}
                        >
                          <X size={11} />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className={`truncate text-sm ${selectedTopic === slug ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                          {slug}
                        </span>
                        {slug !== 'knowledge' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hidden h-5 w-5 p-0 group-hover:flex"
                            data-testid={`rename-btn-${slug}`}
                            onClick={(e) => { e.stopPropagation(); startRename(slug); }}
                          >
                            <Pencil size={11} />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  {description && !isRenaming && (
                    <p
                      className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]"
                      data-testid={`topic-description-${slug}`}
                    >
                      {description}
                    </p>
                  )}
                </div>
              );
            })}
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
              <div className="flex flex-1 items-center gap-2 mr-4">
                <span className="text-sm font-medium text-[var(--text-primary)] shrink-0">
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
                <input
                  type="text"
                  placeholder="Short description…"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-tertiary)]"
                  data-testid="topic-description-editor"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-[var(--radius-md)] border border-[var(--border-default)] overflow-hidden">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`rounded-none px-2 ${mode === 'edit' ? 'bg-[var(--bg-inset)]' : ''}`}
                    onClick={() => setMode('edit')}
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`rounded-none px-2 border-l border-[var(--border-default)] ${mode === 'preview' ? 'bg-[var(--bg-inset)]' : ''}`}
                    onClick={() => setMode('preview')}
                    title="Preview"
                  >
                    <Eye size={13} />
                  </Button>
                </div>
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
                <Button size="sm" onClick={handleSave} disabled={(!isDirty && !isLocal) || updateTopic.isPending}>
                  <Save size={14} className="mr-1" />
                  {updateTopic.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <MemoryEditor
                value={editedContent}
                onChange={setEditedContent}
                mode={mode}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
