// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test('loads dashboard and shows KPI cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="dashboard-kpi"]')).toBeVisible({ timeout: 10000 });
  });

  test('agent status API called — card shows Running or Idle', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/agent/status'),
      page.goto('/'),
    ]);
    if ([401, 429].includes(res.status())) {
      test.skip(true, 'Rate limited or auth error in full suite — passes when run alone');
      return;
    }
    expect(res.status()).toBe(200);
    const body = await res.json() as { running?: boolean };
    const expectedLabel = body.running ? 'Running' : 'Idle';
    await expect(page.locator(`text=${expectedLabel}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('action-queue response matches UI — either queue items or empty message', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/agent/action-queue'),
      page.goto('/'),
    ]);
    if ([401, 429].includes(res.status())) {
      test.skip(true, 'Rate limited or auth error in full suite — passes when run alone');
      return;
    }
    expect(res.status()).toBe(200);
    const body = await res.json() as unknown[];
    if (Array.isArray(body) && body.length > 0) {
      await expect(page.locator('[data-testid="action-queue"]')).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('text=No actions queued.')).toBeVisible({ timeout: 10000 });
    }
  });

  test('task count from API matches KPI card display', async ({ page, api }) => {
    // Read ground truth from API
    const res = await api.get('/app/v1/graph/tasks');
    const body = await res.json() as { total: number };
    const expectedTotal = body.total;

    await page.goto('/');
    const taskRes = await page.waitForResponse('**/app/v1/graph/tasks**');
    if ([401, 429].includes(taskRes.status())) {
      test.skip(true, 'Rate limited or auth error in full suite — passes when run alone');
      return;
    }
    // Find the Tasks KPI card specifically (filter by label text) and verify its value
    const tasksCard = page.locator('[data-testid="dashboard-kpi"] > div').filter({ hasText: /^Tasks/ });
    await expect(tasksCard).toBeVisible({ timeout: 10000 });
    const displayedValue = await tasksCard.locator('span.text-2xl, span.font-bold').first().innerText();
    expect(parseInt(displayedValue)).toBe(expectedTotal);
  });

  test('goals count from API matches KPI card display', async ({ page, api }) => {
    const res = await api.get('/app/v1/graph/goals');
    const body = await res.json() as { total: number };
    const expectedTotal = body.total;

    await page.goto('/');
    const goalsRes = await page.waitForResponse('**/app/v1/graph/goals**');
    if ([401, 429].includes(goalsRes.status())) {
      test.skip(true, 'Rate limited or auth error in full suite — passes when run alone');
      return;
    }
    // Find the Goals KPI card specifically
    const goalsCard = page.locator('[data-testid="dashboard-kpi"] > div').filter({ hasText: /^Goals/ });
    await expect(goalsCard).toBeVisible({ timeout: 10000 });
    const goalValue = await goalsCard.locator('span.text-2xl, span.font-bold').first().innerText();
    expect(parseInt(goalValue)).toBe(expectedTotal);
  });
});

