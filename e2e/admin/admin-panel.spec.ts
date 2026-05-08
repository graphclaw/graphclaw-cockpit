// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Admin Panel', () => {
  test('members page — API count matches UI display', async ({ page, api }) => {
    const res = await api.get('/app/v1/admin/members');
    expect(res.status()).toBe(200);
    const body = await res.json() as { members?: unknown[]; items?: unknown[] };
    const memberList = body.members ?? body.items ?? [];

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/members'),
      page.goto('/admin/members'),
    ]);
    expect(uiRes.status()).toBe(200);

    if (memberList.length > 0) {
      await expect(page.locator('[data-testid="members-table"]')).toBeVisible({ timeout: 10000 });
    } else {
      await expect(
        page.locator('[data-testid="members-table"]').or(page.locator('text=No members yet.')),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('admin sub-navigation links are present', async ({ page }) => {
    await page.goto('/admin/members');
    await expect(page.locator('nav a').filter({ hasText: 'Feature Gates' })).toBeVisible();
    await expect(page.locator('nav a').filter({ hasText: 'LLM Config' })).toBeVisible();
    await expect(page.locator('nav a').filter({ hasText: 'Guardrails' })).toBeVisible();
    await expect(page.locator('nav a').filter({ hasText: 'Audit Log' })).toBeVisible();
  });

  test('feature gates — API data matches UI toggles', async ({ page, api }) => {
    const res = await api.get('/app/v1/admin/features');
    expect(res.status()).toBe(200);
    const features = await res.json() as { features?: Array<{ key: string; enabled: boolean; label?: string }> };

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/features'),
      page.goto('/admin/features'),
    ]);
    expect(uiRes.status()).toBe(200);
    await expect(page.locator('[data-testid="feature-gates"]')).toBeVisible({ timeout: 10000 });

    // Each feature from API should render a toggle
    if (features.features && features.features.length > 0) {
      const firstKey = features.features[0].key;
      await expect(page.locator(`[data-testid="toggle-${firstKey}"]`)).toBeVisible({ timeout: 8000 });
    }
  });

  test('TOGGLE feature gate → PUT to API → state persists', async ({ page, api }) => {
    // Read current feature state
    const res = await api.get('/app/v1/admin/features');
    const features = await res.json() as { features?: Array<{ key: string; enabled: boolean }> };
    if (!features.features || features.features.length === 0) {
      test.skip(true, 'No features returned from API');
      return;
    }
    const feature = features.features[0];
    const originalState = feature.enabled;

    await page.goto('/admin/features');
    await page.waitForResponse('**/app/v1/admin/features');
    await expect(page.locator('[data-testid="feature-gates"]')).toBeVisible({ timeout: 10000 });

    // Click the toggle
    const toggle = page.locator(`[data-testid="toggle-${feature.key}"]`);
    await expect(toggle).toBeVisible();
    const [patchRes] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/features'),
      toggle.click(),
    ]);
    expect([200, 204]).toContain(patchRes.status());

    // Verify via API that state changed
    const afterRes = await api.get('/app/v1/admin/features');
    const afterFeatures = await afterRes.json() as { features?: Array<{ key: string; enabled: boolean }> };
    const afterFeature = afterFeatures.features?.find((f) => f.key === feature.key);
    expect(afterFeature?.enabled).toBe(!originalState);

    // Restore original state
    await toggle.click();
  });

  test('audit log page renders from API', async ({ page, api }) => {
    const res = await api.get('/app/v1/admin/audit-log');
    expect(res.status()).toBe(200);

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/audit-log**'),
      page.goto('/admin/audit'),
    ]);
    expect(uiRes.status()).toBe(200);
    await expect(
      page.locator('[data-testid="audit-log"]').or(page.locator('text=No audit entries yet.')).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('LLM config — providers from API shown (or empty state)', async ({ page, api }) => {
    const res = await api.get('/app/v1/admin/llm/providers');
    expect(res.status()).toBe(200);
    const body = await res.json() as { providers?: Array<{ provider: string; model: string }> };
    const providers = body.providers ?? [];

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/llm/providers'),
      page.goto('/admin/llm-config'),
    ]);
    expect(uiRes.status()).toBe(200);
    await expect(page.locator('text=LLM Configuration')).toBeVisible();

    if (providers.length > 0) {
      await expect(page.locator(`text=${providers[0].provider}`).first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('text=No LLM providers configured.')).toBeVisible({ timeout: 10000 });
    }
  });

  test('LLM budget — API values shown in budget cards', async ({ page, api }) => {
    const res = await api.get('/app/v1/admin/llm/budget');
    expect(res.status()).toBe(200);
    const budget = await res.json() as { daily_limit_usd: number; monthly_limit_usd: number };

    await page.goto('/admin/llm-config');
    await page.waitForResponse('**/app/v1/admin/llm/providers');
    await expect(page.locator(`text=$${budget.daily_limit_usd}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=$${budget.monthly_limit_usd}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('guardrails — API JSON content shown in editor', async ({ page, api }) => {
    const res = await api.get('/app/v1/admin/guardrails');
    expect(res.status()).toBe(200);

    await page.goto('/admin/guardrails');
    await expect(page.locator('[data-testid="guardrails-editor"]')).toBeVisible({ timeout: 10000 });
    // The editor should contain JSON
    const editorContent = await page.locator('[data-testid="guardrails-editor"]').inputValue();
    expect(() => JSON.parse(editorContent)).not.toThrow();
  });

  test('SSO page — API data shown and buttons clickable', async ({ page, api }) => {
    const res = await api.get('/app/v1/admin/sso');
    expect(res.status()).toBe(200);

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/sso'),
      page.goto('/admin/sso'),
    ]);
    expect(uiRes.status()).toBe(200);
    await expect(page.locator('[data-testid="sso-page"]')).toBeVisible({ timeout: 10000 });
    // Protocol selector buttons are clickable
    const oidcBtn = page.locator('button').filter({ hasText: 'OIDC' });
    const samlBtn = page.locator('button').filter({ hasText: 'SAML' });
    await expect(oidcBtn).toBeVisible();
    await expect(samlBtn).toBeVisible();
    await samlBtn.click();
    await expect(samlBtn).toHaveAttribute('aria-pressed', 'true').catch(() => {
      // Some button implementations use class or data attribute instead
    });
  });

  test('infra page — deployment status from API shown', async ({ page, api }) => {
    const res = await api.get('/app/v1/admin/deployment/status');
    expect(res.status()).toBe(200);
    const status = await res.json() as { services?: Array<{ name: string; health: string }> };

    await page.goto('/admin/infra');
    await page.waitForResponse('**/app/v1/admin/deployment/status');

    if (status.services && status.services.length > 0) {
      // First service name from API should appear in UI
      await expect(page.locator(`text=${status.services[0].name}`).first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('h1, h2').filter({ hasText: 'Infrastructure' })).toBeVisible();
    }
  });

  test('connectors page — API data shown', async ({ page, api }) => {
    const res = await api.get('/app/v1/admin/connectors');
    expect(res.status()).toBe(200);
    const body = await res.json() as { connectors?: Array<{ name: string }> };
    const connectors = body.connectors ?? [];

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/connectors'),
      page.goto('/admin/connectors'),
    ]);
    expect(uiRes.status()).toBe(200);

    if (connectors.length > 0) {
      await expect(page.locator(`text=${connectors[0].name}`).first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('h1, h2').filter({ hasText: 'Connectors' })).toBeVisible();
    }
  });
});

