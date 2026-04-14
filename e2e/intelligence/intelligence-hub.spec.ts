import { test, expect } from '../fixtures/auth.fixture';

test.describe('Intelligence Hub', () => {
  test('renders agent profile editor', async ({ page }) => {
    await page.goto('/intelligence/profile');
    await expect(page.locator('main').locator('text=Agent Profile').first()).toBeVisible();
    await expect(page.locator('[data-testid="profile-editor"]')).toBeVisible();
  });

  test('renders agent selector', async ({ page }) => {
    await page.goto('/intelligence/profile');
    await expect(page.locator('text=Agent:').first()).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });

  test('intelligence hub navigation tabs', async ({ page }) => {
    await page.goto('/intelligence/profile');
    await expect(page.locator('main').locator('text=Agent Profile').first()).toBeVisible();
    await expect(page.locator('main').locator('text=Working Memory')).toBeVisible();
    await expect(page.locator('main').locator('text=Episodic Memory')).toBeVisible();
    await expect(page.locator('main').locator('text=Semantic Memory')).toBeVisible();
    await expect(page.locator('main').locator('text=Skill Authoring')).toBeVisible();
  });

  test('working memory page renders editor', async ({ page }) => {
    await page.goto('/intelligence/working-memory');
    await expect(page.locator('[data-testid="working-memory-editor"]')).toBeVisible();
  });

  test('episodic memory page shows entries', async ({ page }) => {
    await page.goto('/intelligence/episodic-memory');
    await expect(page.locator('main').locator('text=Episodic Memory').first()).toBeVisible();
    await expect(page.locator('text=Sprint 12 planning session')).toBeVisible();
  });

  test('semantic memory page shows topics', async ({ page }) => {
    await page.goto('/intelligence/semantic-memory');
    await expect(page.locator('h2, h3').filter({ hasText: 'Topics' })).toBeVisible();
    await expect(page.locator('text=Task Scoring').first()).toBeVisible();
  });

  test('skill authoring page shows skill list', async ({ page }) => {
    await page.goto('/intelligence/skill-authoring');
    await expect(page.locator('text=email-triage').first()).toBeVisible();
    await expect(page.locator('[data-testid="skill-editor"]')).toBeVisible();
  });
});
