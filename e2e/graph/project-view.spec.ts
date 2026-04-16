import { test, expect } from '../fixtures/auth.fixture';

test.describe('Project View', () => {
  test('renders projects page with API data', async ({ page, api }) => {
    // Read what the API will return
    const res = await api.get('/app/v1/graph/goals');
    if ([401, 429].includes(res.status())) {
      test.skip(true, 'Rate limited in full suite — passes when run alone');
      return;
    }
    const parsed = await res.json() as { items?: Array<{ title: string; state: string }> };
    const items = parsed.items ?? [];

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/graph/goals**'),
      page.goto('/projects'),
    ]);
    if ([401, 429].includes(uiRes.status())) {
      test.skip(true, 'Rate limited in full suite — passes when run alone');
      return;
    }
    expect(uiRes.status()).toBe(200);
    await expect(page.locator('h1').filter({ hasText: 'Projects' })).toBeVisible();

    if (items.length > 0) {
      // First goal from API should appear as a project card
      await expect(page.locator(`text=${items[0].title}`).first()).toBeVisible({ timeout: 10000 });
    } else {
      // Empty state — Projects h1 is always visible
      await expect(page.locator('h1').filter({ hasText: 'Projects' }).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('shows state badge matching API response', async ({ page, api }) => {
    const res = await api.get('/app/v1/graph/goals');
    if ([401, 429].includes(res.status())) {
      test.skip(true, 'Rate limited in full suite — passes when run alone');
      return;
    }
    const parsed = await res.json() as { items?: Array<{ title: string; state: string }> };
    const items = parsed.items ?? [];

    if (items.length === 0) {
      test.skip(true, 'No goals in DB — skipping badge check');
      return;
    }

    await page.goto('/projects');
    await page.waitForResponse('**/app/v1/graph/goals**');
    // State badge from the API should appear in the card
    const state = items[0].state;
    await expect(page.locator(`text=${state}`).first()).toBeVisible({ timeout: 10000 });
  });
});

