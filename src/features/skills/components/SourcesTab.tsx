import { useState } from 'react';
import { Plus, Trash2, Globe, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRemoveSkillSource, useAddSkillSource, type SkillSource } from '@/lib/api-hooks';

interface SourcesTabProps {
  sources: SkillSource[];
}

export function SourcesTab({ sources }: SourcesTabProps) {
  const removeSource = useRemoveSkillSource();
  const addSource = useAddSkillSource();
  const [showAdd, setShowAdd] = useState(false);
  const [newUri, setNewUri] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('website');

  function handleAdd() {
    if (!newUri.trim()) return;
    addSource.mutate(
      { uri: newUri.trim(), name: newName.trim() || newUri.trim(), source_type: newType },
      {
        onSuccess: () => {
          setShowAdd(false);
          setNewUri('');
          setNewName('');
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Manage skill sources — GitHub repos and websites that publish skill indexes.
        </p>
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
          <Plus size={14} className="mr-1" /> Add Source
        </Button>
      </div>

      {/* Add Source Form */}
      {showAdd && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Add Skill Source</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Source URL *</label>
              <Input
                value={newUri}
                onChange={(e) => setNewUri(e.target.value)}
                placeholder="https://github.com/org/skills-repo"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Display Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Skills Repo"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-secondary)]">Source Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
            >
              <option value="website">Website (marketplace.json URL)</option>
              <option value="github">GitHub Repository</option>
              <option value="local">Local Path</option>
            </select>
          </div>
          {addSource.isError && (
            <p className="text-xs text-[var(--state-error)]">
              {(addSource.error as Error)?.message ?? 'Failed to add source. Check the URL and try again.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!newUri.trim() || addSource.isPending}>
              {addSource.isPending ? 'Adding…' : 'Add Source'}
            </Button>
          </div>
        </div>
      )}

      {/* Sources List */}
      {sources.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-10 text-center">
          <Globe size={32} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-tertiary)]">No skill sources registered.</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Add a GitHub repo or website that publishes a <code className="font-mono">marketplace.json</code> skill index.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((src) => (
            <SourceCard
              key={src.source_uri}
              source={src}
              onRemove={() => removeSource.mutate(src.source_uri)}
              removePending={removeSource.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SourceCardProps {
  source: SkillSource;
  onRemove: () => void;
  removePending: boolean;
}

function SourceCard({ source, onRemove, removePending }: SourceCardProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm text-[var(--text-primary)] truncate">{source.name}</div>
          <div className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{source.source_uri}</div>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {source.source_type.toUpperCase()}
        </Badge>
      </div>
      {source.last_fetched_at && (
        <div className="flex items-center gap-1 text-xs text-[var(--state-success)]">
          <CheckCircle size={12} />
          Last fetched {new Date(source.last_fetched_at).toLocaleDateString()}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="flex-1"
          disabled={removePending}
          onClick={onRemove}
        >
          <Trash2 size={12} className="mr-1" /> Remove
        </Button>
      </div>
    </div>
  );
}
