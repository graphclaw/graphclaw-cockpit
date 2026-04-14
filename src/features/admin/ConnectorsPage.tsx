import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

interface Connector {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'error' | 'syncing';
  lastSync: string;
}

const MOCK_CONNECTORS: Connector[] = [
  { id: 'c-1', name: 'GitHub', type: 'Code', status: 'connected', lastSync: '2026-04-14T11:00:00Z' },
  { id: 'c-2', name: 'Jira Cloud', type: 'Project', status: 'connected', lastSync: '2026-04-14T10:30:00Z' },
  { id: 'c-3', name: 'Slack', type: 'Communication', status: 'connected', lastSync: '2026-04-14T11:05:00Z' },
  { id: 'c-4', name: 'Confluence', type: 'Knowledge', status: 'error', lastSync: '2026-04-13T16:00:00Z' },
  { id: 'c-5', name: 'Linear', type: 'Project', status: 'connected', lastSync: '2026-04-14T10:45:00Z' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  connected: { bg: 'bg-[var(--state-success)]/10', text: 'text-[var(--state-success)]' },
  error: { bg: 'bg-[var(--state-error)]/10', text: 'text-[var(--state-error)]' },
  syncing: { bg: 'bg-[var(--state-info)]/10', text: 'text-[var(--state-info)]' },
};

export function ConnectorsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Connectors</h2>
        <Button size="sm">Add Connector</Button>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="grid grid-cols-[1fr_100px_100px_140px_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Connector</span>
          <span>Type</span>
          <span>Status</span>
          <span>Last Sync</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {MOCK_CONNECTORS.map((conn) => {
            const style = STATUS_STYLES[conn.status];
            return (
              <div
                key={conn.id}
                className="grid grid-cols-[1fr_100px_100px_140px_80px] items-center gap-4 px-4 py-3 text-sm"
              >
                <span className="font-medium text-[var(--text-primary)]">{conn.name}</span>
                <Badge variant="outline">{conn.type}</Badge>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${style.bg} ${style.text}`}>
                  {conn.status}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {new Date(conn.lastSync).toLocaleString()}
                </span>
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" title="Sync Now">
                    <RefreshCw size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
