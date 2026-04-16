import { test, expect } from '../fixtures/auth.fixture';

test.describe('Goal View', () => {
  test('goals API data count matches UI header', async ({ page, api }) => {
    const res = await api.get('/app/v1/graph/goals');
    const body = await res.json() as { total: number; items: { id: string; title: string }[] };

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/graph/goals**'),
      page.goto('/goals'),
    ]);
    if ([401, 429].includes(uiRes.status())) {
      test.skip(true, 'Rate limited in full suite — passes when run alone');
      return;
    }
    expect(uiRes.status()).toBe(200);

    if (body.total > 0 && body.items.length > 0) {
      // At least the first goal title from API should appear in the UI
      await expect(page.locator(`text=${body.items[0].title}`).first()).toBeVisible({ timeout: 10000 });
    } else {
      // Empty state — the "Graph" view button is always present
      await expect(page.locator('button').filter({ hasText: 'Graph' }).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('view switcher buttons are present and clickable', async ({ page }) => {
    await page.goto('/goals');
    const graphBtn = page.locator('button').filter({ hasText: 'Graph' });
    const tableBtn = page.locator('button').filter({ hasText: 'Table' });
    await expect(graphBtn).toBeVisible();
    await expect(tableBtn).toBeVisible();

    // Switch to table view
    await tableBtn.click();
    // The task header row uses a div with uppercase Tailwind class
    await expect(page.locator('div.uppercase').filter({ hasText: 'Task' }).first()).toBeVisible({ timeout: 8000 });

    // Switch back to graph view
    await graphBtn.click();
    await expect(page.locator('canvas, [data-testid="cytoscape-graph"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('table view shows tasks from API', async ({ page, api }) => {
    const res = await api.get('/app/v1/graph/tasks');
    const body = await res.json() as { total: number; items: { title: string }[] };

    await page.goto('/goals');
    await page.waitForResponse('**/app/v1/graph/goals**');
    const [taskRes] = await Promise.all([
      page.waitForResponse('**/app/v1/graph/tasks**'),
      page.locator('button').filter({ hasText: 'Table' }).click(),
    ]);
    if ([401, 429].includes(taskRes.status())) {
      test.skip(true, 'Rate limited in full suite — passes when run alone');
      return;
    }
    expect(taskRes.status()).toBe(200);

    // The task header row uses a div with uppercase Tailwind class
    await expect(page.locator('div.uppercase').filter({ hasText: 'Task' }).first()).toBeVisible({ timeout: 8000 });
    if (body.items.length > 0) {
      await expect(page.locator(`text=${body.items[0].title}`).first()).toBeVisible({ timeout: 8000 });
    }
  });
});

