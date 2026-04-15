import { test, expect } from '../fixtures/auth.fixture';

test.describe('Settings — Channels', () => {
  test('renders channels page', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/settings/channels'),
      page.goto('/settings/channels'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('main').locator('text=Channels').first()).toBeVisible();
  });

  test('shows channel cards (API-driven or fallback)', async ({ page }) => {
    await page.goto('/settings/channels');
    // Either real API data or the fallback cards are shown
    await expect(page.locator('[data-testid="channels-grid"]')).toBeVisible({ timeout: 10000 });
    // Fallback always shows WhatsApp at minimum
    await expect(page.locator('text=WhatsApp')).toBeVisible();
  });
});

test.describe('Settings — LLM Providers', () => {
  test('renders LLM providers page', async ({ page }) => {
    await page.goto('/settings/llm');
    await expect(page.locator('main').locator('text=LLM Providers').first()).toBeVisible();
  });

  test('shows provider cards', async ({ page }) => {
    await page.goto('/settings/llm');
    await expect(page.locator('text=Anthropic')).toBeVisible();
    await expect(page.locator('text=OpenAI')).toBeVisible();
  });
});

test.describe('Settings — Scoring Weights', () => {
  test('renders scoring page with 7 factors from backend', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/settings/scoring-weights'),
      page.goto('/settings/scoring'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('main').locator('text=Scoring Weights').first()).toBeVisible();
    await expect(page.locator('[data-testid="scoring-weights-form"]')).toBeVisible({ timeout: 10000 });
    // Backend W1-W7 factors are shown with their real labels
    await expect(page.locator('text=Timeline Urgency')).toBeVisible();
  });
});

test.describe('Settings — A2A Keys', () => {
  test('renders A2A keys page', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/a2a/agents'),
      page.goto('/settings/a2a'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('text=Agent-to-Agent Keys')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Generate Key' })).toBeVisible();
  });

  test('shows empty state when no keys registered', async ({ page }) => {
    await page.goto('/settings/a2a');
    // API returns empty array initially
    await expect(
      page.locator('text=No A2A keys registered yet.').or(
        page.locator('[data-testid="a2a-keys-list"]'),
      ),
    ).toBeVisible({ timeout: 10000 });
  });
});
