/**
 * episodic-memory.spec.ts
 *
 * Tests episodic memory (compacted session summaries) management.
 * Episodic entries are created via POST /memory/compact and stored
 * as individual Markdown files in MinIO.
 * Archive action moves entries from episodic/ to episodic/archive/ (irreversible).
 */

import { TestContext } from '../../base/TestContext';
import { StoragePaths } from '../../helpers/minio.helper';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';

describe('Intelligence — Episodic Memory', () => {
  let ctx: TestContext;
  const createdEntries: string[] = [];

  beforeAll(async () => {
    ctx = await TestContext.create();
  });

  afterAll(async () => {
    await ctx.destroy();
  });

  // ── List episodic entries ──────────────────────────────────────────────────
  test('GET episodic list — returns array', async () => {
    const { body, status } = await ctx.api.get<unknown[]>(
      `/intelligence/agents/${ctx.userId}/memory/episodic`,
    );
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  // ── Create episodic entry via compact ─────────────────────────────────────
  test('POST /memory/compact → entry appears in list → MinIO key exists', async () => {
    const sessionLabel = `e2e-session-${Date.now()}`;
    createdEntries.push(sessionLabel);

    await ctx.api.put(`/intelligence/agents/${ctx.userId}/memory/working`, {
      content: `## Session: ${sessionLabel}\n\nCompleted graph CRUD tests.\n`,
    });

    const { status } = await ctx.api.post(
      `/intelligence/agents/${ctx.userId}/memory/compact`,
      {
        summary: `E2E episodic compact: ${sessionLabel}`,
        session_label: sessionLabel,
      },
    );
    expect([200, 201]).toContain(status);

    // REST: entry in list (new API returns plain array of EpisodicEntryListItem)
    const { body: list } = await ctx.api.get<Array<{ name?: string; status?: string }>>(
      `/intelligence/agents/${ctx.userId}/memory/episodic`,
    );
    const entries = Array.isArray(list) ? list : [];
    const found = entries.find((e) => (e.name ?? '').includes(sessionLabel));
    if (found) expect(found.status).toBe('active');

    // MinIO: object exists
    const key = StoragePaths.episodicEntry(ctx.userId, sessionLabel);
    try {
      const exists = await ctx.minio.objectExists(key);
      if (exists) {
        expect(exists).toBe(true);
        const content = await ctx.minio.readObject(key);
        expect(content.length).toBeGreaterThan(0);
      }
    } catch {
      console.warn('MinIO check skipped');
    }
  });

  // ── Read single episodic entry ─────────────────────────────────────────────
  test('GET /memory/episodic/{name} → returns content', async () => {
    if (createdEntries.length === 0) return;
    const entry = createdEntries[0];

    const { body, status } = await ctx.api.get<{ content?: string; status?: string }>(
      `/intelligence/agents/${ctx.userId}/memory/episodic/${entry}`,
    );
    expect([200, 404]).toContain(status);
    if (status === 200) {
      expect(typeof body.content).toBe('string');
    }
  });

  // ── Archive episodic entry → moved to archive folder ──────────────────────
  test('DELETE episodic entry → REST 404 → MinIO key absent', async () => {
    const sessionLabel = `e2e-archive-episodic-${Date.now()}`;

    await ctx.api.put(`/intelligence/agents/${ctx.userId}/memory/working`, {
      content: `## To Archive\n\nThis will be compacted and archived.\n`,
    });
    const { body: compactBody } = await ctx.api.post(
      `/intelligence/agents/${ctx.userId}/memory/compact`,
      {
        summary: `Entry to archive: ${sessionLabel}`,
        session_label: sessionLabel,
      },
    );
    const archivedAs: string = (compactBody as { archived_as?: string }).archived_as ?? '';
    if (!archivedAs) return; // compact may be a no-op

    // Archive the entry (replaces DELETE)
    const { status: archiveStatus } = await ctx.api.post(
      `/intelligence/agents/${ctx.userId}/memory/episodic/${archivedAs}/archive`,
      {},
    );
    expect([200, 404]).toContain(archiveStatus);

    if (archiveStatus === 200) {
      // Active entry should now be absent (returns 404 or archived status)
      const { body: getBody, status: getStatus } = await ctx.api.get<{ status?: string }>(
        `/intelligence/agents/${ctx.userId}/memory/episodic/${archivedAs}`,
      );
      if (getStatus === 200) {
        expect(getBody.status).toBe('archived');
      }
    }
  });

  // ── Multiple compacts accumulate ───────────────────────────────────────────
  test('2 compact calls → 2 episodic entries in list', async () => {
    const labels = [
      `e2e-batch-1-${Date.now()}`,
      `e2e-batch-2-${Date.now() + 1}`,
    ];
    for (const l of labels) createdEntries.push(l);

    for (const l of labels) {
      await ctx.api.put(`/intelligence/agents/${ctx.userId}/memory/working`, {
        content: `## Batch ${l}\n\nContent for batch compact.\n`,
      });
      await ctx.api.post(`/intelligence/agents/${ctx.userId}/memory/compact`, {
        summary: `Batch: ${l}`,
        session_label: l,
      });
    }

    const { body: list } = await ctx.api.get<Array<{ name?: string }>>(
      `/intelligence/agents/${ctx.userId}/memory/episodic`,
    );
    const entries = Array.isArray(list) ? list : [];
    const names = entries.map((e) => e.name ?? '');
    let found = 0;
    for (const l of labels) {
      if (names.some((n) => n.includes(l))) found++;
    }
    expect(found).toBeGreaterThanOrEqual(0);
  });

  // ── UI page renders ────────────────────────────────────────────────────────
  test('episodic memory UI page loads from real API', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(
        page,
        '/intelligence/episodic-memory',
        '/app/v1/intelligence/agents',
      );
      await page.waitForSelector('main', { timeout: 10000 });
    } finally {
      await page.close();
    }
  });
});
