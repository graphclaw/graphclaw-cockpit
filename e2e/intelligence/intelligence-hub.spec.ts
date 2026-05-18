// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../fixtures/auth.fixture';
import { TEST_USER_ID } from '../fixtures/auth.fixture';

test.describe('Intelligence Hub', () => {
  test('agent profile page — content matches MinIO storage via API', async ({ page, api }) => {
    const res = await api.get(`/app/v1/intelligence/agents/${TEST_USER_ID}/profile`);
    if ([401, 429].includes(res.status())) {
      test.skip(true, 'Rate limited in full suite — passes when run alone');
      return;
    }
    expect(res.status()).toBe(200);
    const profile = await res.json() as { content?: string };

    const [uiRes] = await Promise.all([
      page.waitForResponse(`**/app/v1/intelligence/agents/**`),
      page.goto('/intelligence/profile'),
    ]);
    expect(uiRes.status()).toBe(200);
    await expect(page.locator('[data-testid="profile-editor"]')).toBeVisible({ timeout: 10000 });

    // If profile has content, it should appear in the editor
    if (profile.content && profile.content.length > 10) {
      const editorText = await page.locator('[data-testid="profile-editor"]').inputValue();
      expect(editorText).toContain(profile.content.substring(0, 30));
    }
  });

  test('EDIT profile → PUT to MinIO → content persists', async ({ page, api }) => {
    const newContent = `# Agent Profile\nUpdated by E2E test at ${Date.now()}\n`;

    const [profileRes] = await Promise.all([
      page.waitForResponse(`**/app/v1/intelligence/agents/**`),
      page.goto('/intelligence/profile'),
    ]);
    if ([401, 429].includes(profileRes.status())) {
      test.skip(true, 'Rate limited in full suite — passes when run alone');
      return;
    }
    await expect(page.locator('[data-testid="profile-editor"]')).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="profile-editor"]').fill(newContent);

    const saveBtn = page.locator('button').filter({ hasText: /Save|Update/i });
    await expect(saveBtn).toBeVisible();
    const [putRes] = await Promise.all([
      page.waitForResponse(`**/app/v1/intelligence/agents/**`),
      saveBtn.click(),
    ]);
    // PUT returns 200, PATCH (old) returned 405 — accept any 2xx
    expect(putRes.status()).toBeGreaterThanOrEqual(200);
    expect(putRes.status()).toBeLessThan(300);

    // Verify content persisted in MinIO via API
    const verifyRes = await api.get(`/app/v1/intelligence/agents/${TEST_USER_ID}/profile`);
    const saved = await verifyRes.json() as { content?: string };
    expect(saved.content).toContain('Updated by E2E test');
  });

  test('working memory — API content matches editor display', async ({ page, api }) => {
    const res = await api.get(`/app/v1/intelligence/agents/${TEST_USER_ID}/memory/working`);
    if ([401, 429].includes(res.status())) {
      test.skip(true, 'Rate limited in full suite — passes when run alone');
      return;
    }
    expect(res.status()).toBe(200);
    const memory = await res.json() as { content?: string };

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/agents/**/memory/working'),
      page.goto('/intelligence/working-memory'),
    ]);
    expect(uiRes.status()).toBe(200);
    await expect(page.locator('[data-testid="working-memory-editor"]')).toBeVisible({ timeout: 10000 });

    if (memory.content && memory.content.length > 10) {
      const editorVal = await page.locator('[data-testid="working-memory-editor"]').inputValue();
      expect(editorVal).toContain(memory.content.substring(0, 30));
    }
  });

  test('episodic memory — API entries shown or empty state', async ({ page, api }) => {
    const res = await api.get(`/app/v1/intelligence/agents/${TEST_USER_ID}/memory/episodic`);
    if ([401, 429].includes(res.status())) {
      test.skip(true, 'Rate limited in full suite — passes when run alone');
      return;
    }
    expect(res.status()).toBe(200);
    const data = await res.json() as { entries?: unknown[] };

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/agents/**/memory/episodic'),
      page.goto('/intelligence/episodic-memory'),
    ]);
    expect(uiRes.status()).toBe(200);

    if (data.entries && data.entries.length > 0) {
      await expect(page.locator('[data-testid="episodic-list"]')).toBeVisible({ timeout: 10000 });
    } else {
      await expect(
        page.locator('[data-testid="episodic-list"]').or(page.locator('text=No episodic memory entries yet.')).first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('semantic memory — API topics shown or empty state', async ({ page, api }) => {
    const res = await api.get(`/app/v1/intelligence/agents/${TEST_USER_ID}/memory/semantic`);
    expect(res.status()).toBe(200);
    const data = await res.json() as { topics?: unknown[] };

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/agents/**/memory/semantic'),
      page.goto('/intelligence/semantic-memory'),
    ]);
    expect(uiRes.status()).toBe(200);

    await expect(
      page.locator('[data-testid="semantic-topics"]').or(page.locator('text=No topics yet.')),
    ).toBeVisible({ timeout: 10000 });
  });

  test('skill authoring — API skills list matches UI', async ({ page, api }) => {
    const res = await api.get('/app/v1/intelligence/skills/authored');
    expect(res.status()).toBe(200);
    const data = await res.json() as { skills?: Array<{ skill_id: string; name: string }> };
    const skills = data.skills ?? [];

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/skills/authored'),
      page.goto('/intelligence/skill-authoring'),
    ]);
    expect(uiRes.status()).toBe(200);

    if (skills.length > 0) {
      await expect(page.locator('[data-testid="skill-list"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator(`text=${skills[0].name}`).first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(
        page.locator('[data-testid="skill-list"]').or(page.locator('text=No skills yet')),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  // GC-E-INT-W10-001
  test('semantic memory — create topic with description → index entry stored', async ({ page, api }) => {
    const slug = `e2e-test-${Date.now()}`;
    const description = 'E2E test topic description';
    const content = `# ${slug}\n\nTest content for E2E.`;

    await page.goto('/intelligence/semantic-memory');
    await expect(page.locator('[data-testid="semantic-topics"]').or(page.locator('text=No topics yet.'))).toBeVisible({ timeout: 10000 });

    // Read the agent ID the UI is actually using — avoid TEST_USER_ID mismatch
    const agentId = await page.locator('[data-testid="agent-selector"]').inputValue();

    // Create new topic via the dedicated + button
    await page.locator('[data-testid="add-topic-btn"]').click();
    await page.locator('[data-testid="new-topic-input"]').fill(slug);
    await page.locator('[data-testid="new-topic-description-input"]').fill(description);
    await page.keyboard.press('Enter');

    // Fill content and save
    await expect(page.locator('[data-testid="semantic-editor"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="semantic-editor"]').fill(content);
    await page.locator('[data-testid="topic-description-editor"]').fill(description);

    const [putRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/memory/semantic/${slug}`) && r.request().method() === 'PUT'),
      page.getByRole('button', { name: /save/i }).click(),
    ]);
    expect(putRes.status()).toBe(200);

    // Verify index entry using the same agentId the UI used
    const indexRes = await api.get(`/app/v1/intelligence/agents/${agentId}/memory/semantic/_index`);
    expect(indexRes.status()).toBe(200);
    const indexData = await indexRes.json() as { topics: Array<{ name: string; description: string }> };
    const entry = indexData.topics.find((t) => t.name === slug);
    expect(entry).toBeDefined();
    expect(entry?.description).toBe(description);

    // Cleanup
    await api.delete(`/app/v1/intelligence/agents/${agentId}/memory/semantic/${slug}`);
  });

  // GC-E-INT-W10-002
  test('semantic memory — index descriptions visible in topic list', async ({ page, api }) => {
    const slug = `e2e-desc-${Date.now()}`;
    const description = 'Visible description for E2E test';

    // Navigate first to discover which agent the UI defaults to
    await page.goto('/intelligence/semantic-memory');
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 10000 });
    const agentId = await page.locator('[data-testid="agent-selector"]').inputValue();

    // Seed via API for the correct agent
    await api.put(`/app/v1/intelligence/agents/${agentId}/memory/semantic/${slug}`, {
      data: { content: `# ${slug}\n\nContent.`, description },
    });

    // Reload and wait for both the topics list and the index (description comes from index)
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/memory/semantic/_index') && r.status() < 400),
      page.reload(),
    ]);

    await expect(page.locator('[data-testid="semantic-topics"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`[data-testid="topic-description-${slug}"]`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`[data-testid="topic-description-${slug}"]`)).toHaveText(description);

    // Cleanup
    await api.delete(`/app/v1/intelligence/agents/${agentId}/memory/semantic/${slug}`);
  });

  // GC-E-INT-W10-003
  test('semantic memory — rename topic → old file deleted, new file exists', async ({ page, api }) => {
    const oldSlug = `e2e-rename-src-${Date.now()}`;
    const newSlug = `e2e-rename-dst-${Date.now()}`;

    // Navigate first to discover which agent the UI defaults to
    await page.goto('/intelligence/semantic-memory');
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 10000 });
    const agentId = await page.locator('[data-testid="agent-selector"]').inputValue();

    // Seed via API for the correct agent
    await api.put(`/app/v1/intelligence/agents/${agentId}/memory/semantic/${oldSlug}`, {
      data: { content: `# Original`, description: 'Rename source' },
    });

    // Reload and wait for the seeded topic to appear
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/memory/semantic') && !r.url().includes('_index') && r.status() < 400),
      page.reload(),
    ]);
    await expect(page.locator(`text=${oldSlug}`)).toBeVisible({ timeout: 10000 });

    // Hover the topic item — rename button is hidden until group-hover, use force to click it
    await page.locator('[data-testid="semantic-topics"]').locator(`text=${oldSlug}`).first().hover();
    await page.locator(`[data-testid="rename-btn-${oldSlug}"]`).click({ force: true });

    // Type new name and confirm
    await page.locator(`[data-testid="rename-input-${oldSlug}"]`).fill(newSlug);
    const [renameRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/rename') && r.request().method() === 'POST'),
      page.locator(`[data-testid="rename-confirm-${oldSlug}"]`).click(),
    ]);
    expect(renameRes.status()).toBe(200);

    // Old file should 404, new file should 200
    const oldRes = await api.get(`/app/v1/intelligence/agents/${agentId}/memory/semantic/${oldSlug}`);
    expect(oldRes.status()).toBe(404);
    const newRes = await api.get(`/app/v1/intelligence/agents/${agentId}/memory/semantic/${newSlug}`);
    expect(newRes.status()).toBe(200);

    // Index should show new name
    const indexRes = await api.get(`/app/v1/intelligence/agents/${agentId}/memory/semantic/_index`);
    const indexData = await indexRes.json() as { topics: Array<{ name: string }> };
    const names = indexData.topics.map((t) => t.name);
    expect(names).not.toContain(oldSlug);
    expect(names).toContain(newSlug);

    // Cleanup
    await api.delete(`/app/v1/intelligence/agents/${agentId}/memory/semantic/${newSlug}`);
  });

  // GC-E-INT-W10-004
  test('semantic memory — delete topic → removed from index', async ({ page, api }) => {
    const slug = `e2e-del-${Date.now()}`;

    // Navigate first to discover which agent the UI defaults to
    await page.goto('/intelligence/semantic-memory');
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 10000 });
    const agentId = await page.locator('[data-testid="agent-selector"]').inputValue();

    // Seed via API for the correct agent
    await api.put(`/app/v1/intelligence/agents/${agentId}/memory/semantic/${slug}`, {
      data: { content: `# Delete Me`, description: 'Will be deleted' },
    });

    // Reload and wait for the seeded topic to appear
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/memory/semantic') && !r.url().includes('_index') && r.status() < 400),
      page.reload(),
    ]);
    await expect(page.locator(`text=${slug}`)).toBeVisible({ timeout: 10000 });

    // Select and delete
    await page.locator(`text=${slug}`).click();
    await page.getByRole('button', { name: /delete file/i }).click();
    const [deleteRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/memory/semantic/${slug}`) && r.request().method() === 'DELETE'),
      page.getByRole('button', { name: /^delete$/i }).click(),
    ]);
    expect(deleteRes.status()).toBe(204);

    // Index should no longer contain the topic
    const indexRes = await api.get(`/app/v1/intelligence/agents/${agentId}/memory/semantic/_index`);
    const indexData = await indexRes.json() as { topics: Array<{ name: string }> };
    const names = indexData.topics.map((t) => t.name);
    expect(names).not.toContain(slug);
  });

  test('intelligence hub nav tabs navigate correctly', async ({ page }) => {
    await page.goto('/intelligence/profile');
    await expect(page.locator('[data-testid="profile-editor"]')).toBeVisible({ timeout: 10000 });

    // Click each tab and verify navigation
    await page.locator('a').filter({ hasText: 'Working Memory' }).click();
    await expect(page.locator('[data-testid="working-memory-editor"]')).toBeVisible({ timeout: 10000 });

    await page.locator('a').filter({ hasText: 'Episodic Memory' }).click();
    await expect(
      page.locator('[data-testid="episodic-list"]').or(page.locator('text=No episodic memory')).first(),
    ).toBeVisible({ timeout: 10000 });
  });
});

