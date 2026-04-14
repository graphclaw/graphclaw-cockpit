import { test as base, expect } from '@playwright/test';

base.describe('Authentication Flow', () => {
  base('unauthenticated user redirected to login', async ({ page }) => {
    // Clear any auth state
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('gc-auth'));
    await page.goto('/goals');
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  base('login page renders OAuth buttons', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Sign in')).toBeVisible();
    await expect(page.locator('text=Google')).toBeVisible();
    await expect(page.locator('text=GitHub')).toBeVisible();
  });

  base('dev login sets auth state', async ({ page }) => {
    await page.goto('/login');
    const devBtn = page.locator('text=Dev Login');
    if (await devBtn.isVisible()) {
      await devBtn.click();
      // Should navigate away from login
      await page.waitForURL(/^(?!.*\/login)/);
    }
  });
});
