import { test, expect } from '../fixtures/auth.fixture';

test.describe('Canvas Editor', () => {
  test('renders canvas with React Flow', async ({ page }) => {
    await page.goto('/canvas');
    await expect(page.locator('[data-testid="canvas-editor"]')).toBeVisible();
  });

  test('shows toolbar with undo/redo/export/import', async ({ page }) => {
    await page.goto('/canvas');
    await expect(page.locator('text=Undo')).toBeVisible();
    await expect(page.locator('text=Redo')).toBeVisible();
    await expect(page.locator('text=Export')).toBeVisible();
    await expect(page.locator('text=Import')).toBeVisible();
  });

  test('node palette is visible', async ({ page }) => {
    await page.goto('/canvas');
    await expect(page.locator('text=Node Palette')).toBeVisible();
    await expect(page.locator('text=LLM Call')).toBeVisible();
    await expect(page.locator('text=Tool Call')).toBeVisible();
  });

  test('minimap and controls render', async ({ page }) => {
    await page.goto('/canvas');
    // React Flow renders controls and minimap
    await expect(page.locator('.react-flow__controls, [data-testid="rf-controls"]').first()).toBeVisible({ timeout: 5000 });
  });
});
