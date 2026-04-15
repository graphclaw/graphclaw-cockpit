import { test, expect } from '../fixtures/auth.fixture';

test.describe('Chat', () => {
  test('renders chat page', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('text=GraphClaw Chat')).toBeVisible();
  });

  test('calls chat messages API on load', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/chat/messages'),
      page.goto('/chat'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('[data-testid="chat-view"]')).toBeVisible();
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
    // Bot responds after delay
    await expect(page.locator('text=I understand your request')).toBeVisible({ timeout: 5000 });
  });

  test('suggestion pills are visible', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('text=Show my tasks for today')).toBeVisible();
  });
});
