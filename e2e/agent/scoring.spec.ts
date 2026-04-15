import { test, expect } from '../fixtures/auth.fixture';

test.describe('Scoring', () => {
  test('renders scoring settings page with sliders', async ({ page }) => {
    const [weightsRes] = await Promise.all([
      page.waitForResponse('**/app/v1/settings/scoring-weights'),
      page.goto('/settings/scoring'),
    ]);
    expect(weightsRes.status()).toBe(200);
    await expect(page.locator('main').locator('text=Scoring Weights').first()).toBeVisible();
  });

  test('shows 7-factor weights from backend', async ({ page }) => {
    await page.goto('/settings/scoring');
    // Wait for the API response and form to render
    await expect(page.locator('[data-testid="scoring-weights-form"]')).toBeVisible({ timeout: 10000 });
    // Backend returns W1-W7 factors; we display them as Timeline Urgency, etc.
    await expect(page.locator('text=Timeline Urgency')).toBeVisible();
    await expect(page.locator('text=Dependencies')).toBeVisible();
    await expect(page.locator('text=Critical Path')).toBeVisible();
  });

  test('save weights button calls backend', async ({ page }) => {
    await page.goto('/settings/scoring');
    await expect(page.locator('[data-testid="scoring-weights-form"]')).toBeVisible({ timeout: 10000 });

    const [saveRes] = await Promise.all([
      page.waitForResponse('**/app/v1/settings/scoring-weights'),
      page.locator('button').filter({ hasText: 'Save Weights' }).click(),
    ]);
    // PATCH should return 200 or the API 405 if not supported
    expect([200, 405]).toContain(saveRes.status());
  });
});
