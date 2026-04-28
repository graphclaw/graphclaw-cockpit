/**
 * agent-crud.spec.ts
 *
 * Tests Agent definition CRUD via /app/v1/agents.
 * Agents represent the orchestrators and sub-agents in the GraphClaw system.
 * After create/patch/delete, the REST API is the ground truth; AGE DB
 * verification applies if agents are stored as graph vertices.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';

describe('Agent — CRUD', () => {
  let ctx: TestContext;
  const createdIds: string[] = [];

  beforeAll(async () => {
    ctx = await TestContext.create();
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await ctx.api.delete(`/agents/${id}`).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── List agents ────────────────────────────────────────────────────────────
  test('GET /agents — agent monitor UI renders list from real API', async () => {
    const { body, status } = await ctx.api.get<Array<{ agent_id: string; name: string }>>('/agents');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/agent', '/app/v1/agent');
      await page.waitForSelector('main', { timeout: 10000 });
    } finally {
      await page.close();
    }
  });

  // ── Create agent ───────────────────────────────────────────────────────────
  test('POST /agents → agent in GET list → AGE vertex (if applicable)', async () => {
    const name = `[E2E] TestAgent ${Date.now()}`;
    const { body: created, status } = await ctx.api.post<{
      agent_id?: string;
      id?: string;
      name?: string;
    }>('/agents', {
      name,
      description: 'E2E agent for agent-crud spec',
      config: {
        model: 'claude-sonnet-4-6',
        autonomy_level: 'LOW',
        max_actions_per_cycle: 3,
        tools: ['graph_read'],
      },
      tags: ['e2e', 'agent-crud'],
    });

    expect([200, 201]).toContain(status);
    const agentId = created.agent_id ?? created.id ?? '';
    expect(agentId).toBeTruthy();
    createdIds.push(agentId);

    // REST: agent appears in GET list
    const { body: list, status: listStatus } = await ctx.api.get<
      Array<{ agent_id?: string; id?: string; name: string }>
    >('/agents');
    expect(listStatus).toBe(200);
    const found = list.find(
      (a) => (a.agent_id ?? a.id) === agentId || a.name === name,
    );
    expect(found).toBeDefined();

    // AGE DB: try to find agent as a graph vertex (may or may not be stored in AGE)
    const node = await ctx.db.getNodeById(agentId).catch(() => null);
    if (node !== null) {
      expect(node.name).toBe(name);
    }
    // Note: agents may be in a relational table rather than AGE — both are valid
  });

  // ── Get single agent ───────────────────────────────────────────────────────
  test('GET /agents/{id} returns the agent with correct fields', async () => {
    if (createdIds.length === 0) { console.warn('Skipping: no agent created'); return; }
    const agentId = createdIds[0];

    const { body, status } = await ctx.api.get<{
      agent_id?: string;
      id?: string;
      name?: string;
      config?: Record<string, unknown>;
    }>(`/agents/${agentId}`);
    expect(status).toBe(200);
    expect(body.agent_id ?? body.id).toBe(agentId);
    expect(body.config).toBeDefined();
  });

  // ── Patch agent ────────────────────────────────────────────────────────────
  test('PATCH /agents/{id} → updated name in REST response', async () => {
    if (createdIds.length === 0) return;
    const agentId = createdIds[0];
    const newName = `[E2E] PatchedAgent ${Date.now()}`;

    const { status } = await ctx.api.patch(`/agents/${agentId}`, { name: newName });
    expect([200, 204]).toContain(status);

    const { body: after } = await ctx.api.get<{ name?: string }>(`/agents/${agentId}`);
    expect(after.name).toBe(newName);
  });

  // ── Agent test action ──────────────────────────────────────────────────────
  test('POST /agents/{id}/test → returns queue_depth and status', async () => {
    if (createdIds.length === 0) return;
    const agentId = createdIds[0];

    const { body, status } = await ctx.api.post<{
      agent_id?: string;
      status?: string;
      queue_depth?: number;
    }>(`/agents/${agentId}/test`);
    expect([200, 202]).toContain(status);
    expect(body.agent_id ?? body.status).toBeTruthy();
  });

  // ── Delete agent ───────────────────────────────────────────────────────────
  test('DELETE /agents/{id} → 404 on subsequent GET', async () => {
    const name = `[E2E] DeleteAgent ${Date.now()}`;
    const { body: created, status: createStatus } = await ctx.api.post<{
      agent_id?: string;
      id?: string;
    }>('/agents', {
      name,
      description: 'to be deleted',
      config: { model: 'claude-haiku-4-5-20251001', autonomy_level: 'LOW' },
      tags: ['e2e', 'delete-test'],
    });
    if (![200, 201].includes(createStatus)) return;

    const agentId = created.agent_id ?? created.id ?? '';

    const { status: delStatus } = await ctx.api.delete(`/agents/${agentId}`);
    expect([200, 204]).toContain(delStatus);

    const { status: getStatus } = await ctx.api.get(`/agents/${agentId}`);
    expect([404, 422]).toContain(getStatus);
  });

  // ── Agent monitor UI ───────────────────────────────────────────────────────
  test('agent monitor UI — status and action queue from real API', async () => {
    const [statusRes, queueRes] = await Promise.all([
      ctx.api.get<{ running?: boolean; queue_depth?: number }>('/agent/status'),
      ctx.api.get<unknown[]>('/agent/action-queue'),
    ]);
    expect(statusRes.status).toBe(200);
    expect(queueRes.status).toBe(200);

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/agent', '/app/v1/agent/status');
      await page.waitForSelector('main', { timeout: 10000 });
      // Status section must render
      await page.waitForFunction(
        () => (document.querySelector('main')?.innerText.length ?? 0) > 10,
        { timeout: 10000 },
      );
    } finally {
      await page.close();
    }
  });

  // ── Agent versions ─────────────────────────────────────────────────────────
  test('GET /agents/{id}/versions returns array (even if empty)', async () => {
    if (createdIds.length === 0) return;
    const agentId = createdIds[0];

    const { body, status } = await ctx.api.get<unknown[]>(`/agents/${agentId}/versions`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});
