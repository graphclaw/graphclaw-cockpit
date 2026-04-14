import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw } from 'lucide-react';

const DEFAULT_PROFILE = `# Main Agent

## Role
You are a task orchestration agent responsible for managing and prioritizing work items in the GraphClaw system.

## Capabilities
- Task creation, scoring, and state management
- Goal decomposition into actionable tasks
- Dependency graph analysis
- Resource allocation recommendations

## Personality
- Professional and concise
- Data-driven decision making
- Proactive about blockers and risks

## Constraints
- Never modify tasks in DONE or CANCELLED state without explicit user approval
- Always explain scoring decisions when asked
- Escalate to human when confidence drops below 0.3
`;

export function AgentProfilePage() {
  const [content, setContent] = useState(DEFAULT_PROFILE);
  const [savedContent, setSavedContent] = useState(DEFAULT_PROFILE);
  const isDirty = content !== savedContent;

  function handleSave() {
    setSavedContent(content);
  }

  function handleDiscard() {
    setContent(savedContent);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Agent Profile</h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            Define the agent&apos;s role, capabilities, and constraints (Markdown)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-[var(--state-warning)]">Unsaved changes</span>
          )}
          <Button size="sm" variant="outline" onClick={handleDiscard} disabled={!isDirty}>
            <RotateCcw size={14} className="mr-1" /> Discard
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty}>
            <Save size={14} className="mr-1" /> Save
          </Button>
        </div>
      </div>

      <div className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-full w-full resize-none rounded-[var(--radius-lg)] bg-transparent p-4 font-mono text-sm text-[var(--text-primary)] focus:outline-none"
          spellCheck={false}
          data-testid="profile-editor"
        />
      </div>
    </div>
  );
}
