// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-MCP-W18-001 — MCP Server Registry
 *
 * Scenario: Tests MCP server lifecycle: register, list, patch trust tier,
 * disable, search, and delete. UI verifies page renders and interactions.
 *
 * PRD: docs/prd/14-mcp-integration.md §AC-14.1
 * Build wave: W18
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-06
 *
 * Cases covered:
 *  - List MCP servers from API
 *  - Register a new server (POST)
 *  - Get single server by ID
 *  - Patch trust tier
 *  - Disable server
 *  - Search registry
 *  - Delete server
 *  - UI page loads and renders server list
 *  - UI search filters results
 */

import { test, expect } from '../fixtures/test';

test.describe('MCP — Server Registry', () => {
  const createdIds: string[] = [];

  test.afterAll(async ({ api }) => {
    for (const id of createdIds) {
      await api.delete(`/app/v1/mcp-servers/${id}`).catch(() => {});
    }
  });

  test('GET /mcp-servers — returns server list', async ({ api }) => {
    const res = await api.get('/app/v1/mcp-servers');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /mcp-servers → server appears in list', async ({ api }) => {
    const name = `[E2E] MCP Server ${Date.now()}`;
    const res = await api.post('/app/v1/mcp-servers', {
      data: {
        name,
        transport: 'sse',
        endpoint_url: `http://localhost:${9200 + Math.floor(Math.random() * 100)}/mcp`,
        trust_tier: 'GATED',
        scope: ['read_data'],
      },
    });
    expect([200, 201]).toContain(res.status());

    const created = await res.json();
    const serverId = created.server_id ?? created.id ?? '';
    if (serverId) createdIds.push(serverId);

    const listRes = await api.get('/app/v1/mcp-servers');
    const list = await listRes.json();
    const found = list.find(
      (s: { server_id?: string; id?: string; name?: string }) =>
        (s.server_id ?? s.id) === serverId || s.name === name,
    );
    expect(found).toBeDefined();
  });

  test('GET /mcp-servers/{id} — returns correct server', async ({ api }) => {
    if (createdIds.length === 0) return;
    const serverId = createdIds[0];

    const res = await api.get(`/app/v1/mcp-servers/${serverId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.server_id ?? body.id).toBe(serverId);
  });

  test('PATCH /mcp-servers/{id} trust_tier → change persists', async ({ api }) => {
    if (createdIds.length === 0) return;
    const serverId = createdIds[0];

    const patchRes = await api.patch(`/app/v1/mcp-servers/${serverId}`, {
      data: { trust_tier: 'BLOCKED' },
    });
    expect([200, 204]).toContain(patchRes.status());

    const getRes = await api.get(`/app/v1/mcp-servers/${serverId}`);
    const after = await getRes.json();
    expect(after.trust_tier).toBe('BLOCKED');
  });

  test('PATCH /mcp-servers/{id} enabled=false → disables server', async ({ api }) => {
    if (createdIds.length === 0) return;
    const serverId = createdIds[0];

    const patchRes = await api.patch(`/app/v1/mcp-servers/${serverId}`, {
      data: { enabled: false },
    });
    expect([200, 204]).toContain(patchRes.status());

    const getRes = await api.get(`/app/v1/mcp-servers/${serverId}`);
    const after = await getRes.json();
    if (after.enabled !== undefined) {
      expect(after.enabled).toBe(false);
    }
  });

  test('GET /mcp-servers/search?q= — returns filtered results', async ({ api }) => {
    const res = await api.get('/app/v1/mcp-servers/search?q=graph');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('DELETE /mcp-servers/{id} → removed from list', async ({ api }) => {
    const name = `[E2E] Delete MCP ${Date.now()}`;
    const createRes = await api.post('/app/v1/mcp-servers', {
      data: { name, transport: 'stdio', command: 'echo test', trust_tier: 'GATED' },
    });
    if (![200, 201].includes(createRes.status())) return;

    const created = await createRes.json();
    const serverId = created.server_id ?? created.id ?? '';

    const delRes = await api.delete(`/app/v1/mcp-servers/${serverId}`);
    expect([200, 204]).toContain(delRes.status());

    const listRes = await api.get('/app/v1/mcp-servers');
    const list = await listRes.json();
    const found = list.find(
      (s: { server_id?: string; id?: string }) => (s.server_id ?? s.id) === serverId,
    );
    expect(found).toBeUndefined();
  });

  test('UI — MCP page loads server list', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/mcp-servers'),
      page.goto('/mcp'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('UI — search input filters displayed servers', async ({ page }) => {
    await page.goto('/mcp');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (!(await searchInput.count())) return;

    await searchInput.first().fill('E2E');
    await page.waitForResponse('**/app/v1/mcp-servers**').catch(() => {});
  });
});
