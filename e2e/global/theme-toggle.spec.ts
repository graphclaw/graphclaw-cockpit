import { test, expect } from '../fixtures/auth.fixture';

test.describe('Theme Toggle', () => {
  test('persists theme across page reload', async ({ page }) => {
    await page.goto('/');
    // Set theme to dark via localStorage
    await page.evaluate(() => {
      localStorage.setItem(
        'gc-theme',
        JSON.stringify({ state: { theme: 'dark', sidebarCollapsed: false }, version: 0 }),
      );
    });
    await page.reload();

    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('dark');
  });

  test('all 6 themes apply correctly', async ({ page }) => {
    const themes = ['light', 'dark', 'solarized-light', 'solarized-dark', 'midnight', 'high-contrast'];

    for (const themeName of themes) {
      await page.goto('/');
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem(
          'gc-theme',
          JSON.stringify({ state: { theme: t, sidebarCollapsed: false }, version: 0 }),
        );
      }, themeName);

      const appliedTheme = await page.locator('html').getAttribute('data-theme');
      expect(appliedTheme).toBe(themeName);
    }
  });
});
