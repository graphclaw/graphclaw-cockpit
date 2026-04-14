import { test, expect } from '../fixtures/auth.fixture';

test.describe('MCP Registry', () => {
  test('renders MCP server list', async ({ page }) => {
    await page.goto('/mcp');
    await expect(page.locator('text=MCP Registry')).toBeVisible();
    await expect(page.locator('text=GitHub Actions')).toBeVisible();
    await expect(page.locator('text=Jira Cloud')).toBeVisible();
  });

  test('shows trust tier badges', async ({ page }) => {
    await page.goto('/mcp');
    await expect(page.locator('text=AUTO').first()).toBeVisible();
  });

  test('shows pre-built adapters section', async ({ page }) => {
    await page.goto('/mcp');
    await expect(page.locator('text=Pre-Built Adapters')).toBeVisible();
  });
});
