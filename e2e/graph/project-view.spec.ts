import { test, expect } from '../fixtures/auth.fixture';

test.describe('Project View', () => {
  test('renders projects page', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('h1').filter({ hasText: 'Projects' })).toBeVisible();
  });

  test('shows project cards', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('text=API Gateway v2')).toBeVisible();
    await expect(page.locator('text=Cockpit Frontend')).toBeVisible();
  });

  test('shows progress bars', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('text=Progress').first()).toBeVisible();
  });
});
