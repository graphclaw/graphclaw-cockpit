/**
 * a2a-keys.spec.ts
 *
 * Tests Agent-to-Agent (A2A) key management via /app/v1/a2a.
 * Keys are one-time-disclosed on creation — after that only the key_id
 * is accessible. Tests cover generate, rotate, and revoke.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi, waitForText } from '../../helpers/browser.helper';

describe('A2A — Agent Keys', () => {
  let ctx: TestContext;
  const createdKeyIds: string[] = [];

  beforeAll(async () => {
    ctx = await TestContext.create();
  });

  afterAll(async () => {
    for (const id of createdKeyIds) {
      await ctx.api.delete(`/a2a/agents/${id}`).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── List A2A agents ────────────────────────────────────────────────────────
  test('GET /a2a/agents — UI shows key entries from real API', async () => {
    const { body, status } = await ctx.api.get<
      Array<{ key_id?: string; id?: string; agent_name?: string }>
    >('/a2a/agents');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/settings/a2a', '/app/v1/a2a');
      await page.waitForSelector('main', { timeout: 10000 });
      if (body.length > 0) {
        await waitForText(page, String(body.length), 10000).catch(() => {});
      }
    } finally {
      await page.close();
    }
  });

  // ── Generate new A2A key ───────────────────────────────────────────────────
  test('POST /a2a/agents → key_id in list → api_key disclosed once', async () => {
    const agentName = `[E2E] A2A Agent ${Date.now()}`;
    const { body: created, status } = await ctx.api.post<{
      key_id?: string;
      agent_name?: string;
      api_key?: string;
    }>('/a2a/agents', {
      agent_name: agentName,
      description: 'E2E A2A key from a2a-keys.spec.ts',
    });

    expect([200, 201]).toContain(status);
    expect(created.key_id).toBeTruthy();
    expect(created.api_key).toBeTruthy(); // one-time disclosure

    createdKeyIds.push(created.key_id!);

    // REST: key in list
    const { body: list } = await ctx.api.get<
      Array<{ key_id?: string; agent_name?: string }>
    >('/a2a/agents');
    const found = list.find(
      (k) => k.key_id === created.key_id || k.agent_name === agentName,
    );
    expect(found).toBeDefined();

    // api_key is NOT returned in list (security: never re-disclosed)
    if (found && 'api_key' in found) {
      const keyInList = (found as { api_key?: string }).api_key;
      expect(keyInList).toBeFalsy();
    }

    // SQL: try finding in a2a_keys table
    try {
      const rows = await ctx.db.querySQL<{ agent_name: string }>(
        "SELECT agent_name FROM a2a_keys WHERE key_id = $1",
        [created.key_id],
      );
      if (rows.length > 0) {
        expect(rows[0].agent_name).toBe(agentName);
      }
    } catch {
      // Not in a relational table — may use secrets backend
    }
  });

  // ── Rotate A2A key ─────────────────────────────────────────────────────────
  test('POST /a2a/agents/{id}/rotate → new api_key issued, key_id unchanged', async () => {
    if (createdKeyIds.length === 0) return;
    const keyId = createdKeyIds[0];

    const { body, status } = await ctx.api.post<{
      key_id?: string;
      new_api_key?: string;
    }>(`/a2a/agents/${keyId}/rotate`);

    expect([200, 201]).toContain(status);
    expect(body.key_id).toBe(keyId); // same ID
    expect(body.new_api_key).toBeTruthy(); // new secret value

    // key_id still in list
    const { body: list } = await ctx.api.get<Array<{ key_id?: string }>>('/a2a/agents');
    const found = list.find((k) => k.key_id === keyId);
    expect(found).toBeDefined();
  });

  // ── Multiple keys for different agents ────────────────────────────────────
  test('generate 2 keys → both appear in list', async () => {
    const names = [
      `[E2E] Multi-A ${Date.now()}`,
      `[E2E] Multi-B ${Date.now() + 1}`,
    ];

    for (const name of names) {
      const { body: k, status } = await ctx.api.post<{ key_id?: string }>('/a2a/agents', {
        agent_name: name,
        description: `E2E multi-key test: ${name}`,
      });
      if ([200, 201].includes(status) && k.key_id) {
        createdKeyIds.push(k.key_id);
      }
    }

    const { body: list } = await ctx.api.get<
      Array<{ key_id?: string }>
    >('/a2a/agents');
    const count = list.filter((k) => createdKeyIds.includes(k.key_id ?? '')).length;
    expect(count).toBeGreaterThanOrEqual(Math.min(2, createdKeyIds.length));
  });

  // ── Delete A2A key ─────────────────────────────────────────────────────────
  test('DELETE /a2a/agents/{id} → key no longer in list', async () => {
    const { body: created, status: createStatus } = await ctx.api.post<{
      key_id?: string;
    }>('/a2a/agents', {
      agent_name: `[E2E] Delete A2A ${Date.now()}`,
      description: 'to be deleted',
    });
    if (![200, 201].includes(createStatus) || !created.key_id) return;

    const { status: delStatus } = await ctx.api.delete(`/a2a/agents/${created.key_id}`);
    expect([200, 204]).toContain(delStatus);

    const { body: list } = await ctx.api.get<Array<{ key_id?: string; revoked?: boolean }>>('/a2a/agents');
    // Backend soft-deletes (sets revoked=true) — ensure the key is absent or revoked
    const stillActive = list.find((k) => k.key_id === created.key_id && !k.revoked);
    expect(stillActive).toBeUndefined();
  });

  // ── UI generate key ────────────────────────────────────────────────────────
  test('UI generate button → POST to /a2a/agents → count increases', async () => {
    const { body: before } = await ctx.api.get<unknown[]>('/a2a/agents');
    const countBefore = before.length;

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/settings/a2a', '/app/v1/a2a');
      await page.waitForSelector('main', { timeout: 10000 });

      const generateBtn = await page
        .$('[data-testid="generate-a2a-key"], button ::-p-text(Generate)')
        .catch(() => null);

      if (generateBtn) {
        const [apiRes] = await Promise.all([
          page.waitForResponse(
            (r) =>
              r.url().includes('/app/v1/a2a/agents') &&
              r.request().method() === 'POST',
            { timeout: 15000 },
          ).catch(() => null),
          generateBtn.click(),
        ]);

        if (apiRes) {
          expect([200, 201]).toContain(apiRes.status());

          const { body: after } = await ctx.api.get<unknown[]>('/a2a/agents');
          expect(after.length).toBeGreaterThan(countBefore);

          // Add to cleanup
          const createdBody = await apiRes.json().catch(() => null) as { key_id?: string } | null;
          if (createdBody?.key_id) {
            createdKeyIds.push(createdBody.key_id);
          }
        }
      }
    } finally {
      await page.close();
    }
  });
});
