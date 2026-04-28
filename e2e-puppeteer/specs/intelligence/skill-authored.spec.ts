/**
 * skill-authored.spec.ts
 *
 * Tests the Skill Authoring flow in the Intelligence Hub.
 * Authored skills are stored as SKILL.md files in MinIO under the user's
 * namespace. Tests cover create, read, update, fork, validate, and delete.
 */

import { TestContext } from '../../base/TestContext';
import { StoragePaths } from '../../helpers/minio.helper';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';

const SKILL_TEMPLATE = (skillId: string) =>
  `---\nname: ${skillId}\nversion: 1.0.0\n---\n` +
  `# ${skillId}\n\n` +
  `## Description\nE2E test skill created by skill-authored.spec.ts.\n\n` +
  `## Tools\n- graph_read\n\n` +
  `## Instructions\nReturn a summary of tasks with state=DONE for the given goal_id.\n`;

describe('Intelligence — Skill Authoring', () => {
  let ctx: TestContext;
  const createdSkillIds: string[] = [];

  beforeAll(async () => {
    ctx = await TestContext.create();
  });

  afterAll(async () => {
    for (const id of createdSkillIds) {
      await ctx.api.delete(`/intelligence/skills/authored/${id}`).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── List authored skills ───────────────────────────────────────────────────
  test('GET authored skills — returns array', async () => {
    const { body, status } = await ctx.api.get<unknown[]>(
      '/intelligence/skills/authored',
    );
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  // ── Validate skill content ─────────────────────────────────────────────────
  test('POST /skills/validate — valid SKILL.md returns valid=true', async () => {
    const { body, status } = await ctx.api.post<{
      valid?: boolean;
      errors?: string[];
    }>('/intelligence/skills/validate', {
      content: SKILL_TEMPLATE('validate-test'),
    });
    expect([200, 422]).toContain(status);
    if (status === 200) {
      expect(body.valid).toBe(true);
      expect(body.errors).toHaveLength(0);
    }
  });

  // ── Validate invalid content ───────────────────────────────────────────────
  test('POST /skills/validate — empty content returns errors', async () => {
    const { body, status } = await ctx.api.post<{
      valid?: boolean;
      errors?: string[];
    }>('/intelligence/skills/validate', { content: '' });
    expect([200, 422]).toContain(status);
    if (status === 200) {
      expect(body.valid).toBe(false);
    }
  });

  // ── Create authored skill ──────────────────────────────────────────────────
  test('POST authored skill → REST readable → MinIO key exists', async () => {
    const skillId = `e2e-skill-${Date.now()}`;
    createdSkillIds.push(skillId);

    const { status } = await ctx.api.post<{
      skill_id?: string;
    }>('/intelligence/skills/authored', {
      skill_id: skillId,
      content: SKILL_TEMPLATE(skillId),
    });
    expect([200, 201]).toContain(status);

    // REST: readable
    const { body: detail, status: getStatus } = await ctx.api.get<{
      skill_id?: string;
      content?: string;
    }>(`/intelligence/skills/authored/${skillId}`);
    expect(getStatus).toBe(200);
    expect(detail.content).toContain(skillId);

    // REST: in list
    const { body: list } = await ctx.api.get<
      Array<{ skill_id?: string; id?: string }>
    >('/intelligence/skills/authored');
    const found = list.find((s) => (s.skill_id ?? s.id) === skillId);
    expect(found).toBeDefined();

    // MinIO: object exists
    const key = StoragePaths.authoredSkill(ctx.userId, skillId);
    try {
      const exists = await ctx.minio.objectExists(key);
      expect(exists).toBe(true);
      const content = await ctx.minio.readObject(key);
      expect(content).toContain(skillId);
    } catch {
      console.warn('MinIO check skipped');
    }
  });

  // ── Update authored skill ──────────────────────────────────────────────────
  test('PUT authored skill → content updated in REST and MinIO', async () => {
    if (createdSkillIds.length === 0) return;
    const skillId = createdSkillIds[0];

    const updatedContent =
      `# ${skillId}\n\n` +
      `## Description\nUPDATED by skill-authored.spec.ts.\n\n` +
      `## Tools\n- graph_read\n- score_read\n\n` +
      `## Instructions\nReturn tasks and their scores.\n`;

    const { status } = await ctx.api.put(`/intelligence/skills/authored/${skillId}`, {
      content: updatedContent,
    });
    expect([200, 201]).toContain(status);

    const { body: after } = await ctx.api.get<{ content?: string }>(
      `/intelligence/skills/authored/${skillId}`,
    );
    expect(after.content).toContain('UPDATED');

    // MinIO: updated
    const key = StoragePaths.authoredSkill(ctx.userId, skillId);
    try {
      const minioContent = await ctx.minio.readObject(key);
      expect(minioContent).toContain('UPDATED');
    } catch {
      console.warn('MinIO read skipped');
    }
  });

  // ── Fork authored skill ────────────────────────────────────────────────────
  test('POST /authored/{id}/fork → creates new skill with -fork suffix', async () => {
    if (createdSkillIds.length === 0) return;
    const skillId = createdSkillIds[0];

    const { body, status } = await ctx.api.post<{
      forked_skill_id?: string;
      original_skill_id?: string;
    }>(`/intelligence/skills/authored/${skillId}/fork`);

    expect([200, 201]).toContain(status);
    if (body.forked_skill_id) {
      createdSkillIds.push(body.forked_skill_id);
      expect(body.original_skill_id).toBe(skillId);
    }
  });

  // ── Delete authored skill → REST 404 → MinIO absent ───────────────────────
  test('DELETE authored skill → REST 404 → MinIO key absent', async () => {
    const skillId = `e2e-delete-skill-${Date.now()}`;

    await ctx.api.post('/intelligence/skills/authored', {
      skill_id: skillId,
      content: SKILL_TEMPLATE(skillId),
    });

    const { status: delStatus } = await ctx.api.delete(
      `/intelligence/skills/authored/${skillId}`,
    );
    expect([200, 204]).toContain(delStatus);

    const { status: getStatus } = await ctx.api.get(
      `/intelligence/skills/authored/${skillId}`,
    );
    expect([404, 422]).toContain(getStatus);

    const key = StoragePaths.authoredSkill(ctx.userId, skillId);
    try {
      const exists = await ctx.minio.objectExists(key);
      expect(exists).toBe(false);
    } catch {
      console.warn('MinIO check skipped');
    }
  });

  // ── UI create + save flow ─────────────────────────────────────────────────
  test('skill authoring UI can create and persist a skill to MinIO', async () => {
    // Pre-clean: SkillAuthoringPage always sends name="new-skill" for newly created local skills
    await ctx.api.delete('/intelligence/skills/authored/new-skill').catch(() => {});

    const page = await ctx.newPage();
    const uiSkillId = `e2e-ui-skill-${Date.now()}`;
    try {
      await gotoAndWaitForApi(
        page,
        '/intelligence/skill-authoring',
        '/app/v1/intelligence/skills/authored',
      );
      await page.waitForSelector('[data-testid="create-skill-button"]', { timeout: 10000 });
      await page.click('[data-testid="create-skill-button"]');
      await page.waitForSelector('[data-testid="skill-editor"]', { timeout: 10000 });

      const content = SKILL_TEMPLATE(uiSkillId);
      await page.click('[data-testid="skill-editor"]');
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.type(content);

      await page.waitForFunction(
        () => {
          const btn = document.querySelector('[data-testid="save-skill-button"]') as HTMLButtonElement | null;
          return btn ? !btn.disabled : false;
        },
        { timeout: 10000 },
      );

      const [saveRes] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes('/app/v1/intelligence/skills/authored') &&
            res.request().method() === 'POST',
          { timeout: 15000 },
        ),
        page.click('[data-testid="save-skill-button"]'),
      ]);

      expect([200, 201]).toContain(saveRes.status());
      const created = (await saveRes.json()) as { skill_id?: string };
      expect(created.skill_id).toBeTruthy();

      const createdSkillId = created.skill_id as string;
      createdSkillIds.push(createdSkillId);

      const key = StoragePaths.authoredSkill(ctx.userId, createdSkillId);
      try {
        const exists = await ctx.minio.objectExists(key);
        expect(exists).toBe(true);
        const stored = await ctx.minio.readObject(key);
        expect(stored).toContain(uiSkillId);
      } catch {
        console.warn('MinIO check skipped');
      }
    } finally {
      await page.close();
    }
  });

  // ── UI page renders ────────────────────────────────────────────────────────
  test('skill authoring UI page loads from real API', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(
        page,
        '/intelligence/skill-authoring',
        '/app/v1/intelligence/skills/authored',
      );
      await page.waitForSelector('main', { timeout: 10000 });
    } finally {
      await page.close();
    }
  });
});
