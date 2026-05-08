// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { useAdminConnectors, useSyncConnector } from '@/lib/api-hooks';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  connected: { bg: 'bg-[var(--state-success)]/10', text: 'text-[var(--state-success)]' },
  error: { bg: 'bg-[var(--state-error)]/10', text: 'text-[var(--state-error)]' },
  syncing: { bg: 'bg-[var(--state-info)]/10', text: 'text-[var(--state-info)]' },
};

export function ConnectorsPage() {
  const { data: connectors = [], isLoading } = useAdminConnectors();
  const syncConnector = useSyncConnector();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Connectors</h2>
        <Button size="sm">Add Connector</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : connectors.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-[var(--text-tertiary)]">
          No connectors configured.
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="grid grid-cols-[1fr_100px_100px_140px_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Connector</span>
            <span>Type</span>
            <span>Status</span>
            <span>Last Sync</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {connectors.map((conn) => {
              const style = STATUS_STYLES[conn.status] ?? { bg: '', text: '' };
              return (
                <div
                  key={conn.connector_id}
                  className="grid grid-cols-[1fr_100px_100px_140px_80px] items-center gap-4 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-[var(--text-primary)]">{conn.name}</span>
                  <Badge variant="outline">{conn.type}</Badge>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${style.bg} ${style.text}`}>
                    {conn.status}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {conn.last_sync ? new Date(conn.last_sync).toLocaleString() : '—'}
                  </span>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Sync Now"
                      onClick={() => syncConnector.mutate(conn.connector_id)}
                      disabled={syncConnector.isPending}
                    >
                      <RefreshCw size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
