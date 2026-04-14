import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface InfraService {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: string;
  version: string;
}

const INFRA_SERVICES: InfraService[] = [
  { name: 'API Gateway', status: 'healthy', uptime: '99.97%', version: 'v2.1.0' },
  { name: 'PostgreSQL + AGE', status: 'healthy', uptime: '99.99%', version: '16.2' },
  { name: 'Redis', status: 'healthy', uptime: '99.99%', version: '7.2' },
  { name: 'MinIO Storage', status: 'healthy', uptime: '99.95%', version: 'RELEASE.2024-03' },
  { name: 'Task Scheduler', status: 'healthy', uptime: '99.90%', version: 'v1.4.0' },
  { name: 'SSE Event Stream', status: 'degraded', uptime: '98.50%', version: 'v1.2.1' },
];

const STATUS_COLORS: Record<string, string> = {
  healthy: 'var(--state-success)',
  degraded: 'var(--state-warning)',
  down: 'var(--state-error)',
};

export function InfraPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Infrastructure</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">Run Backup</Button>
          <Button size="sm" variant="outline">Run Migrations</Button>
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {INFRA_SERVICES.map((service) => (
          <div
            key={service.name}
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-[var(--text-primary)]">{service.name}</span>
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[service.status] }}
                title={service.status}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span>Uptime: {service.uptime}</span>
              <Badge variant="outline">{service.version}</Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Alarms */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Active Alarms</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--state-warning)]/10 px-3 py-2">
            <span className="text-sm text-[var(--state-warning)]">
              SSE Event Stream latency &gt; 500ms (p95)
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">Started 2h ago</span>
          </div>
        </div>
      </div>

      {/* Backups */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Recent Backups</h3>
        <div className="space-y-1 text-sm text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span>Full backup — 2026-04-14 03:00</span>
            <Badge variant="default">Complete</Badge>
          </div>
          <div className="flex justify-between">
            <span>Incremental — 2026-04-14 09:00</span>
            <Badge variant="default">Complete</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
