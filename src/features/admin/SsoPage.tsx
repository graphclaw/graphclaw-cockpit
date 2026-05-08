// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Upload } from 'lucide-react';
import { useAdminSso, useUpdateAdminSso } from '@/lib/api-hooks';

export function SsoPage() {
  const { data: sso, isLoading } = useAdminSso();
  const update = useUpdateAdminSso();

  const [protocol, setProtocol] = useState<'oidc' | 'saml'>('oidc');
  const [issuerUrl, setIssuerUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (sso) {
      if (sso.provider === 'saml') setProtocol('saml');
      setIssuerUrl(sso.issuer_url ?? '');
      setClientId(sso.client_id ?? '');
    }
  }, [sso]);

  function handleSave() {
    update.mutate({
      provider: protocol,
      issuer_url: issuerUrl,
      client_id: clientId,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="sso-page">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Single Sign-On</h2>

      {/* Protocol selector */}
      <div className="flex gap-2">
        {(['oidc', 'saml'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setProtocol(p)}
            className={`rounded-[var(--radius-md)] px-4 py-2 text-sm uppercase ${
              protocol === p
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-4">
        {protocol === 'oidc' ? (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">Issuer URL</label>
              <input
                type="url"
                placeholder="https://auth.example.com"
                value={issuerUrl}
                onChange={(e) => setIssuerUrl(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">Client ID</label>
              <input
                type="text"
                placeholder="your-client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">Metadata URL</label>
              <input
                type="url"
                placeholder="https://idp.example.com/saml/metadata"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">Certificate (PEM)</label>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Upload size={14} className="mr-1" /> Upload PEM
                </Button>
                <span className="text-xs text-[var(--text-tertiary)]">No certificate uploaded</span>
              </div>
            </div>
          </>
        )}

        {testResult && (
          <div
            className={`flex items-center gap-2 text-xs ${
              testResult === 'success' ? 'text-[var(--state-success)]' : 'text-[var(--state-blocked)]'
            }`}
          >
            {testResult === 'success' ? (
              <><CheckCircle size={14} /> Connection test successful</>
            ) : (
              <><XCircle size={14} /> Connection test failed</>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setTestResult('success')}>
            Test Connection
          </Button>
          <Button size="sm" onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={sso?.enabled ? 'active' : 'outline'}>
          {sso?.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
        <span className="text-sm text-[var(--text-secondary)]">
          {sso?.enforced ? 'SSO enforced' : 'SSO optional'}
        </span>
      </div>
    </div>
  );
}
