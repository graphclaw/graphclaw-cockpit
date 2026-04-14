import { test, expect } from '../fixtures/auth.fixture';

test.describe('My Tasks', () => {
  test('renders task table', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.locator('h1').filter({ hasText: 'My Tasks' })).toBeVisible();
  });

  test('renders filter/search input', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('task table has header columns', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.locator('main').locator('text=Task').first()).toBeVisible();
    await expect(page.locator('main').locator('text=State').first()).toBeVisible();
  });
});
