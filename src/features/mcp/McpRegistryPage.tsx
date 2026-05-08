// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { type FormEvent, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Shield, ShieldAlert, ShieldOff, Pencil, Trash2, Eye } from 'lucide-react';
import {
  useMcpServers,
  useDeleteMcpServer,
  useRegisterMcpServer,
  type McpServer,
  type RegisterMcpServerInput,
} from '@/lib/api-hooks';

type TrustTier = 'AUTO' | 'GATED' | 'BLOCKED';

const TRUST_CONFIG: Record<TrustTier, { icon: typeof Shield; color: string; variant: 'active' | 'delayed' | 'blocked' }> = {
  AUTO: { icon: Shield, color: 'var(--state-active)', variant: 'active' },
  GATED: { icon: ShieldAlert, color: 'var(--state-delayed)', variant: 'delayed' },
  BLOCKED: { icon: ShieldOff, color: 'var(--state-blocked)', variant: 'blocked' },
};

type Transport = 'stdio' | 'sse' | 'http';

interface RegisterFormState {
  name: string;
  transport: Transport;
  endpoint_url: string;
  command: string;
  trust_tier: TrustTier;
  scope: string;
}

const DEFAULT_REGISTER_FORM: RegisterFormState = {
  name: '',
  transport: 'http',
  endpoint_url: '',
  command: '',
  trust_tier: 'GATED',
  scope: '',
};

const GDRIVE_DOCKER_COMMAND =
  'docker run -i --rm -v mcp-gdrive:/gdrive-server -e GDRIVE_CREDENTIALS_PATH=/gdrive-server/credentials.json mcp/gdrive';

function resolveStatus(server: McpServer): 'connected' | 'disconnected' | 'error' {
  if (server.status) {
    return server.status;
  }
  return server.enabled ? 'connected' : 'disconnected';
}

function resolveEndpointLabel(server: McpServer): string {
  if (server.transport === 'stdio') {
    return server.command ?? 'No command configured';
  }
  return server.endpoint_url ?? server.endpoint ?? 'No endpoint configured';
}

