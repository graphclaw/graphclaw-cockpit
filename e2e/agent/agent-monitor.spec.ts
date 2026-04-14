import { test, expect } from '../fixtures/auth.fixture';

test.describe('Agent Monitor', () => {
  test('renders agent monitor page', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('h1').filter({ hasText: 'Agent Monitor' })).toBeVisible({ timeout: 10000 });
  });

  test('shows KPI cards', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('text=Tasks Completed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tasks Pending')).toBeVisible();
  });

  test('shows active agents section', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('h2').filter({ hasText: 'Active Agents' })).toBeVisible({ timeout: 10000 });
  });

  test('shows event log', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('h2').filter({ hasText: 'Event Log' })).toBeVisible({ timeout: 10000 });
  });
});
