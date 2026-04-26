import type { Page } from 'puppeteer';

// ── Constants ─────────────────────────────────────────────────────────────────
// Matches GRAPHCLAW_USER_ID in docker-compose and auth.fixture.ts
export const TEST_USER_ID = 'USER-dev-001';
export const API_BASE = process.env.API_URL ?? 'http://localhost:8000';
export const APP_BASE = process.env.BASE_URL ?? 'http://localhost:3000';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DevTokenResult {
  access_token: string;
  refresh_token: string;
}

// ── Token fetch ───────────────────────────────────────────────────────────────
/**
 * Obtains a dev access token from the real FastAPI backend.
 * Includes a 1-second delay to stay under the 300 req/min rate limit —
 * mirrors the preamble in e2e/fixtures/auth.fixture.ts.
 */
export async function getDevToken(): Promise<DevTokenResult> {
  await new Promise<void>((r) => setTimeout(r, 1000));
  const res = await fetch(`${API_BASE}/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: TEST_USER_ID }),
  });
  if (!res.ok) {
    throw new Error(`getDevToken failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<DevTokenResult>;
}

// ── Browser auth injection ────────────────────────────────────────────────────
/**
 * Injects the same three localStorage keys that the cockpit's Zustand
 * auth store uses, then reloads the page so React re-reads the store.
 * Matches exactly what auth.fixture.ts does in the Playwright suite.
 */
export async function injectLocalStorage(
  page: Page,
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await page.evaluate(
    ({ access, refresh, userId }: { access: string; refresh: string; userId: string }) => {
      localStorage.setItem('gc-access-token', access);
      localStorage.setItem('gc-refresh-token', refresh);
      localStorage.setItem(
        'gc-auth',
        JSON.stringify({
          state: {
            accessToken: access,
            refreshToken: refresh,
            userId,
            role: 'ADMIN',
            displayName: null,
            email: null,
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
    },
    { access: accessToken, refresh: refreshToken, userId: TEST_USER_ID },
  );
  await page.reload({ waitUntil: 'networkidle0' });
}