function ServerCard({ server, onDelete }: { server: McpServer; onDelete: (id: string) => void }) {
  const tier = (server.trust_tier ?? 'GATED') as TrustTier;
  const trust = TRUST_CONFIG[tier] ?? TRUST_CONFIG['GATED'];
  const TrustIcon = trust.icon;
  const status = resolveStatus(server);
  const endpointLabel = resolveEndpointLabel(server);

  return (
    <Card data-testid={`mcp-server-${server.server_id}`}>
      <CardContent className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <TrustIcon size={20} style={{ color: trust.color }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--text-primary)]">{server.name}</span>
              <Badge variant={trust.variant}>{tier}</Badge>
              <Badge variant={status === 'connected' ? 'active' : 'outline'}>
                {status}
              </Badge>
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              {endpointLabel} &middot; {server.transport.toUpperCase()}
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
  const registerServer = useRegisterMcpServer();

  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(DEFAULT_REGISTER_FORM);

  const connected = useMemo(
    () => servers.filter((s) => resolveStatus(s) === 'connected').length,
    [servers],
  );

  function updateRegisterForm<K extends keyof RegisterFormState>(
    key: K,
    value: RegisterFormState[K],
  ) {
    setRegisterForm((prev) => ({ ...prev, [key]: value }));
  }

  function openRegisterForm(preset?: Partial<RegisterFormState>) {
    setShowRegisterForm(true);
    setRegisterError(null);
    setRegisterForm({ ...DEFAULT_REGISTER_FORM, ...preset });
  }

  function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterError(null);

    const name = registerForm.name.trim();
    const endpointUrl = registerForm.endpoint_url.trim();
    const command = registerForm.command.trim();

    if (!name) {
      setRegisterError('Server name is required.');
      return;
    }

    if (registerForm.transport === 'stdio' && !command) {
      setRegisterError('Command is required for stdio transport.');
      return;
    }

    if (registerForm.transport !== 'stdio' && !endpointUrl) {
      setRegisterError('Endpoint URL is required for HTTP/SSE transport.');
      return;
    }

    const payload: RegisterMcpServerInput = {
      name,
      transport: registerForm.transport,
      trust_tier: registerForm.trust_tier,
      scope: registerForm.scope
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
      ...(registerForm.transport === 'stdio'
        ? { command }
        : { endpoint_url: endpointUrl }),
    };

    registerServer.mutate(payload, {
      onSuccess: () => {
        setShowRegisterForm(false);
        setRegisterForm(DEFAULT_REGISTER_FORM);
      },
      onError: (error) => {
        setRegisterError(error instanceof Error ? error.message : 'Failed to register MCP server.');
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">MCP Registry</h1>
          <p className="text-sm text-[var(--text-tertiary)]" data-testid="mcp-count">
            {connected} connected / {servers.length} registered
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowRegisterForm((open) => !open)}
          data-testid="register-server-btn"
        >
          {showRegisterForm ? 'Close' : 'Register Server'}
        </Button>
      </div>

      {showRegisterForm && (
        <Card data-testid="register-server-form">
          <CardContent className="space-y-4 py-4">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Register MCP Server</h2>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleRegisterSubmit}>
              <label className="space-y-1 sm:col-span-2" htmlFor="mcp-register-name">
                <span className="text-xs text-[var(--text-secondary)]">Server Name</span>
                <Input
                  id="mcp-register-name"
                  data-testid="mcp-register-name"
                  value={registerForm.name}
                  onChange={(e) => updateRegisterForm('name', e.target.value)}
                  placeholder="Google Drive"
                />
              </label>

              <label className="space-y-1" htmlFor="mcp-register-transport">
                <span className="text-xs text-[var(--text-secondary)]">Transport</span>
                <select
                  id="mcp-register-transport"
                  data-testid="mcp-register-transport"
                  value={registerForm.transport}
                  onChange={(e) => updateRegisterForm('transport', e.target.value as Transport)}
                  className="flex h-9 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-[var(--text-body-sm)] text-[var(--text-primary)]"
                >
                  <option value="http">HTTP</option>
                  <option value="sse">SSE</option>
                  <option value="stdio">STDIO</option>
                </select>
              </label>

              <label className="space-y-1" htmlFor="mcp-register-trust-tier">
                <span className="text-xs text-[var(--text-secondary)]">Trust Tier</span>
                <select
                  id="mcp-register-trust-tier"
                  data-testid="mcp-register-trust-tier"
                  value={registerForm.trust_tier}
                  onChange={(e) => updateRegisterForm('trust_tier', e.target.value as TrustTier)}
                  className="flex h-9 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-[var(--text-body-sm)] text-[var(--text-primary)]"
                >
                  <option value="AUTO">AUTO</option>
                  <option value="GATED">GATED</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </label>

              {registerForm.transport === 'stdio' ? (
                <label className="space-y-1 sm:col-span-2" htmlFor="mcp-register-command">
                  <span className="text-xs text-[var(--text-secondary)]">Command</span>
                  <Input
                    id="mcp-register-command"
                    data-testid="mcp-register-command"
                    value={registerForm.command}
                    onChange={(e) => updateRegisterForm('command', e.target.value)}
                    placeholder="docker run -i --rm mcp/gdrive"
                  />
                </label>
              ) : (
                <label className="space-y-1 sm:col-span-2" htmlFor="mcp-register-endpoint">
                  <span className="text-xs text-[var(--text-secondary)]">Endpoint URL</span>
                  <Input
                    id="mcp-register-endpoint"
                    data-testid="mcp-register-endpoint"
                    value={registerForm.endpoint_url}
                    onChange={(e) => updateRegisterForm('endpoint_url', e.target.value)}
                    placeholder="http://localhost:3001/mcp"
                  />
                </label>
              )}

              <label className="space-y-1 sm:col-span-2" htmlFor="mcp-register-scope">
                <span className="text-xs text-[var(--text-secondary)]">Scope (comma-separated)</span>
                <Input
                  id="mcp-register-scope"
                  data-testid="mcp-register-scope"
                  value={registerForm.scope}
                  onChange={(e) => updateRegisterForm('scope', e.target.value)}
                  placeholder="gdrive.readonly"
                />
              </label>

              {registerError && (
                <p className="text-xs text-[var(--state-blocked)] sm:col-span-2" data-testid="mcp-register-error">
                  {registerError}
                </p>
              )}

              <div className="flex gap-2 sm:col-span-2 sm:justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  data-testid="register-server-submit"
                  disabled={registerServer.isPending}
                >
                  {registerServer.isPending ? 'Registering…' : 'Register'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Template Gallery */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">Pre-built Adapters</h2>
        <div className="flex gap-2 overflow-x-auto pb-2" data-testid="adapter-gallery">
          {['GitHub', 'Jira', 'Slack', 'Linear', 'Notion', 'Google Drive', 'S3'].map((t) => (
            <Button
              key={t}
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                if (t === 'Google Drive') {
                  openRegisterForm({
                    name: 'Google Drive',
                    transport: 'stdio',
                    command: GDRIVE_DOCKER_COMMAND,
                    trust_tier: 'AUTO',
                    scope: 'gdrive.readonly',
                  });
                  return;
                }
                openRegisterForm({ name: t });
              }}
            >
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
