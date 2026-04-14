import { test, expect } from '../fixtures/auth.fixture';

test.describe('Admin Panel', () => {
  test('renders members page', async ({ page }) => {
    await page.goto('/admin/members');
    await expect(page.locator('h1').filter({ hasText: 'Admin Panel' })).toBeVisible();
    await expect(page.locator('text=Alice Chen')).toBeVisible();
  });

  test('admin sub-navigation works', async ({ page }) => {
    await page.goto('/admin/members');
    await expect(page.locator('nav a').filter({ hasText: 'Feature Gates' })).toBeVisible();
    await expect(page.locator('nav a').filter({ hasText: 'LLM Config' })).toBeVisible();
    await expect(page.locator('nav a').filter({ hasText: 'Guardrails' })).toBeVisible();
    await expect(page.locator('nav a').filter({ hasText: 'Audit Log' })).toBeVisible();
  });

  test('feature gates page renders toggles', async ({ page }) => {
    await page.goto('/admin/features');
    await expect(page.locator('main h2').filter({ hasText: 'Feature Gates' })).toBeVisible();
    await expect(page.locator('text=MCP Connectors')).toBeVisible();
  });

  test('audit log page renders entries', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page.locator('main').locator('text=Audit Log').first()).toBeVisible();
    await expect(page.locator('text=member.invite')).toBeVisible();
  });

  test('LLM config page shows provider cards', async ({ page }) => {
    await page.goto('/admin/llm-config');
    await expect(page.locator('text=LLM Configuration')).toBeVisible();
    await expect(page.locator('main').locator('text=Anthropic')).toBeVisible();
    await expect(page.locator('main').locator('text=OpenAI')).toBeVisible();
  });

  test('guardrails page renders XML editor', async ({ page }) => {
    await page.goto('/admin/guardrails');
    await expect(page.locator('text=Guardrails Editor')).toBeVisible();
    await expect(page.locator('[data-testid="guardrails-editor"]')).toBeVisible();
  });

  test('SSO page renders protocol selector', async ({ page }) => {
    await page.goto('/admin/sso');
    await expect(page.locator('text=Single Sign-On')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'OIDC' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'SAML' })).toBeVisible();
  });

  test('infrastructure page shows services', async ({ page }) => {
    await page.goto('/admin/infra');
    await expect(page.locator('h1, h2').filter({ hasText: 'Infrastructure' })).toBeVisible();
    await expect(page.locator('text=API Gateway')).toBeVisible();
    await expect(page.locator('main').locator('text=Redis')).toBeVisible();
  });

  test('connectors page shows connector list', async ({ page }) => {
    await page.goto('/admin/connectors');
    await expect(page.locator('h1, h2').filter({ hasText: 'Connectors' })).toBeVisible();
    await expect(page.locator('main').locator('text=GitHub')).toBeVisible();
    await expect(page.locator('main').locator('text=Slack')).toBeVisible();
  });
});
