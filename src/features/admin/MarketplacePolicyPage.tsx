// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState, useEffect } from 'react';
import { Plus, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarketplacePolicy, useUpdateMarketplacePolicy } from '@/lib/api-hooks';

export function MarketplacePolicyPage() {
  const { data: policy, isLoading } = useMarketplacePolicy();
  const updatePolicy = useUpdateMarketplacePolicy();

  const [enabled, setEnabled] = useState(true);
  const [allowExternal, setAllowExternal] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [approvedSources, setApprovedSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState('');

  // Sync from API
  useEffect(() => {
    if (policy) {
      setEnabled(policy.enabled);
      setAllowExternal(policy.allow_external_sources);
      setRequireApproval(policy.require_approval_for_install);
      setApprovedSources(policy.approved_sources);
    }
  }, [policy]);

  function addSource() {
    const url = newSource.trim();
    if (!url || approvedSources.includes(url)) return;
    setApprovedSources((prev) => [...prev, url]);
    setNewSource('');
  }

  function removeSource(url: string) {
    setApprovedSources((prev) => prev.filter((s) => s !== url));
  }

  function handleSave() {
    updatePolicy.mutate({
      enabled,
      allow_external_sources: allowExternal,
      require_approval_for_install: requireApproval,
      approved_sources: approvedSources,
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Skill Marketplace Policy</h2>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Control which external skill sources users can search and install from.
          When the approved sources list is non-empty, users can only add sources from that list.
        </p>
      </div>

      {/* Toggles */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]">
        {[
          {
            key: 'enabled',
            label: 'Marketplace Access',
            description: 'Allow users to access the skill marketplace',
            value: enabled,
            onChange: setEnabled,
          },
          {
            key: 'allowExternal',
            label: 'External Sources',
            description: 'Allow users to add external skill sources (GitHub, websites)',
            value: allowExternal,
            onChange: setAllowExternal,
          },
          {
            key: 'requireApproval',
            label: 'Require Approval for Install',
            description: 'Skills require admin approval before being installed',
            value: requireApproval,
            onChange: setRequireApproval,
          },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{item.label}</div>
              <div className="text-xs text-[var(--text-tertiary)]">{item.description}</div>
            </div>
            <button
              onClick={() => item.onChange(!item.value)}
              role="switch"
              aria-checked={item.value}
              className={`h-5 w-9 rounded-full transition-colors ${
                item.value ? 'bg-[var(--state-active)]' : 'bg-[var(--border-default)]'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  item.value ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Approved Sources Allowlist */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Approved Source URLs</h3>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
            When set, users can only add skill sources from this list.
            Leave empty to allow any URL.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            placeholder="https://github.com/org/skills-repo or https://skills.example.com"
            onKeyDown={(e) => e.key === 'Enter' && addSource()}
            className="flex-1"
          />
          <Button size="sm" onClick={addSource} disabled={!newSource.trim()}>
            <Plus size={14} className="mr-1" /> Add URL
          </Button>
        </div>

        {approvedSources.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] p-6 text-center">
            <Globe size={24} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
            <p className="text-xs text-[var(--text-tertiary)]">
              No restrictions — users can add any skill source URL.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {approvedSources.map((url) => (
              <div
                key={url}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2"
              >
                <span className="text-sm font-mono text-[var(--text-primary)] truncate">{url}</span>
                <button
                  onClick={() => removeSource(url)}
                  className="ml-2 shrink-0 text-[var(--text-tertiary)] hover:text-[var(--state-error)]"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updatePolicy.isPending}>
          {updatePolicy.isPending ? 'Saving…' : 'Save Policy'}
        </Button>
      </div>
    </div>
  );
}
