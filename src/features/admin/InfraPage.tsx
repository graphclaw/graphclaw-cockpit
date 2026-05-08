// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminDeploymentStatus } from '@/lib/api-hooks';

const HEALTH_COLORS: Record<string, string> = {
  healthy: 'var(--state-success)',
  ok: 'var(--state-success)',
  degraded: 'var(--state-warning)',
  down: 'var(--state-error)',
  unknown: 'var(--text-tertiary)',
};

export function InfraPage() {
  const { data: deploy, isLoading } = useAdminDeploymentStatus();
  const services = deploy?.services ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Infrastructure</h2>
          {deploy && (
            <p className="text-xs text-[var(--text-tertiary)]">
              {deploy.environment} · v{deploy.version} · {deploy.overall}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">Run Backup</Button>
          <Button size="sm" variant="outline">Run Migrations</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[var(--text-primary)]">{service.name}</span>
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: HEALTH_COLORS[service.health ?? 'unknown'] }}
                  title={service.health ?? 'unknown'}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                {service.replicas !== undefined && (
                  <span>{service.replicas}/{service.desired ?? '?'} replicas</span>
                )}
                {service.last_deployed && (
                  <Badge variant="outline">{new Date(service.last_deployed).toLocaleDateString()}</Badge>
                )}
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <p className="col-span-3 text-center text-sm text-[var(--text-tertiary)] py-6">
              No service health data available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
