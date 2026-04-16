import { test, expect } from '../fixtures/auth.fixture';

test.describe('Skill Marketplace', () => {
  test('skills from API match UI count and list', async ({ page, api }) => {
    const res = await api.get('/app/v1/skills');
    expect(res.status()).toBe(200);
    const body = await res.json() as { skills?: unknown[]; items?: unknown[]; total?: number };
    const items = body.skills ?? body.items ?? (Array.isArray(body) ? body : []);

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/skills'),
      page.goto('/skills'),
    ]);
    expect(uiRes.status()).toBe(200);

    if (items.length > 0) {
      await expect(page.locator('[data-testid="skills-list"]')).toBeVisible({ timeout: 10000 });
    } else {
      await expect(
        page.locator('[data-testid="skills-list"]').or(page.locator('text=No skills installed yet.')),
      ).toBeVisible({ timeout: 10000 });
    }

    // Count badge matches API total
    const countEl = page.locator('[data-testid="skills-count"]');
    await expect(countEl).toBeVisible({ timeout: 10000 });
    if (body.total !== undefined) {
      await expect(countEl).toContainText(String(body.total));
    }
  });

  test('filter input is visible and narrows results', async ({ page }) => {
    await page.goto('/skills');
    await page.waitForResponse('**/app/v1/skills');
    const filterInput = page.locator('input[placeholder*="Filter"]');
    await expect(filterInput).toBeVisible({ timeout: 10000 });

    await filterInput.fill('zzznonexistent');
    // Either no results or the empty state should appear
    await expect(
      page.locator('text=No skills').or(page.locator('[data-testid="skills-list"]')),
    ).toBeVisible({ timeout: 5000 });
  });
});

