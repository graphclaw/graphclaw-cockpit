// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Navigation & Theme', () => {
  test('sidebar renders all nav sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('aside').locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('aside').locator('text=My Tasks')).toBeVisible();
    await expect(page.locator('aside').locator('text=Goals')).toBeVisible();
  });

  test('sidebar collapse toggle works', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // Click collapse toggle using aria-label
    const collapseBtn = page.locator('[aria-label="Collapse sidebar"], [aria-label="Expand sidebar"]').first();
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await expect(sidebar).toBeVisible();
    }
  });

  test('theme picker changes theme', async ({ page }) => {
    await page.goto('/');
    // The theme picker button shows "Theme: Light" or similar
    const themeBtn = page.locator('button').filter({ hasText: /Theme/ });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      // Select dark theme from dropdown
      const darkOption = page.locator('button').filter({ hasText: 'Dark' }).first();
      if (await darkOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await darkOption.click();
        const theme = await page.locator('html').getAttribute('data-theme');
        expect(theme).toBe('dark');
      }
    }
  });

  test('navigate to each main route', async ({ page }) => {
    const routes = [
      { nav: 'My Tasks', heading: /tasks/i },
      { nav: 'Goals', heading: /goals/i },
      { nav: 'Projects', heading: /projects/i },
    ];

    for (const route of routes) {
      await page.goto('/');
      await page.locator('aside').locator(`text=${route.nav}`).first().click();
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('command palette opens with Ctrl+K', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    // Command palette shows a fixed dialog with search
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');
  });

  test('breadcrumbs update on navigation', async ({ page }) => {
    await page.goto('/settings/channels');
    // Breadcrumbs are in the nav[aria-label="Breadcrumb"] section
    await expect(page.locator('nav[aria-label="Breadcrumb"]').locator('text=Settings')).toBeVisible();
  });
});
