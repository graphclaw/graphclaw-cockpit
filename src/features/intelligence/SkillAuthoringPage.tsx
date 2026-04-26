import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, GitFork, CheckCircle, XCircle } from 'lucide-react';
import { useAuthoredSkills, useCreateSkill, useUpdateSkill, useForkSkill, useValidateSkill } from '@/lib/api-hooks';

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
  const [localSkills, setLocalSkills] = useState<LocalSkill[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  // Merge remote + local unsaved skills
  const allSkills: LocalSkill[] = [
    ...remoteSkills.map((s) => ({
      skill_id: s.skill_id,
      name: s.name,
      version: s.version,
      description: s.description ?? '',
      valid: true as boolean | null,
      content: BLANK_TEMPLATE,
    })),
    ...localSkills,
  ];

  const selected = allSkills.find((s) => s.skill_id === selectedId);
  const isDirty = selected ? editedContent !== selected.content : false;

  function selectSkill(id: string) {
    const skill = allSkills.find((s) => s.skill_id === id);
    if (skill) {
      setSelectedId(id);
      setEditedContent(skill.content);
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
      // New skill — create via API
      createSkill.mutate(
        { name: skill.name, description: skill.description, version: skill.version, content: editedContent },
        {
          onSuccess: (created) => {
            // Remove from local list, it now lives remotely
            setLocalSkills((prev) => prev.filter((s) => s.skill_id !== selectedId));
            setSelectedId(created.skill_id);
          },
        },
      );
    } else {
      // Existing remote skill — update
      updateSkill.mutate({ skillId: selectedId, content: editedContent });
    }
  }

  function handleFork() {
    if (!selectedId) return;
    const skill = allSkills.find((s) => s.skill_id === selectedId);
    if (!skill) return;
    forkSkill.mutate(
      { skillId: selectedId, name: `${skill.name}-fork` },
      { onSuccess: (forked) => setSelectedId(forked.skill_id) },
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
      {/* Skill List */}
      <div className="w-56 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Skills</h2>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" title="New" onClick={handleCreate}>
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
                <Button size="sm" variant="outline" title="Fork" onClick={handleFork} disabled={forkSkill.isPending}>
                  <GitFork size={14} className="mr-1" /> Fork
                </Button>
                <Button size="sm" variant="outline" onClick={handleValidate} disabled={validateSkill.isPending}>
                  {validateSkill.isPending ? 'Validating…' : 'Validate'}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!isDirty || createSkill.isPending || updateSkill.isPending}>
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

            <div className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="h-full w-full resize-none rounded-[var(--radius-lg)] bg-transparent p-4 font-mono text-sm text-[var(--text-primary)] focus:outline-none"
                spellCheck={false}
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
    </div>
  );
}
