import { test, expect } from '../fixtures/auth.fixture';

test.describe('Project View', () => {
  test('renders projects page', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('text=Projects')).toBeVisible();
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
