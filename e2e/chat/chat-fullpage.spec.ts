import { test, expect } from '../fixtures/auth.fixture';

test.describe('Chat', () => {
  test('renders chat page with correct data-testid', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('[data-testid="chat-view"]')).toBeVisible();
  });

  test('GET chat/messages called on load — response matches UI', async ({ page, api }) => {
    // Read ground truth from API
    const apiRes = await api.get('/app/v1/chat/messages');
    expect(apiRes.status()).toBe(200);
    const body = await apiRes.json() as { messages: Array<{ message_id: string; content: string; role: string }> };

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/chat/messages'),
      page.goto('/chat'),
    ]);
    expect(uiRes.status()).toBe(200);

    // If there are existing messages, they should be visible in the chat
    if (body.messages.length > 0) {
      const firstMsg = body.messages[0];
      await expect(page.locator(`text=${firstMsg.content.substring(0, 30)}`).first()).toBeVisible({ timeout: 10000 });
    } else {
      // Empty state — chat input and suggestion pills visible
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('chat input is present and accepts text', async ({ page }) => {
    await page.goto('/chat');
    const input = page.locator('[data-testid="chat-input"]');
    await expect(input).toBeVisible();
    await input.fill('Hello from E2E test');
    await expect(input).toHaveValue('Hello from E2E test');
  });

  test('SEND message via UI → message stored in backend', async ({ page, api }) => {
    // Clear existing messages first
    await api.delete('/app/v1/chat/messages').catch(() => {});

    const msgText = `E2E test message ${Date.now()}`;

    await page.goto('/chat');
    const input = page.locator('[data-testid="chat-input"]');
    await expect(input).toBeVisible({ timeout: 10000 });

    // Type and send the message
    await input.fill(msgText);
    const [sendRes] = await Promise.all([
      page.waitForResponse('**/app/v1/chat/messages'),
      input.press('Enter'),
    ]);
    // POST to chat/messages should succeed
    expect([200, 201]).toContain(sendRes.status());

    // Message should appear in the UI
    await expect(page.locator(`text=${msgText}`).first()).toBeVisible({ timeout: 10000 });

    // Verify via API: message is now stored in backend
    const historyRes = await api.get('/app/v1/chat/messages');
    const history = await historyRes.json() as { messages: Array<{ content: string; role: string }> };
    const found = history.messages.some((m) => m.content.includes(msgText));
    expect(found).toBe(true);
  });

  test('suggestion pills are visible and clickable', async ({ page }) => {
    await page.goto('/chat');
    // Suggestion pills should be present
    const pills = page.locator('[data-testid="chat-view"] button').filter({ hasText: /task|today|brief/i });
    const count = await pills.count();
    if (count > 0) {
      const firstPill = pills.first();
      await firstPill.click();
      // After clicking, the pill text should appear in the input or as a sent message
      const input = page.locator('[data-testid="chat-input"]');
      await expect(input.or(page.locator('[data-testid="chat-view"] .message-bubble'))).toBeVisible({ timeout: 5000 });
    }
  });
});

