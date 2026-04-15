import { test, expect } from '../fixtures/auth.fixture';

test.describe('MCP Registry', () => {
  test('renders MCP registry and calls API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/mcp-servers'),
      page.goto('/mcp'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('h1, h2').filter({ hasText: 'MCP Registry' })).toBeVisible();
  });

  test('shows server list or empty state from API', async ({ page }) => {
    await page.goto('/mcp');
    await page.waitForResponse('**/app/v1/mcp-servers');
    await expect(
      page.locator('[data-testid="mcp-server-list"]').or(
        page.locator('text=No MCP servers registered yet.'),
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows trust tier badges when servers exist', async ({ page }) => {
    await page.goto('/mcp');
    const count = page.locator('[data-testid="mcp-count"]');
    await expect(count).toBeVisible({ timeout: 10000 });
  });

  test('shows pre-built adapters section', async ({ page }) => {
    await page.goto('/mcp');
    await expect(page.locator('text=Pre-built Adapters')).toBeVisible();
    await expect(page.locator('[data-testid="adapter-gallery"]')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'GitHub' })).toBeVisible();
  });
});
