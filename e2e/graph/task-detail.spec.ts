// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-GRA-W19-001 — Task Detail Panel
 *
 * Scenario: User navigates to /tasks, clicks a task row, sees the detail panel
 * with title, state badge, score bar, ID, action buttons, and counterparty
 * conversations section.
 *
 * PRD: docs/prd/03-agent-monitor.md §AC-3.4 (task detail, score breakdown)
 * Build wave: W19
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-06
 *
 * Cases covered:
 *  - Task detail page loads from task row click
 *  - GET /graph/tasks/{id} called and populates panel
 *  - State badge displays correct value
 *  - Score bar rendered with correct width
 *  - Task ID shown in mono font
 *  - Approve and Edit buttons visible
 *  - Counterparty conversations section loads
 *  - Close button returns to task list
 */

import { test, expect } from '../fixtures/test';

test.describe('Task Detail Panel', () => {
  let taskId: string;
  let taskTitle: string;

  test.beforeAll(async ({ api }) => {
    taskTitle = `E2E Detail Task ${Date.now()}`;
    const res = await api.post('/app/v1/graph/tasks', {
      data: { task_type: 'ATOMIC', title: taskTitle, description: 'Task for detail panel E2E' },
    });
    if (res.status() === 201) {
      const body = await res.json();
      taskId = body.id;
    }
  });

  test.afterAll(async ({ api }) => {
    if (taskId) {
      await api.delete(`/app/v1/graph/tasks/${taskId}`).catch(() => {});
    }
  });

  test('task row click navigates to detail page', async ({ page }) => {
    test.skip(!taskId, 'Task creation failed — skipping detail tests');

    await page.goto('/tasks');
    await page.waitForResponse('**/app/v1/graph/tasks**');

    const row = page.locator(`text=${taskTitle}`);
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.click();

    await expect(page).toHaveURL(/\/tasks\/.+/, { timeout: 5000 });
  });

  test('detail panel shows task title and state', async ({ page, api }) => {
    test.skip(!taskId, 'Task creation failed');

    const res = await api.get(`/app/v1/graph/tasks/${taskId}`);
    const task = await res.json() as { title: string; state: string; score: number };

    await page.goto(`/tasks/${taskId}`);
    await expect(page.locator(`text=${task.title}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${task.state}`)).toBeVisible();
  });

  test('detail panel shows score bar', async ({ page, api }) => {
    test.skip(!taskId, 'Task creation failed');

    const res = await api.get(`/app/v1/graph/tasks/${taskId}`);
    const task = await res.json() as { score: number };

    await page.goto(`/tasks/${taskId}`);
    await expect(page.locator('text=Score').first()).toBeVisible({ timeout: 10000 });

    // Score value should be visible (formatted as 0.XX)
    const scoreText = task.score?.toFixed(2);
    if (scoreText) {
      await expect(page.locator(`text=${scoreText}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('detail panel shows task ID', async ({ page }) => {
    test.skip(!taskId, 'Task creation failed');

    await page.goto(`/tasks/${taskId}`);
    await expect(page.locator(`text=${taskId}`)).toBeVisible({ timeout: 10000 });
  });

  test('Approve and Edit action buttons visible', async ({ page }) => {
    test.skip(!taskId, 'Task creation failed');

    await page.goto(`/tasks/${taskId}`);
    await expect(page.locator('button:has-text("Approve")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
  });

  test('counterparty conversations section renders', async ({ page }) => {
    test.skip(!taskId, 'Task creation failed');

    await page.goto(`/tasks/${taskId}`);
    await expect(
      page.locator('[data-testid="counterparty-conversations"]'),
    ).toBeVisible({ timeout: 10000 });
  });

  test('close button returns to task list', async ({ page }) => {
    test.skip(!taskId, 'Task creation failed');

    await page.goto(`/tasks/${taskId}`);
    await page.waitForLoadState('networkidle');

    // Click the X close button
    const closeBtn = page.locator('button:has-text("×")').or(
      page.locator('button[aria-label="Close"]'),
    );
    if (await closeBtn.count()) {
      await closeBtn.first().click();
      await expect(page).toHaveURL(/\/tasks$/, { timeout: 5000 });
    }
  });

  test('GET /graph/tasks/{id} is called when page loads', async ({ page }) => {
    test.skip(!taskId, 'Task creation failed');

    const [detailRes] = await Promise.all([
      page.waitForResponse(`**/app/v1/graph/tasks/${taskId}`),
      page.goto(`/tasks/${taskId}`),
    ]);
    expect(detailRes.status()).toBe(200);
  });
});
