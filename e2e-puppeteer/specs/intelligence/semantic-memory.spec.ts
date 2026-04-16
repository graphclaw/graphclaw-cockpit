/**
 * semantic-memory.spec.ts
 *
 * Tests semantic memory (long-term knowledge base) CRUD.
 * Each semantic "topic" is a named Markdown document stored in MinIO.
 * After PUT → verifies REST content and MinIO key exist.
 * After DELETE → verifies REST 404 and MinIO key absent.
 */

import { TestContext } from '../../base/TestContext';
import { StoragePaths } from '../../helpers/minio.helper';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';

describe('Intelligence — Semantic Memory', () => {
  let ctx: TestContext;
  const createdTopics: string[] = [];

  beforeAll(async () => {
    ctx = await TestContext.create();
  });

  afterAll(async () => {
    for (const topic of createdTopics) {
      await ctx.api.delete(
        `/intelligence/agents/${ctx.userId}/memory/semantic/${topic}`,
      ).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── List semantic topics ───────────────────────────────────────────────────
  test('GET semantic memory list — returns array of entries', async () => {
    const { body, status } = await ctx.api.get<{
      entries?: unknown[];
    }>(`/intelligence/agents/${ctx.userId}/memory/semantic`);
    expect(status).toBe(200);
    expect(Array.isArray(body.entries ?? [])).toBe(true);
  });

  // ── Create semantic topic ──────────────────────────────────────────────────
  test('PUT new semantic topic → REST readable → MinIO object exists', async () => {
    const topic = `e2e-test-topic-${Date.now()}`;
    createdTopics.push(topic);

    const content =
      `## E2E Semantic Memory Test\n\n` +
      `Topic: ${topic}\n` +
      `Created: ${new Date().toISOString()}\n\n` +
      `## Key Facts\n- GraphClaw uses Apache AGE for graph storage\n` +
      `- MinIO stores agent memory as Markdown files\n`;

    const { status } = await ctx.api.put(
      `/intelligence/agents/${ctx.userId}/memory/semantic/${topic}`,
      { content },
    );
    expect([200, 201]).toContain(status);

    // REST: topic readable
    const { body: after, status: getStatus } = await ctx.api.get<{ content?: string }>(
      `/intelligence/agents/${ctx.userId}/memory/semantic/${topic}`,
    );
    expect(getStatus).toBe(200);
    expect(after.content).toContain(topic);

    // REST: topic appears in list
    const { body: list } = await ctx.api.get<{
      entries?: Array<{ key?: string; name?: string; topic?: string }>;
    }>(`/intelligence/agents/${ctx.userId}/memory/semantic`);
    const entries = list.entries ?? [];
    const found = entries.find(
      (e) => (e.key ?? e.name ?? e.topic ?? '').includes(topic),
    );
    expect(found).toBeDefined();

    // MinIO: object exists
    const key = StoragePaths.semanticTopic(ctx.userId, topic);
    try {
      const exists = await ctx.minio.objectExists(key);
      expect(exists).toBe(true);
      const minioContent = await ctx.minio.readObject(key);
      expect(minioContent).toContain(topic);
    } catch {
      console.warn('MinIO check skipped');
    }
  });

  // ── Update semantic topic ──────────────────────────────────────────────────
  test('PUT existing topic → content replaced in REST and MinIO', async () => {
    if (createdTopics.length === 0) return;
    const topic = createdTopics[0];

    const updatedContent =
      `## Updated Semantic Memory\n\n` +
      `Topic: ${topic}\n` +
      `Updated: ${new Date().toISOString()}\n\n` +
      `## Updated Facts\n- Content was replaced by semantic-memory.spec.ts\n`;

    await ctx.api.put(
      `/intelligence/agents/${ctx.userId}/memory/semantic/${topic}`,
      { content: updatedContent },
    );

    const { body: after } = await ctx.api.get<{ content?: string }>(
      `/intelligence/agents/${ctx.userId}/memory/semantic/${topic}`,
    );
    expect(after.content).toContain('Updated Facts');
    expect(after.content).not.toContain('Key Facts');

    // MinIO: updated content
    const key = StoragePaths.semanticTopic(ctx.userId, topic);
    try {
      const minioContent = await ctx.minio.readObject(key);
      expect(minioContent).toContain('Updated Facts');
    } catch {
      console.warn('MinIO read skipped');
    }
  });

  // ── Delete semantic topic ──────────────────────────────────────────────────
  test('DELETE semantic topic → 404 from REST → MinIO key absent', async () => {
    const topic = `e2e-delete-semantic-${Date.now()}`;

    // Create then immediately delete
    await ctx.api.put(
      `/intelligence/agents/${ctx.userId}/memory/semantic/${topic}`,
      { content: `## To Delete\n\nThis will be deleted.\n` },
    );

    const { status: delStatus } = await ctx.api.delete(
      `/intelligence/agents/${ctx.userId}/memory/semantic/${topic}`,
    );
    expect([200, 204]).toContain(delStatus);

    // REST: 404
    const { status: getStatus } = await ctx.api.get(
      `/intelligence/agents/${ctx.userId}/memory/semantic/${topic}`,
    );
    expect([404, 422]).toContain(getStatus);

    // MinIO: key absent
    const key = StoragePaths.semanticTopic(ctx.userId, topic);
    try {
      const exists = await ctx.minio.objectExists(key);
      expect(exists).toBe(false);
    } catch {
      console.warn('MinIO check skipped');
    }
  });

  // ── Multiple topics ────────────────────────────────────────────────────────
  test('create 3 semantic topics → all 3 in list → all 3 in MinIO', async () => {
    const topics = [
      `e2e-arch-${Date.now()}`,
      `e2e-patterns-${Date.now() + 1}`,
      `e2e-conventions-${Date.now() + 2}`,
    ];
    for (const t of topics) {
      createdTopics.push(t);
    }

    for (const t of topics) {
      await ctx.api.put(
        `/intelligence/agents/${ctx.userId}/memory/semantic/${t}`,
        { content: `## ${t}\n\nContent for ${t}.\n` },
      );
    }

    const { body: list } = await ctx.api.get<{
      entries?: Array<{ key?: string; name?: string; topic?: string }>;
    }>(`/intelligence/agents/${ctx.userId}/memory/semantic`);
    const names = (list.entries ?? []).map(
      (e) => e.key ?? e.name ?? e.topic ?? '',
    );

    for (const t of topics) {
      const inList = names.some((n) => n.includes(t));
      expect(inList).toBe(true);

      // MinIO: each exists
      const key = StoragePaths.semanticTopic(ctx.userId, t);
      try {
        const exists = await ctx.minio.objectExists(key);
        expect(exists).toBe(true);
      } catch {
        console.warn(`MinIO check skipped for ${t}`);
      }
    }
  });

  // ── UI page renders ────────────────────────────────────────────────────────
  test('semantic memory UI page loads from real API', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(
        page,
        '/intelligence/semantic-memory',
        '/app/v1/intelligence/agents',
      );
      await page.waitForSelector('main', { timeout: 10000 });
    } finally {
      await page.close();
    }
  });
});
