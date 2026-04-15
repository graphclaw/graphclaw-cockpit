import { test, expect } from '../fixtures/auth.fixture';

test.describe('Skill Marketplace', () => {
  test('renders skills page and calls API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/skills'),
      page.goto('/skills'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('h1, h2').filter({ hasText: 'Skills' })).toBeVisible();
  });

  test('shows installed skills or empty state', async ({ page }) => {
    await page.goto('/skills');
    await page.waitForResponse('**/app/v1/skills');
    await expect(
      page.locator('[data-testid="skills-list"]').or(
        page.locator('text=No skills installed yet.'),
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test('has filter input', async ({ page }) => {
    await page.goto('/skills');
    await expect(page.locator('input[placeholder*="Filter"]')).toBeVisible();
  });

  test('shows active/installed count from real API', async ({ page }) => {
    await page.goto('/skills');
    await page.waitForResponse('**/app/v1/skills');
    await expect(page.locator('[data-testid="skills-count"]')).toBeVisible({ timeout: 10000 });
  });
});
