import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  models: string[];
  status: 'configured' | 'not_configured';
}

const PROVIDERS: Provider[] = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'], status: 'configured' },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'], status: 'configured' },
  { id: 'google', name: 'Google AI', models: ['gemini-2.0-flash'], status: 'not_configured' },
];

export function LlmPage() {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">LLM Providers</h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          Manage API keys and model selection for LLM providers.
        </p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map((provider) => (
          <Card key={provider.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{provider.name}</CardTitle>
              <Badge variant={provider.status === 'configured' ? 'active' : 'outline'}>
                {provider.status === 'configured' ? 'Configured' : 'Not configured'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-tertiary)]">
                  API Key (BYOK)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKey[provider.id] ? 'text' : 'password'}
                      placeholder="sk-..."
                      defaultValue={provider.status === 'configured' ? '••••••••••••' : ''}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKey((s) => ({ ...s, [provider.id]: !s[provider.id] }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                    >
                      {showKey[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <Button size="sm" variant="outline">
                    Save
                  </Button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-tertiary)]">
                  Available Models
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {provider.models.map((m) => (
                    <span
                      key={m}
                      className="rounded-[var(--radius-sm)] bg-[var(--bg-inset)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
