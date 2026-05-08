// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore, type UserRole } from '@/stores/auth';
import { useNavigate, useLocation } from 'react-router';
import { useState } from 'react';

const PROVIDERS = [
  { id: 'google', name: 'Google', color: '#4285F4' },
  { id: 'github', name: 'GitHub', color: '#333333' },
  { id: 'microsoft', name: 'Microsoft', color: '#00A4EF' },
] as const;

const DEV_AUTH_ENABLED = import.meta.env.VITE_ENABLE_DEV_AUTH === 'true';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [devUserId, setDevUserId] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  function handleOAuthLogin(provider: string) {
    window.location.href = `/auth/login?provider=${provider}`;
  }

  async function handleDevLogin() {
    setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (devUserId.trim()) body.user_id = devUserId.trim();

      const res = await fetch('/auth/dev-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          access_token: string;
          refresh_token: string;
          user_id: string;
          role: string;
        };
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
        useAuthStore.getState().setUser(data.user_id, data.role as UserRole);
        navigate(from, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src="/logo.svg" alt="GraphClaw" className="mb-2 h-16 w-16" />
          <CardTitle>GraphClaw Cockpit</CardTitle>
          <CardDescription>Sign in to your workspace</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {PROVIDERS.map((p) => (
            <Button
              key={p.id}
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin(p.id)}
            >
              Sign in with {p.name}
            </Button>
          ))}

          {DEV_AUTH_ENABLED && (
            <>
              <div className="my-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-[var(--border-default)]" />
                <span className="text-xs text-[var(--text-tertiary)]">DEV ONLY</span>
                <div className="h-px flex-1 bg-[var(--border-default)]" />
              </div>

              <Input
                placeholder="User ID (optional — leave blank for default)"
                value={devUserId}
                onChange={(e) => setDevUserId(e.target.value)}
                className="font-mono text-xs"
              />

              <Button variant="secondary" onClick={handleDevLogin} disabled={loading}>
                {loading ? 'Signing in...' : 'Dev Token (Development)'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
