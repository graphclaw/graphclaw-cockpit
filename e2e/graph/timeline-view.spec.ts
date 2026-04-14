import { test, expect } from '../fixtures/auth.fixture';

test.describe('Timeline View', () => {
  test('renders timeline page', async ({ page }) => {
    await page.goto('/timeline');
    await expect(page.locator('h1').filter({ hasText: 'Timeline' })).toBeVisible();
  });

  test('shows timeline items', async ({ page }) => {
    await page.goto('/timeline');
    await expect(page.locator('text=Wave 1: Scaffold')).toBeVisible();
  });
});
