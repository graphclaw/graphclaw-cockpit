import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, GitFork, CheckCircle, XCircle, Trash2, Eye, Pencil } from 'lucide-react';
import { useAuthoredSkills, useCreateSkill, useUpdateSkill, useForkSkill, useValidateSkill, useDeleteAuthoredSkill } from '@/lib/api-hooks';
import { toast } from 'sonner';
import { MemoryEditor } from './MemoryEditor';

interface LocalSkill {
  skill_id: string;
  name: string;
  version: string;
  description: string;
  valid: boolean | null;
  content: string;
}

const BLANK_TEMPLATE = `---
name: new-skill
description: New skill definition
version: 0.1.0
---

# New Skill

Describe the skill behavior here.`;

export function SkillAuthoringPage() {
  const { data: remoteSkills = [], isLoading } = useAuthoredSkills();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const forkSkill = useForkSkill();
  const validateSkill = useValidateSkill();
  const deleteSkill = useDeleteAuthoredSkill();
  const [localSkills, setLocalSkills] = useState<LocalSkill[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  // Merge remote + local unsaved skills
  const allSkills: LocalSkill[] = [
    ...remoteSkills.map((s) => ({
      skill_id: s.skill_id,
      name: s.name ?? s.skill_id,
      version: s.version ?? '0.1.0',
      description: s.description ?? '',
      valid: true as boolean | null,
      content: s.content ?? BLANK_TEMPLATE,
    })),
    ...localSkills,
  ];

  const selected = allSkills.find((s) => s.skill_id === selectedId);
  const isDirty = selected ? editedContent !== selected.content : false;

  useEffect(() => {
    const firstSkill = allSkills[0];
    if (!firstSkill) return;
    if (selectedId && allSkills.some((skill) => skill.skill_id === selectedId)) return;
    setSelectedId(firstSkill.skill_id);
    setEditedContent(firstSkill.content);
  }, [allSkills, selectedId]);

  function selectSkill(id: string) {
    const skill = allSkills.find((s) => s.skill_id === id);
    if (skill) {
      setSelectedId(id);
      setEditedContent(skill.content);
      setMode('edit');
    }
  }

  function handleCreate() {
    const id = `new-${Date.now()}`;
    const newSkill: LocalSkill = {
      skill_id: id,
      name: 'new-skill',
      description: 'New skill definition',
      version: '0.1.0',
      valid: null,
      content: BLANK_TEMPLATE,
    };
    setLocalSkills((prev) => [...prev, newSkill]);
    setSelectedId(id);
    setEditedContent(BLANK_TEMPLATE);
  }

  function handleValidate() {
    // Use API validation if available, fall back to client-side heuristic
    validateSkill.mutate(editedContent, {
      onSuccess: (result) => {
        setLocalSkills((prev) =>
          prev.map((s) => (s.skill_id === selectedId ? { ...s, valid: result.valid } : s)),
        );
      },
      onError: () => {
        // Client-side fallback
        const hasFrontmatter = editedContent.startsWith('---') && editedContent.indexOf('---', 3) > 3;
        const hasName = editedContent.includes('name:');
        const hasDescription = editedContent.includes('description:');
        const isValid = hasFrontmatter && hasName && hasDescription;
        setLocalSkills((prev) =>
          prev.map((s) => (s.skill_id === selectedId ? { ...s, valid: isValid } : s)),
        );
      },
    });
  }

  function handleSave() {
    if (!selectedId || !editedContent) return;
    const isLocal = localSkills.some((s) => s.skill_id === selectedId);
    const skill = allSkills.find((s) => s.skill_id === selectedId);
    if (!skill) return;

    if (isLocal) {
      createSkill.mutate(
        { name: skill.name, description: skill.description, version: skill.version, content: editedContent },
        {
          onSuccess: (created) => {
            setLocalSkills((prev) => prev.filter((s) => s.skill_id !== selectedId));
            setSelectedId(created.skill_id);
            toast.success(`Skill '${created.skill_id}' created.`);
          },
          onError: () => toast.error('Create failed.'),
        },
      );
    } else {
      updateSkill.mutate(
        { skillId: selectedId, content: editedContent, name: skill.name, description: skill.description, version: skill.version },
        {
          onSuccess: () => toast.success('Skill saved.'),
          onError: () => toast.error('Save failed.'),
        },
      );
    }
  }

  function handleFork() {
    if (!selectedId) return;
    const skill = allSkills.find((s) => s.skill_id === selectedId);
    if (!skill) return;
    forkSkill.mutate(
      { skillId: selectedId, name: `${skill.name}-fork` },
      {
        onSuccess: (forked) => {
          setSelectedId(forked.skill_id ?? forked.forked_skill_id ?? null);
          toast.success(`Forked as '${forked.forked_skill_id ?? forked.skill_id}'.`);
        },
        onError: () => toast.error('Fork failed.'),
      },
    );
  }

  function handleDelete() {
    if (!selectedId) return;
    const isLocal = localSkills.some((s) => s.skill_id === selectedId);
    if (isLocal) {
      setLocalSkills((prev) => prev.filter((s) => s.skill_id !== selectedId));
      setSelectedId(null);
      setShowDeleteConfirm(false);
      return;
    }
    deleteSkill.mutate(selectedId, {
      onSuccess: () => {
        setSelectedId(null);
        setShowDeleteConfirm(false);
        toast.success(`Skill '${selectedId}' deleted.`);
      },
      onError: () => toast.error('Delete failed.'),
    });
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
      {/* Skill List */}
      <div className="w-56 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Skills</h2>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" title="New" onClick={handleCreate} data-testid="create-skill-button">
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {allSkills.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)] py-4">No skills yet. Create one.</p>
        ) : (
          <div className="space-y-1" data-testid="skill-list">
            {allSkills.map((skill) => (
              <div
                key={skill.skill_id}
                className={`flex items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                  selectedId === skill.skill_id
                    ? 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
                }`}
                onClick={() => selectSkill(skill.skill_id)}
              >
                <div className="truncate">
                  <div className="font-medium">{skill.name}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">v{skill.version}</div>
                </div>
                {skill.valid === true && <CheckCircle size={14} className="text-[var(--state-success)]" />}
                {skill.valid === false && <XCircle size={14} className="text-[var(--state-error)]" />}
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
                <Badge variant="outline">{selected.name}</Badge>
                <span className="text-xs text-[var(--text-tertiary)]">v{selected.version}</span>
                {isDirty && (
                  <span className="text-xs text-[var(--state-warning)]">Unsaved</span>
                )}
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
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
                <Button size="sm" variant="outline" title="Fork" onClick={handleFork} disabled={forkSkill.isPending}>
                  <GitFork size={14} className="mr-1" /> Fork
                </Button>
                <Button size="sm" variant="outline" onClick={handleValidate} disabled={validateSkill.isPending}>
                  {validateSkill.isPending ? 'Validating…' : 'Validate'}
                </Button>
                <Button
                  size="sm"
                  data-testid="save-skill-button"
                  onClick={handleSave}
                  disabled={!isDirty || createSkill.isPending || updateSkill.isPending}
                >
                  <Save size={14} className="mr-1" />
                  {createSkill.isPending || updateSkill.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>

            {selected.valid !== null && (
              <div
                className={`flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-xs ${
                  selected.valid
                    ? 'bg-[var(--state-success)]/10 text-[var(--state-success)]'
                    : 'bg-[var(--state-error)]/10 text-[var(--state-error)]'
                }`}
                data-testid="validation-result"
              >
                {selected.valid ? (
                  <><CheckCircle size={14} /> SKILL.md is valid</>
                ) : (
                  <><XCircle size={14} /> Invalid — missing required frontmatter fields</>
                )}
              </div>
            )}

            {(createSkill.isError || updateSkill.isError || forkSkill.isError) && (
              <div className="rounded-[var(--radius-md)] bg-[var(--state-error)]/10 px-3 py-2 text-xs text-[var(--state-error)]">
                {(createSkill.error as Error | null)?.message ||
                  (updateSkill.error as Error | null)?.message ||
                  (forkSkill.error as Error | null)?.message ||
                  'Skill operation failed. Please retry.'}
              </div>
            )}

            <div className="flex-1">
              <MemoryEditor
                value={editedContent}
                onChange={setEditedContent}
                mode={mode}
                data-testid="skill-editor"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-tertiary)]">
            Select a skill or create a new one
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-lg">
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Delete Skill?</h3>
            <p className="mb-5 text-xs text-[var(--text-tertiary)]">
              Delete <strong>{selectedId}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleDelete} disabled={deleteSkill.isPending}>
                {deleteSkill.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
