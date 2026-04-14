import { test, expect } from '../fixtures/auth.fixture';

test.describe('Scoring', () => {
  test('renders scoring settings page with sliders', async ({ page }) => {
    await page.goto('/settings/scoring');
    await expect(page.locator('text=Scoring Weights')).toBeVisible();
    await expect(page.locator('text=Urgency')).toBeVisible();
  });
});
