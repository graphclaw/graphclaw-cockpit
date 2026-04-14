import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LlmProvider {
  id: string;
  name: string;
  models: string[];
  enabled: boolean;
  budgetLimit: number;
  budgetUsed: number;
}

const MOCK_PROVIDERS: LlmProvider[] = [
  { id: 'llm-1', name: 'Anthropic', models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'], enabled: true, budgetLimit: 5000, budgetUsed: 2340 },
  { id: 'llm-2', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'], enabled: true, budgetLimit: 3000, budgetUsed: 1200 },
  { id: 'llm-3', name: 'Google', models: ['gemini-2.5-pro', 'gemini-2.5-flash'], enabled: false, budgetLimit: 2000, budgetUsed: 0 },
];

export function LlmConfigPage() {
  const [providers, setProviders] = useState(MOCK_PROVIDERS);

  function toggleProvider(id: string) {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">LLM Configuration</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text-primary)]">{provider.name}</span>
              <Badge variant={provider.enabled ? 'default' : 'outline'}>
                {provider.enabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            <div className="space-y-1">
              {provider.models.map((model) => (
                <div key={model} className="text-xs text-[var(--text-secondary)] font-mono">
                  {model}
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-[var(--text-tertiary)]">
                <span>Budget</span>
                <span>
                  ${provider.budgetUsed} / ${provider.budgetLimit}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-inset)]">
                <div
                  className="h-full rounded-full bg-[var(--brand-primary)]"
                  style={{
                    width: `${(provider.budgetUsed / provider.budgetLimit) * 100}%`,
                  }}
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => toggleProvider(provider.id)}
            >
              {provider.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
