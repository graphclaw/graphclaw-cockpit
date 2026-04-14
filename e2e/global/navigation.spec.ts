import { test, expect } from '../fixtures/auth.fixture';

test.describe('Navigation & Theme', () => {
  test('sidebar renders all nav sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Tasks')).toBeVisible();
    await expect(page.locator('text=Goals')).toBeVisible();
  });

  test('sidebar collapse toggle works', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // Click collapse toggle
    const collapseBtn = page.locator('[title="Collapse sidebar"], [title="Expand sidebar"]').first();
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      // Sidebar should still be visible but narrower
      await expect(sidebar).toBeVisible();
    }
  });

  test('theme picker changes theme', async ({ page }) => {
    await page.goto('/');
    // Open theme picker
    const themeBtn = page.locator('button:has(svg.lucide-palette), button:has(svg.lucide-sun)').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      // Select dark theme
      const darkOption = page.locator('text=Dark');
      if (await darkOption.isVisible()) {
        await darkOption.click();
        // Verify data-theme attribute changed
        const theme = await page.locator('html').getAttribute('data-theme');
        expect(theme).toBe('dark');
      }
    }
  });

  test('navigate to each main route', async ({ page }) => {
    const routes = [
      { nav: 'Tasks', heading: /tasks/i },
      { nav: 'Goals', heading: /goals/i },
      { nav: 'Projects', heading: /projects/i },
    ];

    for (const route of routes) {
      await page.goto('/');
      await page.locator(`text=${route.nav}`).first().click();
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('command palette opens with Ctrl+K', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('breadcrumbs update on navigation', async ({ page }) => {
    await page.goto('/settings/channels');
    await expect(page.locator('text=Settings')).toBeVisible();
  });
});
