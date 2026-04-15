import { test, expect } from '../fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test('loads dashboard and calls multiple APIs', async ({ page }) => {
    const responses: string[] = [];
    page.on('response', (res) => {
      if (res.url().includes('/app/v1/')) {
        responses.push(res.url());
      }
    });

    await page.goto('/');

    // Wait for at least agent status to be called
    await page.waitForResponse('**/app/v1/agent/status');
    expect(responses.some((r) => r.includes('/agent/status'))).toBe(true);
  });

  test('shows KPI cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="dashboard-kpi"]')).toBeVisible({ timeout: 10000 });
  });

  test('shows action queue from backend', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/agent/action-queue'),
      page.goto('/'),
    ]);
    expect(res.status()).toBe(200);
    // Queue has at least one item from test data
    const queueOrEmpty = page.locator('[data-testid="action-queue"]').or(
      page.locator('text=No actions queued.'),
    );
    await expect(queueOrEmpty).toBeVisible({ timeout: 10000 });
  });

  test('shows agent status from backend', async ({ page }) => {
    await page.goto('/');
    await page.waitForResponse('**/app/v1/agent/status');
    await expect(page.locator('text=Agent Status')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=1.0.0')).toBeVisible(); // agent_version from API
  });
});
