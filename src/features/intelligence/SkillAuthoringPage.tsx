import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, Upload, GitFork, CheckCircle, XCircle } from 'lucide-react';

interface SkillDef {
  id: string;
  name: string;
  description: string;
  version: string;
  valid: boolean | null;
  content: string;
}

const MOCK_SKILLS: SkillDef[] = [
  {
    id: 'sk-1',
    name: 'email-triage',
    description: 'Classify and route inbound emails',
    version: '1.2.0',
    valid: true,
    content: '---\nname: email-triage\ndescription: Classify and route inbound emails\nversion: 1.2.0\ninput_type: email\noutput_type: classification\n---\n\n# Email Triage\n\nClassify incoming emails into categories:\n- urgent\n- normal\n- low-priority\n- spam\n\nRoute based on classification rules.',
  },
  {
    id: 'sk-2',
    name: 'code-review',
    description: 'Automated code review suggestions',
    version: '2.0.0',
    valid: true,
    content: '---\nname: code-review\ndescription: Automated code review suggestions\nversion: 2.0.0\ninput_type: diff\noutput_type: review_comments\n---\n\n# Code Review\n\nAnalyze code diffs and provide:\n- Style suggestions\n- Bug detection\n- Performance hints',
  },
  {
    id: 'sk-3',
    name: 'meeting-notes',
    description: 'Summarize meeting transcripts',
    version: '0.5.0',
    valid: null,
    content: '---\nname: meeting-notes\ndescription: Summarize meeting transcripts\nversion: 0.5.0\n---\n\n# Meeting Notes\n\nGenerate structured summaries from meeting transcripts.',
  },
];

export function SkillAuthoringPage() {
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [selectedId, setSelectedId] = useState<string>(skills[0]?.id ?? '');
  const [editedContent, setEditedContent] = useState<string>(skills[0]?.content ?? '');

  const selected = skills.find((s) => s.id === selectedId);
  const isDirty = selected ? editedContent !== selected.content : false;

  function selectSkill(id: string) {
    const skill = skills.find((s) => s.id === id);
    if (skill) {
      setSelectedId(id);
      setEditedContent(skill.content);
    }
  }

  function handleSave() {
    setSkills((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, content: editedContent } : s)),
    );
  }

  function handleValidate() {
    const hasFrontmatter = editedContent.startsWith('---') && editedContent.indexOf('---', 3) > 3;
    const hasName = editedContent.includes('name:');
    const hasDescription = editedContent.includes('description:');
    const isValid = hasFrontmatter && hasName && hasDescription;
    setSkills((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, valid: isValid } : s)),
    );
  }

  function handleCreate() {
    const newSkill: SkillDef = {
      id: `sk-${Date.now()}`,
      name: 'new-skill',
      description: 'New skill definition',
      version: '0.1.0',
      valid: null,
      content: '---\nname: new-skill\ndescription: New skill definition\nversion: 0.1.0\n---\n\n# New Skill\n\nDescribe the skill behavior here.',
    };
    setSkills((prev) => [...prev, newSkill]);
    setSelectedId(newSkill.id);
    setEditedContent(newSkill.content);
  }

  return (
    <div className="flex h-full gap-4">
      {/* Skill List */}
      <div className="w-56 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Skills</h2>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" title="Import" onClick={() => {}}>
              <Upload size={14} />
            </Button>
            <Button size="sm" variant="ghost" title="New" onClick={handleCreate}>
              <Plus size={14} />
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`flex items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                selectedId === skill.id
                  ? 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
              }`}
              onClick={() => selectSkill(skill.id)}
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
      </div>

      {/* Editor + Validation */}
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
                <Button size="sm" variant="outline" title="Fork" onClick={() => {}}>
                  <GitFork size={14} className="mr-1" /> Fork
                </Button>
                <Button size="sm" variant="outline" onClick={handleValidate}>
                  Validate
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!isDirty}>
                  <Save size={14} className="mr-1" /> Save
                </Button>
              </div>
            </div>

            {/* Validation Panel */}
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
                  <>
                    <CheckCircle size={14} /> SKILL.md is valid — frontmatter has name and
                    description
                  </>
                ) : (
                  <>
                    <XCircle size={14} /> Invalid — missing required frontmatter fields (name,
                    description)
                  </>
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
