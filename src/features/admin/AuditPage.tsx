import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Search } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
}

const MOCK_ENTRIES: AuditEntry[] = [
  { id: 'a-1', timestamp: '2026-04-14T11:30:00Z', actor: 'alice@example.com', action: 'member.invite', resource: 'eve@example.com', result: 'success' },
  { id: 'a-2', timestamp: '2026-04-14T11:00:00Z', actor: 'bob@example.com', action: 'task.state_change', resource: 'task-42', result: 'success' },
  { id: 'a-3', timestamp: '2026-04-14T10:45:00Z', actor: 'system', action: 'agent.scored', resource: 'task-38', result: 'success' },
  { id: 'a-4', timestamp: '2026-04-14T10:30:00Z', actor: 'carol@example.com', action: 'settings.update', resource: 'scoring-weights', result: 'success' },
  { id: 'a-5', timestamp: '2026-04-14T10:15:00Z', actor: 'dave@example.com', action: 'auth.login', resource: 'session', result: 'failure' },
  { id: 'a-6', timestamp: '2026-04-14T09:00:00Z', actor: 'alice@example.com', action: 'mcp.register', resource: 'github-actions', result: 'success' },
];

export function AuditPage() {
  const [query, setQuery] = useState('');

  const filtered = MOCK_ENTRIES.filter(
    (e) =>
      e.actor.toLowerCase().includes(query.toLowerCase()) ||
      e.action.toLowerCase().includes(query.toLowerCase()) ||
      e.resource.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Audit Log</h2>
        <Button size="sm" variant="outline">
          <Download size={14} className="mr-1" /> Export CSV
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search audit log..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-3 text-sm"
        />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="grid grid-cols-[140px_150px_140px_1fr_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Time</span>
          <span>Actor</span>
          <span>Action</span>
          <span>Resource</span>
          <span>Result</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[140px_150px_140px_1fr_80px] items-center gap-4 px-4 py-3 text-sm"
            >
              <span className="text-xs text-[var(--text-tertiary)]">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">{entry.actor}</span>
              <span className="font-mono text-xs text-[var(--text-primary)]">{entry.action}</span>
              <span className="text-xs text-[var(--text-secondary)]">{entry.resource}</span>
              <Badge variant={entry.result === 'success' ? 'default' : 'outline'}>
                {entry.result}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
