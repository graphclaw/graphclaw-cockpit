import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, RotateCw, Trash2 } from 'lucide-react';

interface A2aKey {
  id: string;
  label: string;
  prefix: string;
  created: string;
  status: 'active' | 'revoked';
}

const MOCK_KEYS: A2aKey[] = [
  { id: '1', label: 'Production Key', prefix: 'gc_a2a_prod_****', created: '2026-03-01', status: 'active' },
  { id: '2', label: 'Staging Key', prefix: 'gc_a2a_stg_****', created: '2026-02-15', status: 'active' },
];

export function A2aPage() {
  const [keys, setKeys] = useState(MOCK_KEYS);
  const [newKeyShown, setNewKeyShown] = useState<string | null>(null);

  function handleGenerate() {
    const fakeKey = `gc_a2a_${Math.random().toString(36).slice(2, 14)}`;
    setNewKeyShown(fakeKey);
    setKeys((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        label: 'New Key',
        prefix: fakeKey.slice(0, 12) + '****',
        created: new Date().toISOString().split('T')[0] ?? '',
        status: 'active',
      },
    ]);
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
        <Button size="sm" onClick={handleGenerate}>Generate Key</Button>
      </div>

      {newKeyShown && (
        <Card className="border-[var(--state-delayed)]">
          <CardContent className="flex items-center gap-3 py-3">
            <span className="text-sm text-[var(--state-delayed)] font-medium">
              New key (shown once):
            </span>
            <code className="flex-1 rounded bg-[var(--bg-inset)] px-2 py-1 font-mono text-sm text-[var(--text-primary)]">
              {newKeyShown}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(newKeyShown)}
            >
              <Copy size={14} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setNewKeyShown(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {keys.map((key) => (
          <Card key={key.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{key.label}</div>
                  <code className="text-xs text-[var(--text-tertiary)]">{key.prefix}</code>
                </div>
                <Badge variant={key.status === 'active' ? 'active' : 'blocked'}>
                  {key.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--text-tertiary)]">{key.created}</span>
                <Button size="sm" variant="ghost" title="Rotate">
                  <RotateCw size={14} />
                </Button>
                <Button size="sm" variant="ghost" title="Revoke">
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
