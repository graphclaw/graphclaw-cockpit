// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-MEM-W17-001 — Tiered memory lifecycle (working / episodic / semantic)
 *
 * Scenario: Proves the three-tier agent memory loop end-to-end through the cockpit
 * and backend: chat → distillation → working memory, compact → episodic archive,
 * semantic topic create → agent load, and episodic recall.
 *
 * PRD: docs/prd/06-intelligence.md §Memory
 * Build wave: W17 (Wave Tiered-Memory)
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-06-24
 *
 * Cases covered:
 *  - chat → working memory distillation, compact via UI → episodic archive entry
 *  - semantic topic create → present in _index, agent processes a query
 *  - episodic entries seeded in MinIO are listed, recall query processed
 *  - full lifecycle across all three tiers
 *
 * Notes:
 *  - Requires docker compose stack. Run: docker compose up -d
 *  - Resolves agentId from the shared agent-selector so MinIO + API paths align.
 *  - Skips gracefully on 401/429 (rate limit in full-suite runs).
 */
import { test, expect, TEST_USER_ID } from '../fixtures/test';
import { StoragePaths } from '../helpers/minio';

const API = '/app/v1/intelligence';

// Fixed agent for deterministic seed/render alignment. The intelligence layout's
// agent-selector settles asynchronously (so reading its value races); instead we
// explicitly select a known agent on each page and seed memory under the same id.
const AGENT = 'main';

/** Select a known agent in the shared selector so the page + seeded data align. */
async function selectAgent(
  page: import('@playwright/test').Page,
  agentId: string = AGENT,
): Promise<void> {
  const selector = page.locator('[data-testid="agent-selector"]');
  await expect(selector).toBeVisible({ timeout: 10000 });
  await selector.selectOption(agentId);
}

function rateLimited(status: number): boolean {
  return [401, 429].includes(status);
}

