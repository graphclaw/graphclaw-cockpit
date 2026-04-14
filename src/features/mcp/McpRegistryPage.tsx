import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, ShieldAlert, ShieldOff, Pencil, Trash2, Eye } from 'lucide-react';

type TrustTier = 'AUTO' | 'GATED' | 'BLOCKED';

interface McpServer {
  id: string;
  name: string;
  endpoint: string;
  trustTier: TrustTier;
  tools: number;
  status: 'connected' | 'disconnected';
}

const MOCK_SERVERS: McpServer[] = [
  { id: 'mcp-1', name: 'GitHub Actions', endpoint: 'https://mcp.github.com', trustTier: 'AUTO', tools: 12, status: 'connected' },
  { id: 'mcp-2', name: 'Jira Cloud', endpoint: 'https://mcp.atlassian.com', trustTier: 'GATED', tools: 8, status: 'connected' },
  { id: 'mcp-3', name: 'Custom Internal', endpoint: 'http://internal:9000', trustTier: 'AUTO', tools: 5, status: 'disconnected' },
  { id: 'mcp-4', name: 'Untrusted API', endpoint: 'https://unknown.api', trustTier: 'BLOCKED', tools: 3, status: 'disconnected' },
];

const TRUST_CONFIG: Record<TrustTier, { icon: typeof Shield; color: string; variant: 'active' | 'delayed' | 'blocked' }> = {
  AUTO: { icon: Shield, color: 'var(--state-active)', variant: 'active' },
  GATED: { icon: ShieldAlert, color: 'var(--state-delayed)', variant: 'delayed' },
  BLOCKED: { icon: ShieldOff, color: 'var(--state-blocked)', variant: 'blocked' },
};

export function McpRegistryPage() {
  const [servers] = useState(MOCK_SERVERS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">MCP Registry</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            {servers.filter((s) => s.status === 'connected').length} connected / {servers.length} registered
          </p>
        </div>
        <Button size="sm">Register Server</Button>
      </div>

      {/* Template Gallery */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Pre-built Adapters</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['GitHub', 'Jira', 'Slack', 'Linear', 'Notion', 'Google Drive', 'S3'].map((t) => (
            <Button key={t} size="sm" variant="outline" className="shrink-0">
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Server List */}
      <div className="space-y-3">
        {servers.map((server) => {
          const trust = TRUST_CONFIG[server.trustTier];
          const TrustIcon = trust.icon;
          return (
            <Card key={server.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <TrustIcon size={20} style={{ color: trust.color }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)]">{server.name}</span>
                      <Badge variant={trust.variant}>{server.trustTier}</Badge>
                      <Badge variant={server.status === 'connected' ? 'active' : 'outline'}>
                        {server.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {server.endpoint} &middot; {server.tools} tools
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
                  <Button size="sm" variant="ghost" title="Delete">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
