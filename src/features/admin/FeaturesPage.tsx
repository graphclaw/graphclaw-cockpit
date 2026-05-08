// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useAdminFeatures, useUpdateAdminFeatures, type FeatureFlags } from '@/lib/api-hooks';

const FEATURE_META: {
  key: keyof Omit<FeatureFlags, 'extra'>;
  name: string;
  description: string;
}[] = [
  { key: 'enable_agent_canvas', name: 'Agent Canvas', description: 'Visual agent configuration and wiring hub' },
  { key: 'enable_mcp_integration', name: 'MCP Connectors', description: 'Enable MCP server integrations' },
  { key: 'enable_skill_marketplace', name: 'Skill Marketplace', description: 'Browse and install agent skills' },
  { key: 'enable_multi_channel', name: 'Multi-Channel', description: 'Inbound message channel support' },
  { key: 'enable_a2a', name: 'A2A Protocol', description: 'Agent-to-agent communication keys' },
];

export function FeaturesPage() {
  const { data: flags, isLoading } = useAdminFeatures();
  const update = useUpdateAdminFeatures();

  function toggleFlag(key: keyof Omit<FeatureFlags, 'extra'>) {
    if (!flags) return;
    update.mutate({ [key]: !flags[key] });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Feature Gates</h2>

      <div
        className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
        data-testid="feature-gates"
      >
        <div className="grid grid-cols-[1fr_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Feature</span>
          <span className="text-center">Enabled</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {FEATURE_META.map((meta) => {
            const enabled = flags ? flags[meta.key] : false;
            return (
              <div
                key={meta.key}
                className="grid grid-cols-[1fr_80px] items-center gap-4 px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{meta.name}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{meta.description}</div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => toggleFlag(meta.key)}
                    disabled={update.isPending}
                    className={`h-5 w-9 rounded-full transition-colors ${
                      enabled ? 'bg-[var(--state-active)]' : 'bg-[var(--border-default)]'
                    }`}
                    data-testid={`toggle-${meta.key}`}
                    aria-checked={enabled}
                    role="switch"
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
