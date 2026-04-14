import { test, expect } from '../fixtures/auth.fixture';

test.describe('My Tasks', () => {
  test('renders task table', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.locator('text=My Tasks')).toBeVisible();
  });

  test('renders filter/search input', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.locator('input[placeholder*="Search"], input[placeholder*="Filter"]').first()).toBeVisible();
  });

  test('task table has header columns', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.locator('text=Title').first()).toBeVisible();
    await expect(page.locator('text=Status').first()).toBeVisible();
  });
});
