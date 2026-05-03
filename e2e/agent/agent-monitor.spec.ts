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

  test('comms tab route resolves to comms section and preserves tab', async ({ page }) => {
    await page.goto('/agent-monitor/comms/outbound');
    await expect(page).toHaveURL(/\/agent-monitor\/comms\/outbound$/);
    const commsPanel = page.locator('[data-testid="agent-monitor-panel-comms"]');
    await expect(commsPanel).toBeVisible({ timeout: 10000 });
    await expect(commsPanel.getByText('outbound')).toBeVisible({ timeout: 10000 });
  });
});

