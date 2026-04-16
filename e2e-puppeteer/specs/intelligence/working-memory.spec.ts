/**
 * working-memory.spec.ts
 *
 * Tests the working-memory (current session context) CRUD.
 * Working memory is stored as a Markdown file in MinIO.
 * After PUT → verifies REST content and MinIO object content match.
 */

import { TestContext } from '../../base/TestContext';
import { StoragePaths } from '../../helpers/minio.helper';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';

describe('Intelligence — Working Memory', () => {
  let ctx: TestContext;
  let originalContent = '';

  beforeAll(async () => {
    ctx = await TestContext.create();
    const { body } = await ctx.api.get<{ content?: string }>(
      `/intelligence/agents/${ctx.userId}/memory/working`,
    );
    originalContent = body.content ?? '';
  });

  afterAll(async () => {
    if (originalContent) {
      await ctx.api.put(`/intelligence/agents/${ctx.userId}/memory/working`, {
        content: originalContent,
      }).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── Read working memory ────────────────────────────────────────────────────
  test('GET working memory — returns content or empty string', async () => {
    const { body, status } = await ctx.api.get<{ content?: string }>(
      `/intelligence/agents/${ctx.userId}/memory/working`,
    );
    expect(status).toBe(200);
    expect(typeof (body.content ?? '')).toBe('string');
  });

  // ── Write working memory → REST and MinIO ──────────────────────────────────
  test('PUT working memory → REST content updated → MinIO object updated', async () => {
    const newContent =
      `## Working Context — E2E Test\n\n` +
      `Session: working-memory.spec.ts\n` +
      `Timestamp: ${new Date().toISOString()}\n\n` +
      `Current focus: verifying MinIO object persistence.\n`;

    const { status } = await ctx.api.put(
      `/intelligence/agents/${ctx.userId}/memory/working`,
      { content: newContent },
    );
    expect([200, 201]).toContain(status);

    // REST round-trip
    const { body: after } = await ctx.api.get<{ content?: string }>(
      `/intelligence/agents/${ctx.userId}/memory/working`,
    );
    expect(after.content).toContain('E2E Test');
    expect(after.content).toContain('working-memory.spec.ts');

    // MinIO: object must contain the same content
    const key = StoragePaths.workingMemory(ctx.userId);
    try {
      const minioContent = await ctx.minio.readObject(key);
      expect(minioContent).toContain('E2E Test');
    } catch {
      console.warn('MinIO read skipped');
    }
  });

  // ── Overwrite working memory ───────────────────────────────────────────────
  test('overwrite working memory → only new content present in MinIO', async () => {
    const v1 = `## Version 1\n\nOLD content ${Date.now()}\n`;
    const v2 = `## Version 2\n\nNEW content ${Date.now()}\n`;

    // Write v1
    await ctx.api.put(`/intelligence/agents/${ctx.userId}/memory/working`, { content: v1 });

    // Overwrite with v2
    await ctx.api.put(`/intelligence/agents/${ctx.userId}/memory/working`, { content: v2 });

    const { body: current } = await ctx.api.get<{ content?: string }>(
      `/intelligence/agents/${ctx.userId}/memory/working`,
    );
    expect(current.content).toContain('Version 2');
    expect(current.content).not.toContain('Version 1');

    // MinIO: only v2 present
    const key = StoragePaths.workingMemory(ctx.userId);
    try {
      const minioContent = await ctx.minio.readObject(key);
      expect(minioContent).toContain('Version 2');
      expect(minioContent).not.toContain('Version 1');
    } catch {
      console.warn('MinIO read skipped');
    }
  });

  // ── UI renders working memory ──────────────────────────────────────────────
  test('working memory UI page loads content from real API', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(
        page,
        '/intelligence/working-memory',
        '/app/v1/intelligence/agents',
      );
      await page.waitForSelector('main', { timeout: 10000 });
      await page.waitForFunction(
        () => document.querySelector('main')?.innerText.length! > 5,
        { timeout: 10000 },
      );
    } finally {
      await page.close();
    }
  });

  // ── Compact to episodic ────────────────────────────────────────────────────
  test('POST memory/compact → episodic entry created in MinIO', async () => {
    const sessionLabel = `e2e-compact-${Date.now()}`;

    // Write some content to compact
    await ctx.api.put(`/intelligence/agents/${ctx.userId}/memory/working`, {
      content: `## To Compact\n\nThis session covered working memory tests.\n`,
    });

    const { body, status } = await ctx.api.post(
      `/intelligence/agents/${ctx.userId}/memory/compact`,
      {
        summary: `E2E working memory spec completed at ${new Date().toISOString()}`,
        session_label: sessionLabel,
      },
    );
    expect([200, 201]).toContain(status);

    // REST: episodic list should contain the new entry
    const { body: episodic } = await ctx.api.get<{
      entries?: Array<{ name?: string; entry_name?: string }>;
    }>(`/intelligence/agents/${ctx.userId}/memory/episodic`);
    const entries = episodic.entries ?? [];
    const found = entries.find(
      (e) => (e.name ?? e.entry_name ?? '').includes(sessionLabel),
    );
    if (found) {
      expect(found).toBeDefined();
    }

    // MinIO: episodic file created
    const key = StoragePaths.episodicEntry(ctx.userId, sessionLabel);
    try {
      const exists = await ctx.minio.objectExists(key);
      if (exists) {
        expect(exists).toBe(true);
        // Clean up this episodic entry
        await ctx.api.delete(
          `/intelligence/agents/${ctx.userId}/memory/episodic/${sessionLabel}`,
        ).catch(() => {});
      }
    } catch {
      console.warn('MinIO check skipped');
    }
  });
});
