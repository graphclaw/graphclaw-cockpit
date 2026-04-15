import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Search } from 'lucide-react';
import { useAdminAuditLog } from '@/lib/api-hooks';

export function AuditPage() {
  const { data: entries = [], isLoading } = useAdminAuditLog(100);
  const [query, setQuery] = useState('');

  const filtered = entries.filter(
    (e) =>
      e.actor.toLowerCase().includes(query.toLowerCase()) ||
      e.action.toLowerCase().includes(query.toLowerCase()) ||
      (e.resource ?? '').toLowerCase().includes(query.toLowerCase()),
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : (
        <div
          className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
          data-testid="audit-log"
        >
          <div className="grid grid-cols-[140px_150px_140px_1fr_80px] gap-4 border-b border-[var(--border-default)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Time</span>
            <span>Actor</span>
            <span>Action</span>
            <span>Resource</span>
            <span>Result</span>
          </div>
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--text-tertiary)] text-center">
              No audit entries yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((entry, i) => (
                <div
                  key={i}
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
          )}
        </div>
      )}
    </div>
  );
}
