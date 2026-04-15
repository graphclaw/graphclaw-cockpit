import { test, expect } from '../fixtures/auth.fixture';

test.describe('Admin Panel', () => {
  test('renders members page', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/members'),
      page.goto('/admin/members'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('h1').filter({ hasText: 'Admin Panel' })).toBeVisible();
    // Members table or empty state
    await expect(
      page.locator('[data-testid="members-table"]').or(
        page.locator('text=No members yet.'),
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test('admin sub-navigation works', async ({ page }) => {
    await page.goto('/admin/members');
    await expect(page.locator('nav a').filter({ hasText: 'Feature Gates' })).toBeVisible();
    await expect(page.locator('nav a').filter({ hasText: 'LLM Config' })).toBeVisible();
    await expect(page.locator('nav a').filter({ hasText: 'Guardrails' })).toBeVisible();
    await expect(page.locator('nav a').filter({ hasText: 'Audit Log' })).toBeVisible();
  });

  test('feature gates page renders toggles from API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/features'),
      page.goto('/admin/features'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('main h2').filter({ hasText: 'Feature Gates' })).toBeVisible();
    await expect(page.locator('[data-testid="feature-gates"]')).toBeVisible({ timeout: 10000 });
    // Canvas Editor is enabled by default from real API
    await expect(page.locator('text=Canvas Editor')).toBeVisible();
    await expect(page.locator('text=MCP Connectors')).toBeVisible();
  });

  test('feature gate toggle calls PATCH endpoint', async ({ page }) => {
    await page.goto('/admin/features');
    await page.waitForResponse('**/app/v1/admin/features');

    const [patchRes] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/features'),
      page.locator('[data-testid="toggle-enable_agent_canvas"]').click(),
    ]);
    expect([200, 204]).toContain(patchRes.status());
  });

  test('audit log page renders and calls API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/audit-log**'),
      page.goto('/admin/audit'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('main').locator('text=Audit Log').first()).toBeVisible();
    await expect(
      page.locator('[data-testid="audit-log"]').or(
        page.locator('text=No audit entries yet.'),
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test('LLM config page shows provider cards from API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/llm/providers'),
      page.goto('/admin/llm-config'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('text=LLM Configuration')).toBeVisible();
  });

  test('guardrails page renders XML editor', async ({ page }) => {
    await page.goto('/admin/guardrails');
    await expect(page.locator('text=Guardrails Editor')).toBeVisible();
    await expect(page.locator('[data-testid="guardrails-editor"]')).toBeVisible();
  });

  test('SSO page renders protocol selector and loads from API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/sso'),
      page.goto('/admin/sso'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('text=Single Sign-On')).toBeVisible();
    await expect(page.locator('[data-testid="sso-page"]')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'OIDC' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'SAML' })).toBeVisible();
  });

  test('infrastructure page shows services', async ({ page }) => {
    await page.goto('/admin/infra');
    await expect(page.locator('h1, h2').filter({ hasText: 'Infrastructure' })).toBeVisible();
  });

  test('connectors page calls API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/admin/connectors'),
      page.goto('/admin/connectors'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('h1, h2').filter({ hasText: 'Connectors' })).toBeVisible();
  });
});
