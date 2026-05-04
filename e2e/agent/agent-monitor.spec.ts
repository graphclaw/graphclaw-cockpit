import { test, expect } from '../fixtures/auth.fixture';

test.describe('Agent Monitor', () => {
  test('redirects /agent-monitor to /agent-monitor/overview', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page).toHaveURL(/\/agent-monitor\/overview$/);
    await expect(page.locator('[data-testid="agent-monitor-panel-overview"]')).toBeVisible({ timeout: 10000 });
  });

  test('section route renders matching panel', async ({ page }) => {
    await page.goto('/agent-monitor/scoring');
    await expect(page.locator('[data-testid="agent-monitor-panel-scoring"]')).toBeVisible({ timeout: 10000 });
  });

  test('activity route renders feed and filters', async ({ page }) => {
    await page.goto('/agent-monitor/activity');

    const activityPanel = page.locator('[data-testid="agent-monitor-panel-activity"]');
    await expect(activityPanel).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="agent-monitor-activity-feed"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="activity-filter-time"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="activity-filter-type"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="activity-view-session"]')).toBeDisabled({ timeout: 10000 });
    await expect(page.locator('[data-testid="activity-view-session"]')).toHaveAttribute('title', 'Coming soon');
  });

  test('comms tab route resolves to comms section and preserves tab', async ({ page }) => {
    await page.goto('/agent-monitor/comms/outbound');
    await expect(page).toHaveURL(/\/agent-monitor\/comms\/outbound$/);
    const commsPanel = page.locator('[data-testid="agent-monitor-panel-comms"]');
    await expect(commsPanel).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="comms-summary-banner"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="comms-summary-range"]')).toBeVisible({ timeout: 10000 });
    await expect(commsPanel.getByText(/^outbound$/)).toBeVisible({ timeout: 10000 });
  });
});

