import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Archive, AlertTriangle } from 'lucide-react';

const DEFAULT_WORKING_MEMORY = `Current focus: Completing Wave 9 of the GraphClaw Cockpit React build.

Active tasks:
- Intelligence Hub layout with 5 sub-sections
- Agent profile editor with Markdown support
- Working/episodic/semantic memory management
- Skill authoring with validation

Recent context:
- Waves 1-8 complete with 61 passing tests
- Using shadcn/ui + Tailwind CSS 4 design system
- React Flow for canvas editor (Wave 8)
- Cytoscape.js for graph views (Wave 4)
`;

const SIZE_WARNING_THRESHOLD = 8000;

export function WorkingMemoryPage() {
  const [content, setContent] = useState(DEFAULT_WORKING_MEMORY);
  const [savedContent, setSavedContent] = useState(DEFAULT_WORKING_MEMORY);
  const [showCompact, setShowCompact] = useState(false);
  const [compactLabel, setCompactLabel] = useState('');
  const isDirty = content !== savedContent;
  const isLarge = content.length > SIZE_WARNING_THRESHOLD;

  function handleSave() {
    setSavedContent(content);
  }

  function handleCompact() {
    if (compactLabel.trim()) {
      setContent('');
      setSavedContent('');
      setShowCompact(false);
      setCompactLabel('');
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Working Memory</h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            {content.length.toLocaleString()} characters
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-[var(--state-warning)]">Unsaved changes</span>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowCompact(true)}>
            <Archive size={14} className="mr-1" /> Compact
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty}>
            <Save size={14} className="mr-1" /> Save
          </Button>
        </div>
      </div>

      {isLarge && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--state-warning)]/10 px-3 py-2 text-xs text-[var(--state-warning)]">
          <AlertTriangle size={14} />
          <span>Working memory is large ({content.length.toLocaleString()} chars). Consider compacting to episodic memory.</span>
        </div>
      )}

      <div className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-inset)]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-full w-full resize-none rounded-[var(--radius-lg)] bg-transparent p-4 font-mono text-sm text-[var(--text-primary)] focus:outline-none"
          spellCheck={false}
          data-testid="working-memory-editor"
        />
      </div>

      {/* Compact Dialog */}
      {showCompact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-lg">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              Compact Working Memory
            </h3>
            <p className="mb-4 text-xs text-[var(--text-tertiary)]">
              Archive current working memory to episodic memory. This will clear the editor.
            </p>
            <input
              type="text"
              placeholder="Session label (e.g., 'Sprint 12 planning')"
              value={compactLabel}
              onChange={(e) => setCompactLabel(e.target.value)}
              className="mb-4 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text-primary)]"
              data-testid="compact-label"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowCompact(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCompact} disabled={!compactLabel.trim()}>
                Archive & Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
