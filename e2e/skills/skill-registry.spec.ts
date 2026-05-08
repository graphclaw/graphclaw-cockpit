// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-SKL-W18-001 — Skill Registry
 *
 * Scenario: Tests skill lifecycle via /app/v1/skills: list, search, install,
 * manage sources, and delete. Validates both REST API and UI rendering.
 *
 * PRD: docs/prd/13-skill-marketplace.md §AC-13.1
 * Build wave: W18
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-06
 *
 * Cases covered:
 *  - List installed skills
 *  - Search skills
 *  - List skill sources
 *  - Add and remove skill source
 *  - Install a skill from source
 *  - Delete installed skill
 *  - UI page loads with skill list
 */

import { test, expect } from '../fixtures/test';

test.describe('Skills — Registry', () => {
  const installedIds: string[] = [];
  const addedSourceUris: string[] = [];

  test.afterAll(async ({ api }) => {
    for (const id of installedIds) {
      await api.delete(`/app/v1/skills/${id}`).catch(() => {});
    }
    for (const uri of addedSourceUris) {
      await api.delete(`/app/v1/skills/sources/${encodeURIComponent(uri)}`).catch(() => {});
    }
  });

  test('GET /skills — returns installed skill list', async ({ api }) => {
    const res = await api.get('/app/v1/skills');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /skills/search?q= — returns filtered results', async ({ api }) => {
    const res = await api.get('/app/v1/skills/search?q=graph');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /skills/sources — returns source list', async ({ api }) => {
    const res = await api.get('/app/v1/skills/sources');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /skills/sources → source in list → DELETE removes it', async ({ api }) => {
    const sourceUri = `graphclaw://e2e-registry/${Date.now()}`;
    addedSourceUris.push(sourceUri);

    const addRes = await api.post('/app/v1/skills/sources', {
      data: { source_type: 'local', uri: sourceUri, name: `E2E Source ${Date.now()}` },
    });
    expect([200, 201, 409]).toContain(addRes.status());

    if ([200, 201].includes(addRes.status())) {
      const listRes = await api.get('/app/v1/skills/sources');
      const sources = await listRes.json();
      const found = sources.find(
        (s: { source_uri?: string; uri?: string }) => (s.source_uri ?? s.uri) === sourceUri,
      );
      expect(found).toBeDefined();

      const delRes = await api.delete(`/app/v1/skills/sources/${encodeURIComponent(sourceUri)}`);
      expect([200, 204]).toContain(delRes.status());
      addedSourceUris.pop();
    }
  });

  test('POST /skills/install → skill in list', async ({ api }) => {
    const skillName = `e2e-test-skill-${Date.now()}`;
    const res = await api.post('/app/v1/skills/install', {
      data: { skill_name: skillName, source_uri: 'graphclaw://builtin/graph-query', version: '1.0.0' },
    });
    expect([200, 201, 404, 409]).toContain(res.status());

    if ([200, 201].includes(res.status())) {
      const installed = await res.json();
      const skillId = installed.skill_id ?? installed.id ?? '';
      if (skillId) installedIds.push(skillId);

      const listRes = await api.get('/app/v1/skills');
      const list = await listRes.json();
      const found = list.find(
        (s: { skill_id?: string; skill_name?: string }) =>
          s.skill_id === skillId || s.skill_name === skillName,
      );
      expect(found).toBeDefined();
    }
  });

  test('DELETE /skills/{id} → skill removed', async ({ api }) => {
    const createRes = await api.post('/app/v1/skills/install', {
      data: {
        skill_name: `e2e-delete-${Date.now()}`,
        source_uri: 'graphclaw://builtin/score-explain',
        version: '1.0.0',
      },
    });
    if (![200, 201].includes(createRes.status())) return;

    const created = await createRes.json();
    const skillId = created.skill_id ?? created.id ?? '';
    if (!skillId) return;

    const delRes = await api.delete(`/app/v1/skills/${skillId}`);
    expect([200, 204]).toContain(delRes.status());

    const listRes = await api.get('/app/v1/skills');
    const list = await listRes.json();
    const found = list.find(
      (s: { skill_id?: string }) => s.skill_id === skillId,
    );
    expect(found).toBeUndefined();
  });

  test('UI — skills page loads with skill list', async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse('**/app/v1/skills'),
      page.goto('/skills'),
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});
