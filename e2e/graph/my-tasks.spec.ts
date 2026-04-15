import { test, expect } from '../fixtures/auth.fixture';

test.describe('My Tasks', () => {
  test('renders task table and calls API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/graph/tasks**'),
      page.goto('/tasks'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('h1').filter({ hasText: 'My Tasks' })).toBeVisible();
  });

  test('shows task count from API', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForResponse('**/app/v1/graph/tasks**');
    await expect(page.locator('text=/\\d+ task/')).toBeVisible({ timeout: 10000 });
  });

  test('task table has header columns', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.locator('main').locator('text=Task').first()).toBeVisible();
    await expect(page.locator('main').locator('text=State').first()).toBeVisible();
    await expect(page.locator('main').locator('text=Score').first()).toBeVisible();
  });
});
