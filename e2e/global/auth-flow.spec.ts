// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test as base, expect } from '@playwright/test';

base.describe('Authentication Flow', () => {
  base('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('gc-auth'));
    await page.goto('/goals');
    await expect(page).toHaveURL(/\/login/);
  });

  base('login page renders OAuth buttons', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Sign in with Google/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with GitHub/ })).toBeVisible();
  });

  base('dev login button is visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button').filter({ hasText: /Dev Token/ })).toBeVisible();
  });
});
