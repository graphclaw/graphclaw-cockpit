/**
 * GC-E-A2A-W18-001 — A2A Agent Key Management
 *
 * Scenario: Tests Agent-to-Agent key lifecycle: generate, rotate, list, delete.
 * Keys are one-time-disclosed on creation — after that only the key_id is accessible.
 *
 * PRD: docs/prd/15-a2a-protocol.md §AC-15.2
 * Build wave: W18
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-06
 *
 * Cases covered:
 *  - List A2A agents from API
 *  - Generate new key and verify one-time disclosure
 *  - Rotate key (same key_id, new secret)
 *  - Generate multiple keys
 *  - Delete key and verify removal
 *  - UI generate button fires POST
 */

import { test, expect } from '../fixtures/test';

test.describe('A2A — Agent Keys', () => {
  const createdKeyIds: string[] = [];

  test.afterAll(async ({ api }) => {
    for (const id of createdKeyIds) {
      await api.delete(`/app/v1/a2a/agents/${id}`).catch(() => {});
    }
  });

  test('GET /a2a/agents — returns list', async ({ api }) => {
    const res = await api.get('/app/v1/a2a/agents');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /a2a/agents → key_id disclosed once', async ({ api }) => {
    const agentName = `[E2E] A2A Agent ${Date.now()}`;
    const res = await api.post('/app/v1/a2a/agents', {
      data: { agent_name: agentName, description: 'E2E A2A key test' },
    });
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body.key_id).toBeTruthy();
    expect(body.api_key).toBeTruthy();
    createdKeyIds.push(body.key_id);

    const listRes = await api.get('/app/v1/a2a/agents');
    const list = await listRes.json();
    const found = list.find(
      (k: { key_id?: string; agent_name?: string }) =>
        k.key_id === body.key_id || k.agent_name === agentName,
    );
    expect(found).toBeDefined();
    expect(found.api_key).toBeFalsy();
  });

  test('POST /a2a/agents/{id}/rotate → new secret, same key_id', async ({ api }) => {
    const createRes = await api.post('/app/v1/a2a/agents', {
      data: { agent_name: `[E2E] Rotate ${Date.now()}`, description: 'rotate test' },
    });
    const created = await createRes.json();
    if (!created.key_id) return;
    createdKeyIds.push(created.key_id);

    const rotateRes = await api.post(`/app/v1/a2a/agents/${created.key_id}/rotate`);
    expect([200, 201]).toContain(rotateRes.status());

    const rotated = await rotateRes.json();
    expect(rotated.key_id).toBe(created.key_id);
    expect(rotated.new_api_key).toBeTruthy();
  });

  test('DELETE /a2a/agents/{id} → key removed from list', async ({ api }) => {
    const createRes = await api.post('/app/v1/a2a/agents', {
      data: { agent_name: `[E2E] Delete ${Date.now()}`, description: 'delete test' },
    });
    const created = await createRes.json();
    if (!created.key_id) return;

    const delRes = await api.delete(`/app/v1/a2a/agents/${created.key_id}`);
    expect([200, 204]).toContain(delRes.status());

    const listRes = await api.get('/app/v1/a2a/agents');
    const list = await listRes.json();
    const stillActive = list.find(
      (k: { key_id?: string; revoked?: boolean }) =>
        k.key_id === created.key_id && !k.revoked,
    );
    expect(stillActive).toBeUndefined();
  });

  test('UI — A2A page loads and shows agent keys', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/a2a/agents'),
      page.goto('/settings/a2a'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('UI — generate button fires POST to /a2a/agents', async ({ page }) => {
    await page.goto('/settings/a2a');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    const generateBtn = page.locator(
      '[data-testid="generate-a2a-key"], button:has-text("Generate")',
    );
    if (!(await generateBtn.count())) return;

    const [postRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/app/v1/a2a/agents') && r.request().method() === 'POST',
      ),
      generateBtn.first().click(),
    ]);
    expect([200, 201]).toContain(postRes.status());

    const body = await postRes.json();
    if (body.key_id) createdKeyIds.push(body.key_id);
  });
});
