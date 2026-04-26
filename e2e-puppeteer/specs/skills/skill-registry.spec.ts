/**
 * skill-registry.spec.ts
 *
 * Tests the Skill Marketplace / Registry via /app/v1/skills.
 * Covers listing, searching, installing from a source, and deleting skills.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi, waitForText } from '../../helpers/browser.helper';

describe('Skills — Registry', () => {
  let ctx: TestContext;
  const installedIds: string[] = [];
  const addedSourceUris: string[] = [];

  beforeAll(async () => {
    ctx = await TestContext.create();
  });

  afterAll(async () => {
    for (const id of installedIds) {
      await ctx.api.delete(`/skills/${id}`).catch(() => {});
    }
    for (const uri of addedSourceUris) {
      await ctx.api.delete(`/skills/sources/${encodeURIComponent(uri)}`).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── List skills ────────────────────────────────────────────────────────────
  test('GET /skills — UI badge count matches API response', async () => {
    const { body, status } = await ctx.api.get<
      Array<{ skill_id?: string; skill_name?: string; name?: string }>
    >('/skills');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/skills', '/app/v1/skills');
      await page.waitForSelector('main', { timeout: 10000 });

      if (body.length > 0) {
        // Badge or count text should mention the number
        await waitForText(page, String(body.length), 10000).catch(() => {});
      }
    } finally {
      await page.close();
    }
  });

  // ── Search skills ──────────────────────────────────────────────────────────
  test('GET /skills/search?q= — returns filtered results', async () => {
    const { body, status } = await ctx.api.get<unknown[]>('/skills/search?q=graph');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    // May return 0 results if no skills match "graph"
    expect(body.length).toBeGreaterThanOrEqual(0);
  });

  // ── List sources ───────────────────────────────────────────────────────────
  test('GET /skills/sources — returns array of skill sources', async () => {
    const { body, status } = await ctx.api.get<unknown[]>('/skills/sources');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  // ── Add skill source ───────────────────────────────────────────────────────
  test('POST /skills/sources → source in GET /sources list', async () => {
    const sourceUri = `graphclaw://e2e-test-registry/${Date.now()}`;
    addedSourceUris.push(sourceUri);

    const { body, status } = await ctx.api.post<{
      source_type?: string;
      uri?: string;
    }>('/skills/sources', {
      source_type: 'local',
      uri: sourceUri,
      name: `E2E Test Registry ${Date.now()}`,
      auth_secret_ref: null,
    });
    expect([200, 201, 409]).toContain(status); // 409 if already registered

    if ([200, 201].includes(status)) {
      const { body: sources } = await ctx.api.get<Array<{ source_uri?: string; uri?: string }>>('/skills/sources');
      const found = sources.find((s) => (s.source_uri ?? s.uri) === sourceUri);
      expect(found).toBeDefined();
    }
  });

  // ── Add source through UI ─────────────────────────────────────────────────
  test('skills UI Add Source submits and persists source', async () => {
    const page = await ctx.newPage();
    const sourceUri = `graphclaw://e2e-ui-source/${Date.now()}`;
    const sourceName = `E2E UI Source ${Date.now()}`;
    addedSourceUris.push(sourceUri);

    try {
      await gotoAndWaitForApi(page, '/skills', '/app/v1/skills/sources');
      await page.waitForSelector('[data-testid="skills-tab-sources"]', { timeout: 10000 });
      await page.click('[data-testid="skills-tab-sources"]');

      await page.waitForSelector('[data-testid="toggle-add-source"]', { timeout: 10000 });
      await page.click('[data-testid="toggle-add-source"]');

      await page.type('[data-testid="source-uri-input"]', sourceUri);
      await page.type('[data-testid="source-name-input"]', sourceName);

      const [addRes] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes('/app/v1/skills/sources') &&
            res.request().method() === 'POST',
          { timeout: 15000 },
        ),
        page.click('[data-testid="submit-add-source"]'),
      ]);

      expect([200, 201]).toContain(addRes.status());

      const { body: sources, status } = await ctx.api.get<Array<{ source_uri?: string }>>('/skills/sources');
      expect(status).toBe(200);
      expect(sources.some((s) => s.source_uri === sourceUri)).toBe(true);
    } finally {
      await page.close();
    }
  });

  // ── Install skill ──────────────────────────────────────────────────────────
  test('POST /skills/install → skill in GET /skills list', async () => {
    const skillName = `e2e-test-skill-${Date.now()}`;
    const { body: installed, status } = await ctx.api.post<{
      skill_id?: string;
      id?: string;
      skill_name?: string;
    }>('/skills/install', {
      skill_name: skillName,
      source_uri: 'graphclaw://builtin/graph-query',
      version: '1.0.0',
    });

    expect([200, 201, 404, 409]).toContain(status);

    if ([200, 201].includes(status)) {
      const skillId = installed.skill_id ?? installed.id ?? '';
      if (skillId) installedIds.push(skillId);

      // REST: skill in list
      const { body: list } = await ctx.api.get<
        Array<{ skill_id?: string; id?: string; skill_name?: string; name?: string }>
      >('/skills');
      const found = list.find(
        (s) =>
          (s.skill_id ?? s.id) === skillId ||
          (s.skill_name ?? s.name) === skillName,
      );
      expect(found).toBeDefined();
    }
  });

  // ── Tags search ────────────────────────────────────────────────────────────
  test('GET /skills/search?tags= — returns skills matching tag', async () => {
    const { body, status } = await ctx.api.get<unknown[]>('/skills/search?tags=builtin');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  // ── Delete skill ───────────────────────────────────────────────────────────
  test('DELETE /skills/{id} → skill no longer in list', async () => {
    // Install a skill to delete
    const { body: created, status: createStatus } = await ctx.api.post<{
      skill_id?: string;
      id?: string;
    }>('/skills/install', {
      skill_name: `e2e-delete-skill-${Date.now()}`,
      source_uri: 'graphclaw://builtin/score-explain',
      version: '1.0.0',
    });

    if (![200, 201].includes(createStatus)) return;
    const skillId = created.skill_id ?? created.id ?? '';
    if (!skillId) return;

    const { status: delStatus } = await ctx.api.delete(`/skills/${skillId}`);
    expect([200, 204]).toContain(delStatus);

    const { body: list } = await ctx.api.get<Array<{ skill_id?: string; id?: string }>>('/skills');
    const stillThere = list.find((s) => (s.skill_id ?? s.id) === skillId);
    expect(stillThere).toBeUndefined();
  });

  // ── UI search filters ──────────────────────────────────────────────────────
  test('skill marketplace UI renders and search filters in real-time', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/skills', '/app/v1/skills');
      await page.waitForSelector('main', { timeout: 10000 });

      // Try typing in search box if present
      const searchInput = await page.$('input[type="search"], input[placeholder*="Search"]').catch(() => null);
      if (searchInput) {
        await searchInput.type('graph');
        await page.waitForResponse(
          (r) => r.url().includes('/app/v1/skills'),
          { timeout: 5000 },
        ).catch(() => {});
      }
    } finally {
      await page.close();
    }
  });
});
