import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw } from 'lucide-react';
import { useAgentProfile, useUpdateAgentProfile } from '@/lib/api-hooks';
import { toast } from 'sonner';
import { useSelectedAgentId } from './IntelligenceLayout';
import { MemoryEditor } from './MemoryEditor';

export function AgentProfilePage() {
  const agentId = useSelectedAgentId();
  const { data: profile, isLoading } = useAgentProfile(agentId);
  const update = useUpdateAgentProfile();
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');

  useEffect(() => {
    if (profile) {
      setContent(profile.content);
      setSavedContent(profile.content);
    }
  }, [profile]);

  const isDirty = content !== savedContent;

  function handleSave() {
    update.mutate(
      { agentId, content },
      {
        onSuccess: () => {
          setSavedContent(content);
          toast.success('Profile saved.');
        },
        onError: () => {
          toast.error('Save failed.');
        },
      },
    );
  }

  function handleDiscard() {
    setContent(savedContent);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
      </div>
    );
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
          <Button size="sm" onClick={handleSave} disabled={!isDirty || update.isPending}>
            <Save size={14} className="mr-1" />
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <MemoryEditor
          value={content}
          onChange={setContent}
          data-testid="profile-editor"
        />
      </div>
    </div>
  );
}
