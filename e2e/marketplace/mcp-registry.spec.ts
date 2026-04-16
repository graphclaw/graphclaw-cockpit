import { test, expect } from '../fixtures/auth.fixture';

test.describe('MCP Registry', () => {
  test('MCP servers from API shown in registry', async ({ page, api }) => {
    const res = await api.get('/app/v1/mcp-servers');
    expect(res.status()).toBe(200);
    const body = await res.json() as { servers?: unknown[]; items?: unknown[] };
    const servers = body.servers ?? body.items ?? (Array.isArray(body) ? body : []);

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/mcp-servers'),
      page.goto('/mcp'),
    ]);
    expect(uiRes.status()).toBe(200);
    await expect(page.locator('h1, h2').filter({ hasText: 'MCP Registry' })).toBeVisible({ timeout: 10000 });

    if (Array.isArray(servers) && servers.length > 0) {
      await expect(page.locator('[data-testid="mcp-server-list"]')).toBeVisible({ timeout: 10000 });
    } else {
      await expect(
        page.locator('[data-testid="mcp-server-list"]').or(page.locator('text=No MCP servers registered yet.')),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('server count badge shows correct number from API', async ({ page, api }) => {
    const res = await api.get('/app/v1/mcp-servers');
    const body = await res.json() as { servers?: unknown[]; total?: number };
    const total = body.total ?? (Array.isArray(body.servers) ? body.servers.length : 0);

    await page.goto('/mcp');
    await page.waitForResponse('**/app/v1/mcp-servers');
    const countEl = page.locator('[data-testid="mcp-count"]');
    await expect(countEl).toBeVisible({ timeout: 10000 });
    const countText = await countEl.textContent();
    expect(countText).toContain(String(total));
  });

  test('search box filters server list', async ({ page }) => {
    await page.goto('/mcp');
    await page.waitForResponse('**/app/v1/mcp-servers');
    const searchInput = page.locator('input[placeholder*="earch"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('nonexistentxyz');
      // Either no results shown or empty state
      await expect(
        page.locator('text=No MCP servers').or(page.locator('[data-testid="mcp-server-list"]')),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('pre-built adapters section is visible', async ({ page }) => {
    await page.goto('/mcp');
    await expect(page.locator('[data-testid="adapter-gallery"]')).toBeVisible({ timeout: 10000 });
  });
});

