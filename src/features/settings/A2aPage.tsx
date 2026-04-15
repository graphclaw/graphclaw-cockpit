import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, RotateCw, Trash2 } from 'lucide-react';
import { useA2aAgents, useCreateA2aAgent, useRevokeA2aAgent } from '@/lib/api-hooks';

export function A2aPage() {
  const { data: agents = [], isLoading } = useA2aAgents();
  const create = useCreateA2aAgent();
  const revoke = useRevokeA2aAgent();
  const [newSecret, setNewSecret] = useState<string | null>(null);

  function handleGenerate() {
    create.mutate('New Key', {
      onSuccess: (data) => {
        if ('secret' in data) {
          setNewSecret((data as { key_id: string; secret: string }).secret);
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Agent-to-Agent Keys</h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            Manage keys for agent-to-agent authentication.
          </p>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={create.isPending}>
          Generate Key
        </Button>
      </div>

      {newSecret && (
        <Card className="border-[var(--state-delayed)]">
          <CardContent className="flex items-center gap-3 py-3">
            <span className="text-sm text-[var(--state-delayed)] font-medium">
              New key (shown once):
            </span>
            <code className="flex-1 rounded bg-[var(--bg-inset)] px-2 py-1 font-mono text-sm text-[var(--text-primary)]">
              {newSecret}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void navigator.clipboard.writeText(newSecret)}
            >
              <Copy size={14} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setNewSecret(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : agents.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">No A2A keys registered yet.</p>
      ) : (
        <div className="space-y-3" data-testid="a2a-keys-list">
          {agents.map((agent) => (
            <Card key={agent.key_id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{agent.name}</div>
                    <code className="text-xs text-[var(--text-tertiary)]">{agent.key_id}</code>
                  </div>
                  <Badge variant={agent.active ? 'active' : 'blocked'}>
                    {agent.active ? 'active' : 'revoked'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {agent.created_at.slice(0, 10)}
                  </span>
                  <Button size="sm" variant="ghost" title="Rotate">
                    <RotateCw size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Revoke"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(agent.key_id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
