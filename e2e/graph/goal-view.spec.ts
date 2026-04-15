import { test, expect } from '../fixtures/auth.fixture';

test.describe('Goal View', () => {
  test('renders goal view page and calls API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/graph/goals**'),
      page.goto('/goals'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('h1').filter({ hasText: 'Goals' })).toBeVisible();
  });

  test('view switcher is present', async ({ page }) => {
    await page.goto('/goals');
    await expect(page.locator('text=Graph')).toBeVisible();
    await expect(page.locator('text=Table')).toBeVisible();
  });

  test('graph canvas renders', async ({ page }) => {
    await page.goto('/goals');
    const canvas = page.locator('[data-testid="cytoscape-graph"], canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('shows goal count from API', async ({ page }) => {
    await page.goto('/goals');
    await page.waitForResponse('**/app/v1/graph/goals**');
    // Shows "N goals" from the API
    await expect(page.locator('text=/\\d+ goal/')).toBeVisible({ timeout: 10000 });
  });

  test('table view shows task table', async ({ page }) => {
    await page.goto('/goals');
    // Switch to table view
    await page.locator('button').filter({ hasText: 'Table' }).click();
    await expect(page.locator('[data-testid="task-table"]')).toBeVisible({ timeout: 5000 });
  });
});
