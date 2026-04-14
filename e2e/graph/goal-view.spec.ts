import { test, expect } from '../fixtures/auth.fixture';

test.describe('Goal View', () => {
  test('renders goal view page', async ({ page }) => {
    await page.goto('/goals');
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
});
