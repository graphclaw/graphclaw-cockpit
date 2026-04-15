import { test, expect } from '../fixtures/auth.fixture';

test.describe('Agent Monitor', () => {
  test('renders agent monitor page', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('h1').filter({ hasText: 'Agent Monitor' })).toBeVisible({ timeout: 10000 });
  });

  test('shows KPI cards from real API', async ({ page }) => {
    const [agentRes] = await Promise.all([
      page.waitForResponse('**/app/v1/agent/status'),
      page.goto('/agent-monitor'),
    ]);
    expect(agentRes.status()).toBe(200);
    await expect(page.locator('[data-testid="kpi-strip"]')).toBeVisible();
    // KPI labels reflect the real agent status response
    await expect(page.locator('text=Agent Running')).toBeVisible();
    await expect(page.locator('text=Queue Depth')).toBeVisible();
  });

  test('shows action queue from real API', async ({ page }) => {
    const [queueRes] = await Promise.all([
      page.waitForResponse('**/app/v1/agent/action-queue'),
      page.goto('/agent-monitor'),
    ]);
    expect(queueRes.status()).toBe(200);
    await expect(page.locator('[data-testid="action-queue-panel"]')).toBeVisible();
  });

  test('shows active agents section', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('h2').filter({ hasText: 'Active Agents' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="active-agents"]')).toBeVisible();
  });

  test('shows event log', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('h2').filter({ hasText: 'Event Log' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="event-log"]')).toBeVisible();
  });

  test('agent status shows version from API', async ({ page }) => {
    await page.goto('/agent-monitor');
    // The real API returns agent_version: "1.0.0"
    await expect(page.locator('text=1.0.0')).toBeVisible({ timeout: 10000 });
  });
});
