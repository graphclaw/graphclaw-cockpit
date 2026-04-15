import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, ShieldAlert, ShieldOff, Pencil, Trash2, Eye } from 'lucide-react';
import { useMcpServers, useDeleteMcpServer, type McpServer } from '@/lib/api-hooks';

type TrustTier = 'AUTO' | 'GATED' | 'BLOCKED';

const TRUST_CONFIG: Record<TrustTier, { icon: typeof Shield; color: string; variant: 'active' | 'delayed' | 'blocked' }> = {
  AUTO: { icon: Shield, color: 'var(--state-active)', variant: 'active' },
  GATED: { icon: ShieldAlert, color: 'var(--state-delayed)', variant: 'delayed' },
  BLOCKED: { icon: ShieldOff, color: 'var(--state-blocked)', variant: 'blocked' },
};

function ServerCard({ server, onDelete }: { server: McpServer; onDelete: (id: string) => void }) {
  const tier = (server.trust_tier ?? 'GATED') as TrustTier;
  const trust = TRUST_CONFIG[tier] ?? TRUST_CONFIG['GATED'];
  const TrustIcon = trust.icon;
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <TrustIcon size={20} style={{ color: trust.color }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--text-primary)]">{server.name}</span>
              <Badge variant={trust.variant}>{tier}</Badge>
              <Badge variant={server.status === 'connected' ? 'active' : 'outline'}>
                {server.status}
              </Badge>
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              {server.endpoint} &middot; {server.tool_count ?? 0} tools
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" title="View tools">
            <Eye size={14} />
          </Button>
          <Button size="sm" variant="ghost" title="Edit">
            <Pencil size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title="Delete"
            onClick={() => onDelete(server.server_id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function McpRegistryPage() {
  const { data: servers = [], isLoading } = useMcpServers();
  const deleteServer = useDeleteMcpServer();

  const connected = servers.filter((s) => s.status === 'connected').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">MCP Registry</h1>
          <p className="text-sm text-[var(--text-tertiary)]" data-testid="mcp-count">
            {connected} connected / {servers.length} registered
          </p>
        </div>
        <Button size="sm">Register Server</Button>
      </div>

      {/* Template Gallery */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Pre-built Adapters</h2>
        <div className="flex gap-2 overflow-x-auto pb-2" data-testid="adapter-gallery">
          {['GitHub', 'Jira', 'Slack', 'Linear', 'Notion', 'Google Drive', 'S3'].map((t) => (
            <Button key={t} size="sm" variant="outline" className="shrink-0">
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Server List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : servers.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
          No MCP servers registered yet.
        </p>
      ) : (
        <div className="space-y-3" data-testid="mcp-server-list">
          {servers.map((server) => (
            <ServerCard
              key={server.server_id}
              server={server}
              onDelete={(id) => deleteServer.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
