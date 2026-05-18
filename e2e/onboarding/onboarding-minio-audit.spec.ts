// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-OB-W11-012 — MinIO profile.md audit for onboarding state
 *
 * Scenario: Backend-focused validation that the profile.md object is created
 *   with the correct frontmatter when a user is provisioned, and that the
 *   set_user_name and complete_onboarding onboarding tools update the graph
 *   store and profile.md correctly.
 *
 * PRD: docs/prd/00-index.md §onboarding, docs/prd/14-config-and-secrets.md
 * Build wave: W11
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-17
 *
 * Cases covered:
 *  - GC-E-OB-W11-012  Test user profile.md exists with expected frontmatter
 *  - GC-E-OB-W11-013  PATCH profile name → UserNode.name updated in graph
 *  - GC-E-OB-W11-014  PATCH profile agent_name → profile.md frontmatter updated
 */

import { test, expect, TEST_USER_ID } from '../fixtures/test.js';
import { StoragePaths } from '../helpers/minio.js';

/** Parse YAML frontmatter from profile.md content. */
function parseFrontmatter(raw: string): Record<string, unknown> {
  if (!raw.startsWith('---')) return {};
  const end = raw.indexOf('---', 3);
  if (end === -1) return {};
  const block = raw.slice(3, end).trim();
  const result: Record<string, unknown> = {};
  for (const line of block.split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (val === 'true') result[key] = true;
    else if (val === 'false') result[key] = false;
    else result[key] = val.replace(/^["']|["']$/g, '');
  }
  return result;
}

// GC-E-OB-W11-012
test('test user profile.md exists with correct frontmatter', async ({ minio }) => {
  const profileKey = StoragePaths.agentProfile(TEST_USER_ID);
  const exists = await minio.objectExists(profileKey);
  expect(exists).toBe(true);

  const raw = await minio.readObject(profileKey);
  expect(raw.length).toBeGreaterThan(0);
  // Must start with YAML frontmatter
  expect(raw.startsWith('---')).toBe(true);

  const fm = parseFrontmatter(raw);
  // onboarding_complete must be present (either true or false)
  expect('onboarding_complete' in fm).toBe(true);
  // onboarding_state must be a valid FSM state
  const validStates = ['WELCOME', 'PERSONA', 'CHANNELS', 'WORKING_HOURS', 'PREFERENCES', 'POLICIES', 'DONE'];
  if (fm.onboarding_state) {
    expect(validStates).toContain(String(fm.onboarding_state));
  }
});

// GC-E-OB-W11-013
test('PATCH profile name → UserNode.name updated in graph DB', async ({ api, db }) => {
  const newName = `TestUser-${Date.now()}`;

  const res = await api.patch('/app/v1/settings/profile', {
    data: { name: newName },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok()).toBe(true);
  const body = await res.json() as { name: string };
  expect(body.name).toBe(newName);

  // Validate in graph DB
  const nameInGraph = await db.getNodeProperty(TEST_USER_ID, 'name');
  expect(nameInGraph).toBe(newName);
});

// GC-E-OB-W11-014
test('PATCH profile agent_name → profile.md frontmatter updated in MinIO', async ({ api, minio }) => {
  const agentName = `TestAgent-${Date.now()}`;

  const res = await api.patch('/app/v1/settings/profile', {
    data: { agent_name: agentName },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok()).toBe(true);
  const body = await res.json() as { agent_name: string };
  expect(body.agent_name).toBe(agentName);

  // Validate in MinIO
  const profileKey = StoragePaths.agentProfile(TEST_USER_ID);
  const raw = await minio.readObject(profileKey);
  const fm = parseFrontmatter(raw);
  expect(fm.agent_name).toBe(agentName);

  // Cleanup
  await api.patch('/app/v1/settings/profile', {
    data: { agent_name: '' },
    headers: { 'Content-Type': 'application/json' },
  });
});
