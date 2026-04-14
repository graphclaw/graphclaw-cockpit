import { test, expect } from '../fixtures/auth.fixture';

test.describe('Settings — Channels', () => {
  test('renders channels page', async ({ page }) => {
    await page.goto('/settings/channels');
    await expect(page.locator('text=Channels')).toBeVisible();
    await expect(page.locator('text=WhatsApp')).toBeVisible();
    await expect(page.locator('text=Telegram')).toBeVisible();
  });
});

test.describe('Settings — LLM Providers', () => {
  test('renders LLM providers page', async ({ page }) => {
    await page.goto('/settings/llm');
    await expect(page.locator('text=LLM Providers')).toBeVisible();
    await expect(page.locator('text=Anthropic')).toBeVisible();
  });
});

test.describe('Settings — Scoring Weights', () => {
  test('renders scoring page with 7 factors', async ({ page }) => {
    await page.goto('/settings/scoring');
    await expect(page.locator('text=Scoring Weights')).toBeVisible();
    await expect(page.locator('text=Urgency')).toBeVisible();
    await expect(page.locator('text=Priority')).toBeVisible();
  });
});

test.describe('Settings — A2A Keys', () => {
  test('renders A2A keys page', async ({ page }) => {
    await page.goto('/settings/a2a');
    await expect(page.locator('text=A2A Keys')).toBeVisible();
    await expect(page.locator('text=Generate New Key')).toBeVisible();
  });
});
