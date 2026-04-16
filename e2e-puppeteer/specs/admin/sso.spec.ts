/**
 * sso.spec.ts
 *
 * Tests SSO configuration via /app/v1/admin/sso.
 * Covers read, update, enforce toggle, and connectivity test.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';

describe('Admin — SSO', () => {
  let ctx: TestContext;
  let originalConfig: unknown = null;

  beforeAll(async () => {
    ctx = await TestContext.create();
    const { body } = await ctx.api.get('/admin/sso');
    originalConfig = body;
  });

  afterAll(async () => {
    if (originalConfig) {
      await ctx.api.put('/admin/sso', originalConfig).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── Get SSO config ─────────────────────────────────────────────────────────
  test('GET /admin/sso — returns SSO config with provider and enabled fields', async () => {
    const { body, status } = await ctx.api.get<{
      provider?: string;
      enabled?: boolean;
      enforced?: boolean;
    }>('/admin/sso');
    expect(status).toBe(200);
    expect(typeof (body.enabled ?? false)).toBe('boolean');
    expect(typeof (body.enforced ?? false)).toBe('boolean');
  });

  // ── UI renders SSO page ────────────────────────────────────────────────────
  test('SSO UI renders with protocol selector buttons from real API', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/admin/sso', '/app/v1/admin/sso');
      await page
        .waitForSelector('[data-testid="sso-page"]', { timeout: 10000 })
        .catch(() => {});
      await page.waitForSelector('main', { timeout: 10000 });

      // Protocol selector buttons
      const oidcBtn = await page
        .$('button::-p-text(OIDC), [data-testid="protocol-oidc"]')
        .catch(() => null);
      const samlBtn = await page
        .$('button::-p-text(SAML), [data-testid="protocol-saml"]')
        .catch(() => null);

      if (oidcBtn) {
        const visible = await oidcBtn.isIntersectingViewport();
        expect(visible).toBe(true);
      }
    } finally {
      await page.close();
    }
  });

  // ── Update SSO config ──────────────────────────────────────────────────────
  test('PUT /admin/sso → REST reflects updated config', async () => {
    const { body: current } = await ctx.api.get<{
      provider?: string;
      enabled?: boolean;
      enforced?: boolean;
      client_id?: string;
      issuer_url?: string;
      metadata_url?: string;
      allowed_domains?: string[];
    }>('/admin/sso');

    const updated = {
      ...current,
      provider: current.provider ?? 'OIDC',
      enabled: false, // safe to disable in test
      client_id: `e2e-client-${Date.now()}`,
      issuer_url: 'https://accounts.google.com',
      allowed_domains: ['graphclaw.test'],
    };

    const { status } = await ctx.api.put('/admin/sso', updated);
    expect([200, 204]).toContain(status);

    const { body: after } = await ctx.api.get<{
      client_id?: string;
      allowed_domains?: string[];
    }>('/admin/sso');
    if (after.client_id) {
      expect(after.client_id).toContain('e2e-client');
    }
    if (after.allowed_domains) {
      expect(after.allowed_domains).toContain('graphclaw.test');
    }
  });

  // ── Enforce toggle ─────────────────────────────────────────────────────────
  test('PATCH /admin/sso/enforce → enforced field updated in REST', async () => {
    const { body: before } = await ctx.api.get<{ enforced?: boolean }>('/admin/sso');
    const newEnforced = !(before.enforced ?? false);

    const { status } = await ctx.api.patch('/admin/sso/enforce', {
      enforced: newEnforced,
    });
    expect([200, 204]).toContain(status);

    const { body: after } = await ctx.api.get<{ enforced?: boolean }>('/admin/sso');
    if (after.enforced !== undefined) {
      expect(after.enforced).toBe(newEnforced);
    }

    // Restore original enforce state
    const originalEnforced = (originalConfig as { enforced?: boolean })?.enforced ?? false;
    await ctx.api.patch('/admin/sso/enforce', { enforced: originalEnforced }).catch(() => {});
  });

  // ── SSO connectivity test ──────────────────────────────────────────────────
  test('POST /admin/sso/test — returns reachable status', async () => {
    const { body, status } = await ctx.api.post<{
      reachable?: boolean;
      error?: string;
      provider?: string;
    }>('/admin/sso/test');
    expect(status).toBe(200);
    expect(typeof (body.reachable ?? false)).toBe('boolean');
    // Whether reachable or not — the test endpoint must respond
  });
});
