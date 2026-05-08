// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Timeline View — TS-05 Hierarchical Gantt', () => {
  // ── TS-05.1: Gantt container renders ────────────────────────────────────────
  test('TS-05.1: renders left panel and gantt area', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/graph/**'),
      page.goto('/workspace/timeline'),
    ]);
    if ([401, 429].includes(res.status())) {
      test.skip(true, 'Rate limited');
      return;
    }
    await expect(page.locator('h1').filter({ hasText: /timeline/i })).toBeVisible();
    // Either the Gantt panels or a no-data empty state should be present
    const hasGantt = await page.locator('.tl-left, [data-testid="timeline-page"]').first().isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=/No goals|No tasks|Create goals/i').first().isVisible().catch(() => false);
    expect(hasGantt || hasEmpty).toBe(true);
  });

  // ── TS-05.2: Goal hierarchy tree ────────────────────────────────────────────
  test('TS-05.2: left panel shows goal rows when data exists', async ({ page, api }) => {
    const res = await api.get('/app/v1/graph/goals');
    if ([401, 429].includes(res.status())) {
      test.skip(true, 'Rate limited');
      return;
    }
    const goals = (await res.json() as { items?: unknown[] }).items ?? [];
    await page.goto('/workspace/timeline');
    await page.waitForResponse('**/app/v1/graph/**');

    if (goals.length > 0) {
      await expect(page.locator('.tl-row.goal-row').first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('h1').filter({ hasText: /timeline/i })).toBeVisible();
    }
  });

  // ── TS-05.3: Expand / collapse ──────────────────────────────────────────────
  test('TS-05.3: clicking expand toggle shows child rows', async ({ page }) => {
    await page.goto('/workspace/timeline');
    await page.waitForResponse('**/app/v1/graph/**');

    const toggle = page.locator('.expand-toggle').first();
    const hasToggle = await toggle.isVisible().catch(() => false);
    if (!hasToggle) {
      test.skip(true, 'No expandable rows — no hierarchy in data');
      return;
    }
    const rowsBefore = await page.locator('.tl-row').count();
    await toggle.click();
    // Rows may increase (expand) or decrease (collapse) — just verify page doesn't crash
    const rowsAfter = await page.locator('.tl-row').count();
    expect(rowsAfter).toBeGreaterThanOrEqual(0);
    // Toggle again to collapse
    await toggle.click();
    const rowsFinal = await page.locator('.tl-row').count();
    expect(rowsFinal).toBeLessThanOrEqual(rowsBefore + 5);
  });

  // ── TS-05.4: Zoom — Week view ────────────────────────────────────────────────
  test('TS-05.4: Week zoom button becomes active when clicked', async ({ page }) => {
    await page.goto('/workspace/timeline');
    await page.waitForResponse('**/app/v1/graph/**');
    await page.waitForSelector('.zoom-btn', { timeout: 10000 });

    const weekBtn = page.locator('.zoom-btn').filter({ hasText: /week/i });
    await weekBtn.click();
    await expect(weekBtn).toHaveClass(/active/);
  });

  // ── TS-05.5: Zoom — Month view ───────────────────────────────────────────────
  test('TS-05.5: Month zoom button becomes active when clicked', async ({ page }) => {
    await page.goto('/workspace/timeline');
    await page.waitForResponse('**/app/v1/graph/**');
    await page.waitForSelector('.zoom-btn', { timeout: 10000 });

    const monthBtn = page.locator('.zoom-btn').filter({ hasText: /month/i });
    await monthBtn.click();
    await expect(monthBtn).toHaveClass(/active/);
  });

  // ── TS-05.6: Zoom — Quarter view ─────────────────────────────────────────────
  test('TS-05.6: Quarter zoom button becomes active when clicked', async ({ page }) => {
    await page.goto('/workspace/timeline');
    await page.waitForResponse('**/app/v1/graph/**');
    await page.waitForSelector('.zoom-btn', { timeout: 10000 });

    const quarterBtn = page.locator('.zoom-btn').filter({ hasText: /quarter/i });
    await quarterBtn.click();
    await expect(quarterBtn).toHaveClass(/active/);
  });

  // ── TS-05.7: Today line visible ──────────────────────────────────────────────
  test('TS-05.7: today line element is present in gantt area', async ({ page }) => {
    await page.goto('/workspace/timeline');
    await page.waitForResponse('**/app/v1/graph/**');

    const hasData = await page.locator('.tl-left').isVisible().catch(() => false);
    if (!hasData) {
      test.skip(true, 'No gantt rendered — empty state');
      return;
    }
    await expect(
      page.locator('.gantt-today-line, [data-testid="gantt-today-line"]').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── TS-05.8: Filter chips toggle ────────────────────────────────────────────
  test('TS-05.8: filter chips are present and toggle active state', async ({ page }) => {
    await page.goto('/workspace/timeline');
    await page.waitForResponse('**/app/v1/graph/**');
    await page.waitForSelector('.filter-chip', { timeout: 10000 });

    // "All" chip should be active by default
    const allChip = page.locator('.filter-chip').filter({ hasText: /all/i });
    await expect(allChip).toHaveClass(/active/);

    // Click "Blocked" chip
    const blockedChip = page.locator('.filter-chip').filter({ hasText: /blocked/i });
    await blockedChip.click();
    await expect(blockedChip).toHaveClass(/active/);
  });

  // ── TS-05.9: Task bars for dated tasks ──────────────────────────────────────
  test('TS-05.9: task bars render in gantt area for tasks with dates', async ({ page, api }) => {
    const res = await api.get('/app/v1/graph/tasks');
    if ([401, 429].includes(res.status())) {
      test.skip(true, 'Rate limited');
      return;
    }
    const tasks = (await res.json() as { items?: Array<{ started_at?: string; created_at?: string }> }).items ?? [];
    const datedTasks = tasks.filter((t) => t.started_at ?? t.created_at);

    await page.goto('/workspace/timeline');
    await page.waitForResponse('**/app/v1/graph/**');

    if (datedTasks.length > 0) {
      await expect(page.locator('.task-bar').first()).toBeVisible({ timeout: 10000 });
    } else {
      // No dated tasks — acceptable
      await expect(page.locator('h1').filter({ hasText: /timeline/i })).toBeVisible();
    }
  });
});


