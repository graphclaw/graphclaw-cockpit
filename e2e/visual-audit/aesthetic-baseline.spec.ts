// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
//
// Visual audit spec — capture aesthetic screenshots for UX evaluator review.
// This spec does NOT assert correctness; it only captures full-page and
// component-level screenshots so a designer can evaluate look-and-feel.
// Screenshots are written to test-results/visual-audit/ by Playwright.
//
// Run: npx playwright test e2e/visual-audit/aesthetic-baseline.spec.ts
// (Requires the dev stack to be running: docker compose up -d)

import { test } from '../fixtures/auth.fixture';

const VIEWPORT = { width: 1440, height: 900 };

test.use({ viewport: VIEWPORT, screenshot: 'on' });

test.describe('Aesthetic Baseline — Sidebar', () => {
  test('sidebar expanded — all nav items visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Ensure sidebar is expanded
    const expandBtn = page.locator('[aria-label="Expand sidebar"]');
    if (await expandBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({
      path: 'test-results/visual-audit/sidebar-expanded.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 260, height: 900 },
    });
  });

  test('sidebar collapsed — icons only', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Collapse the sidebar
    const collapseBtn = page.locator('[aria-label="Collapse sidebar"]');
    if (await collapseBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({
      path: 'test-results/visual-audit/sidebar-collapsed.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 80, height: 900 },
    });
  });
});

test.describe('Aesthetic Baseline — Pages', () => {
  test('dashboard full page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/visual-audit/page-dashboard.png', fullPage: true });
  });

  test('chat page full', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/visual-audit/page-chat.png', fullPage: true });
  });

  test('graph explorer full', async ({ page }) => {
    await page.goto('/graph-explorer');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/visual-audit/page-graph-explorer.png', fullPage: true });
  });

  test('my tasks page', async ({ page }) => {
    await page.goto('/my-tasks');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/visual-audit/page-my-tasks.png', fullPage: true });
  });

  test('workforce page', async ({ page }) => {
    await page.goto('/workforce');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/visual-audit/page-workforce.png', fullPage: true });
  });

  test('agent monitor page', async ({ page }) => {
    await page.goto('/agent-monitor');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/visual-audit/page-agent-monitor.png', fullPage: true });
  });
});

test.describe('Aesthetic Baseline — Dark Theme', () => {
  test('dashboard dark theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Switch to dark theme via localStorage
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'test-results/visual-audit/dashboard-dark.png', fullPage: false });
  });

  test('sidebar dark — expanded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: 'test-results/visual-audit/sidebar-expanded-dark.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 260, height: 900 },
    });
  });
});
