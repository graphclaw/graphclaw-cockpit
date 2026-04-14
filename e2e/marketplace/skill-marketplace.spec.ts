import { test, expect } from '../fixtures/auth.fixture';

test.describe('Skill Marketplace', () => {
  test('renders installed skills', async ({ page }) => {
    await page.goto('/skills');
    await expect(page.locator('h1, h2').filter({ hasText: 'Skills' })).toBeVisible();
    await expect(page.locator('text=email-triage')).toBeVisible();
  });

  test('has filter input', async ({ page }) => {
    await page.goto('/skills');
    await expect(page.locator('input[placeholder*="Filter"]')).toBeVisible();
  });

  test('shows active/installed count', async ({ page }) => {
    await page.goto('/skills');
    await expect(page.locator('text=/\\d+ active .* \\d+ installed/')).toBeVisible();
  });
});
