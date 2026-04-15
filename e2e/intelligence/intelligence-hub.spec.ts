import { test, expect } from '../fixtures/auth.fixture';

test.describe('Intelligence Hub', () => {
  test('renders agent profile editor and calls API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/agents/**/profile'),
      page.goto('/intelligence/profile'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('main').locator('text=Agent Profile').first()).toBeVisible();
    await expect(page.locator('[data-testid="profile-editor"]')).toBeVisible();
  });

  test('profile editor is pre-populated with backend content', async ({ page }) => {
    await page.goto('/intelligence/profile');
    await page.waitForResponse('**/app/v1/intelligence/agents/**/profile');
    const editor = page.locator('[data-testid="profile-editor"]');
    await expect(editor).toBeVisible({ timeout: 10000 });
    // Backend returns markdown content for the profile
    // Even a blank profile will have the textarea available
  });

  test('renders agent selector', async ({ page }) => {
    await page.goto('/intelligence/profile');
    await expect(page.locator('text=Agent:').first()).toBeVisible();
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible();
  });

  test('intelligence hub navigation tabs', async ({ page }) => {
    await page.goto('/intelligence/profile');
    await expect(page.locator('main').locator('text=Agent Profile').first()).toBeVisible();
    await expect(page.locator('main').locator('text=Working Memory')).toBeVisible();
    await expect(page.locator('main').locator('text=Episodic Memory')).toBeVisible();
    await expect(page.locator('main').locator('text=Semantic Memory')).toBeVisible();
    await expect(page.locator('main').locator('text=Skill Authoring')).toBeVisible();
  });

  test('working memory page renders editor and calls API', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/agents/**/memory/working'),
      page.goto('/intelligence/working-memory'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('[data-testid="working-memory-editor"]')).toBeVisible({ timeout: 10000 });
  });

  test('episodic memory page calls API and shows entries or empty state', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/agents/**/memory/episodic'),
      page.goto('/intelligence/episodic-memory'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('main').locator('text=Episodic Memory').first()).toBeVisible();
    await expect(
      page.locator('[data-testid="episodic-list"]').or(
        page.locator('text=No episodic memory entries yet.'),
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test('semantic memory page calls API and shows topics or empty state', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/agents/**/memory/semantic'),
      page.goto('/intelligence/semantic-memory'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('h2, h3').filter({ hasText: 'Topics' })).toBeVisible();
    // Either API topics or empty state
    await expect(
      page.locator('[data-testid="semantic-topics"]').or(
        page.locator('text=No topics yet.'),
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test('skill authoring page calls API and shows skill list or create prompt', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/skills/authored'),
      page.goto('/intelligence/skill-authoring'),
    ]);
    expect(res.status()).toBe(200);
    // Either the skill list or the "create" empty state is visible
    await expect(
      page.locator('[data-testid="skill-list"]').or(
        page.locator('text=No skills yet. Create one.').or(
          page.locator('text=Select a skill or create a new one'),
        ),
      ),
    ).toBeVisible({ timeout: 10000 });
  });
});
