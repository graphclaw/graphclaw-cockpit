import { test, expect } from '../fixtures/auth.fixture';

test.describe('Chat', () => {
  test('renders chat page', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('text=GraphClaw Chat')).toBeVisible();
  });

  test('renders mock messages', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('text=What are the top priority tasks')).toBeVisible();
  });

  test('chat input is visible', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
  });

  test('can type and send a message', async ({ page }) => {
    await page.goto('/chat');
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('Hello agent');
    await input.press('Enter');
    await expect(page.locator('text=Hello agent')).toBeVisible();
  });

  test('suggestion pills are visible', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('text=Show my tasks for today')).toBeVisible();
  });
});
