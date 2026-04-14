import { test, expect } from '../fixtures/auth.fixture';

test.describe('Scoring', () => {
  test('renders scoring settings page with sliders', async ({ page }) => {
    await page.goto('/settings/scoring');
    await expect(page.locator('main').locator('text=Scoring Weights').first()).toBeVisible();
    await expect(page.locator('text=Urgency')).toBeVisible();
  });
});