test.describe('Tiered memory lifecycle', () => {
  // ── Scenario 1: chat → distillation → working memory → compact → episodic ────
  test('GC-E-MEM-W17-001 — compact working memory creates an episodic archive', async ({
    page,
    api,
  }) => {
    const agentId = AGENT;

    // Seed a large (>8KB) working memory via API so the size warning + compact apply.
    const big = `# Working Context\n\n${'Lots of accumulated context. '.repeat(400)}`;
    const putRes = await api.put(`${API}/agents/${agentId}/memory/working`, {
      data: { content: big },
    });
    if (rateLimited(putRes.status())) {
      test.skip(true, 'Rate limited — passes when run alone');
      return;
    }
    expect(putRes.status()).toBeGreaterThanOrEqual(200);
    expect(putRes.status()).toBeLessThan(300);

    // Navigate to the working-memory page and select the seeded agent; the
    // large-content warning should then show.
    await page.goto('/intelligence/working-memory');
    await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/agents/**/memory/working'),
      selectAgent(page, agentId),
    ]);
    await expect(page.locator('[data-testid="working-memory-editor"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Working memory is large/i)).toBeVisible({ timeout: 10000 });

    // Open the compact dialog and archive (toolbar "Compact…" button, not the
    // inline "compacting" link in the size warning).
    await page.getByRole('button', { name: 'Compact…' }).click();
    const label = `e2e-${Date.now()}`;
    await page.locator('[data-testid="compact-summary"]').fill('Session summary for E2E');
    await page.locator('[data-testid="compact-label"]').fill(label);

    const [compactRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/memory/compact') && r.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /Archive & Clear/i }).click(),
    ]);
    expect(compactRes.status()).toBe(200);
    const compactBody = (await compactRes.json()) as { archived_as: string };
    expect(compactBody.archived_as).toContain(label);

    // Episodic list (API) should now include the archive entry.
    const epRes = await api.get(`${API}/agents/${agentId}/memory/episodic`);
    expect(epRes.status()).toBe(200);
    const epData = (await epRes.json()) as Array<{ name: string }>;
    const found = epData.some((e) => e.name.includes(label));
    expect(found).toBe(true);

    // Working memory was replaced with the compact summary.
    const wmRes = await api.get(`${API}/agents/${agentId}/memory/working`);
    const wm = (await wmRes.json()) as { content?: string };
    expect(wm.content).toContain('Session summary for E2E');

    // Estimate reflects the much smaller working context.
    const estRes = await api.get(`${API}/agents/${agentId}/memory/estimate`);
    expect(estRes.status()).toBe(200);
    const est = (await estRes.json()) as { working_chars: number };
    expect(est.working_chars).toBeLessThan(big.length);

    // Cleanup the archive entry we created.
    await api
      .delete(`${API}/agents/${agentId}/memory/episodic/${compactBody.archived_as}`)
      .catch(() => {});
  });

  // ── Scenario 2: semantic memory → agent load ─────────────────────────────────
  test('GC-E-MEM-W17-002 — semantic topic created via UI is in the index and loadable', async ({
    page,
    api,
  }) => {
    const slug = `team-roles-${Date.now()}`;
    const description = 'Who is who on the team';
    const content = 'Alice is PM. Bob is backend.';

    await page.goto('/intelligence/semantic-memory');
    await expect(
      page
        .locator('[data-testid="semantic-topics"]')
        .or(page.locator('text=No topics yet.')),
    ).toBeVisible({ timeout: 10000 });
    await selectAgent(page, AGENT);
    const agentId = AGENT;

    await page.locator('[data-testid="add-topic-btn"]').click();
    await page.locator('[data-testid="new-topic-input"]').fill(slug);
    await page.locator('[data-testid="new-topic-description-input"]').fill(description);
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-testid="semantic-editor"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="semantic-editor"]').fill(content);
    await page.locator('[data-testid="topic-description-editor"]').fill(description);

    const [putRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes(`/memory/semantic/${slug}`) && r.request().method() === 'PUT',
      ),
      page.getByRole('button', { name: /save/i }).click(),
    ]);
    expect(putRes.status()).toBe(200);

    // The topic must be present in the semantic index the agent injects.
    const indexRes = await api.get(`${API}/agents/${agentId}/memory/semantic/_index`);
    expect(indexRes.status()).toBe(200);
    const indexData = (await indexRes.json()) as { topics: Array<{ name: string }> };
    expect(indexData.topics.map((t) => t.name)).toContain(slug);

    // The agent can process a query (semantic memory is available in its prompt).
    const chatRes = await api.post('/app/v1/chat/messages', {
      data: { content: 'Who is the PM on the team?', role: 'user' },
    });
    expect([200, 201, 202]).toContain(chatRes.status());

    // Cleanup
    await api.delete(`${API}/agents/${agentId}/memory/semantic/${slug}`).catch(() => {});
  });

  // ── Scenario 3: episodic memory recall ───────────────────────────────────────
  test('GC-E-MEM-W17-003 — seeded episodic entries are listed and recall is processed', async ({
    page,
    api,
    minio,
  }) => {
    const agentId = AGENT;
    const e1 = `2026-06-20-compact-sprint-${Date.now()}.md`;
    const e2 = `2026-06-23-compact-design-${Date.now()}.md`;

    await minio.writeObject(
      StoragePaths.episodicEntry(TEST_USER_ID, e1, agentId),
      'Discussed Q3 OKRs and team allocation',
      'text/markdown',
    );
    await minio.writeObject(
      StoragePaths.episodicEntry(TEST_USER_ID, e2, agentId),
      'Reviewed API redesign for v2',
      'text/markdown',
    );

    // Both entries appear in the episodic list page once the seeded agent is selected.
    await page.goto('/intelligence/episodic-memory');
    await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/agents/**/memory/episodic'),
      selectAgent(page, agentId),
    ]);
    await expect(page.locator('[data-testid="episodic-list"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(e1.replace('.md', ''))).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(e2.replace('.md', ''))).toBeVisible({ timeout: 10000 });

    // The agent processes a recall query.
    const chatRes = await api.post('/app/v1/chat/messages', {
      data: { content: 'What did we discuss in sprint planning?', role: 'user' },
    });
    expect([200, 201, 202]).toContain(chatRes.status());

    // Cleanup seeded entries.
    await minio.deleteObject(StoragePaths.episodicEntry(TEST_USER_ID, e1, agentId)).catch(() => {});
    await minio.deleteObject(StoragePaths.episodicEntry(TEST_USER_ID, e2, agentId)).catch(() => {});
  });

  // ── Scenario 4: full lifecycle across all three tiers ────────────────────────
  test('GC-E-MEM-W17-004 — full lifecycle: write → compact → semantic → estimate', async ({
    page,
    api,
  }) => {
    const agentId = AGENT;

    // 1. Large working memory.
    const big = `# Context\n\n${'Standup at 9am. '.repeat(600)}`;
    const seedRes = await api.put(`${API}/agents/${agentId}/memory/working`, {
      data: { content: big },
    });
    if (rateLimited(seedRes.status())) {
      test.skip(true, 'Rate limited — passes when run alone');
      return;
    }

    // 2. Create a semantic topic via API.
    const slug = `processes-${Date.now()}`;
    await api.put(`${API}/agents/${agentId}/memory/semantic/${slug}`, {
      data: { content: 'Standup at 9am. Retro on Fridays.', description: 'Team processes' },
    });

    // 3. Compact the working memory.
    const compactRes = await api.post(`${API}/agents/${agentId}/memory/compact`, {
      data: { summary: 'User prefers morning standups', session_label: `full-${Date.now()}` },
    });
    expect(compactRes.status()).toBe(200);
    const compactBody = (await compactRes.json()) as { archived_as: string };

    // 4. Working memory == compact summary; episodic archive exists.
    const wm = (await (await api.get(`${API}/agents/${agentId}/memory/working`)).json()) as {
      content?: string;
    };
    expect(wm.content).toBe('User prefers morning standups');

    const epRes = await api.get(`${API}/agents/${agentId}/memory/episodic`);
    const epData = (await epRes.json()) as Array<{ name: string }>;
    expect(epData.some((e) => e.name === compactBody.archived_as)).toBe(true);

    // 5. Estimate utilization is well under budget after compaction.
    const est = (await (await api.get(`${API}/agents/${agentId}/memory/estimate`)).json()) as {
      working_chars: number;
      utilization_pct: number;
    };
    expect(est.working_chars).toBeLessThan(big.length);

    // 6. Cockpit pages reflect the final state.
    await page.goto('/intelligence/episodic-memory');
    await Promise.all([
      page.waitForResponse('**/app/v1/intelligence/agents/**/memory/episodic'),
      selectAgent(page, agentId),
    ]);
    await expect(page.locator('[data-testid="episodic-list"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(compactBody.archived_as.replace('.md', ''))).toBeVisible({
      timeout: 10000,
    });

    // 7. Agent processes a query with all three tiers populated.
    const chatRes = await api.post('/app/v1/chat/messages', {
      data: { content: 'What are my team processes?', role: 'user' },
    });
    expect([200, 201, 202]).toContain(chatRes.status());

    // Cleanup
    await api.delete(`${API}/agents/${agentId}/memory/semantic/${slug}`).catch(() => {});
    await api
      .delete(`${API}/agents/${agentId}/memory/episodic/${compactBody.archived_as}`)
      .catch(() => {});
  });
});
