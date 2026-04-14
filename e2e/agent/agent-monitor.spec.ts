import { test, expect } from '../fixtures/auth.fixture';

test.describe('Agent Monitor', () => {
  test('renders agent monitor page', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('text=Agent Monitor')).toBeVisible();
  });

  test('shows KPI cards', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('text=Tasks Processed')).toBeVisible();
    await expect(page.locator('text=Active Agents')).toBeVisible();
  });

  test('shows agent cards', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('text=Main Orchestrator')).toBeVisible();
  });

  test('shows event log', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('text=Event Log')).toBeVisible();
  });
});
