import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Upload } from 'lucide-react';

export function SsoPage() {
  const [protocol, setProtocol] = useState<'oidc' | 'saml'>('oidc');
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  function handleTest() {
    setTestResult('success');
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Single Sign-On</h2>

      {/* Protocol selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setProtocol('oidc')}
          className={`rounded-[var(--radius-md)] px-4 py-2 text-sm ${
            protocol === 'oidc'
              ? 'bg-[var(--brand-primary)] text-white'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]'
          }`}
        >
          OIDC
        </button>
        <button
          onClick={() => setProtocol('saml')}
          className={`rounded-[var(--radius-md)] px-4 py-2 text-sm ${
            protocol === 'saml'
              ? 'bg-[var(--brand-primary)] text-white'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]'
          }`}
        >
          SAML
        </button>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-4">
        {protocol === 'oidc' ? (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">Issuer URL</label>
              <input
                type="url"
                placeholder="https://auth.example.com"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">Client ID</label>
              <input
                type="text"
                placeholder="your-client-id"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">Client Secret</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">Entity ID</label>
              <input
                type="text"
                placeholder="urn:example:saml:sp"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">SSO URL</label>
              <input
                type="url"
                placeholder="https://idp.example.com/saml/sso"
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
          <div className="flex items-center gap-2 text-xs text-[var(--state-success)]">
            <CheckCircle size={14} /> Connection test successful
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleTest}>
            Test Connection
          </Button>
          <Button size="sm" variant="outline">
            Save
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline">Status</Badge>
        <span className="text-sm text-[var(--text-secondary)]">SSO not configured</span>
      </div>
    </div>
  );
}
