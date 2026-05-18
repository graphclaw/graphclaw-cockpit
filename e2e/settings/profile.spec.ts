// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-PRF-W11-001 — User profile settings: read, update, and agent name persistence
 *
 * Scenario: The Settings profile page (or profile API) reflects the user's
 *   current name and agent_name. Updates via PATCH /settings/profile are
 *   immediately reflected in the profile response and in the chat header.
 *   Agent name persists across browser reloads.
 *
 * PRD: docs/prd/05-settings-panel.md
 * Build wave: W11
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-17
 *
 * Cases covered:
 *  - GC-E-PRF-W11-001  GET /settings/profile returns user fields + agent_name
 *  - GC-E-PRF-W11-002  Update agent_name → chat header updates on next load
 *  - GC-E-PRF-W11-003  Agent name persists after browser reload
 */

import { test, expect } from '../fixtures/test.js';

// GC-E-PRF-W11-001
test('GET /settings/profile returns required fields including agent_name', async ({ api }) => {
  const res = await api.get('/app/v1/settings/profile');
  expect(res.ok()).toBe(true);
  const body = await res.json() as Record<string, unknown>;

  expect(body).toHaveProperty('user_id');
  expect(body).toHaveProperty('name');
  expect(body).toHaveProperty('email');
  expect(body).toHaveProperty('timezone');
  expect(body).toHaveProperty('agent_name');

  // agent_name is a string (may be empty for a newly provisioned user)
  expect(typeof body.agent_name).toBe('string');
});

// GC-E-PRF-W11-002
test('update agent_name via PATCH → chat header shows new name', async ({ page, api }) => {
  const newName = `E2E-Agent-${Date.now()}`;

  // Update via API
  const patchRes = await api.patch('/app/v1/settings/profile', {
    data: { agent_name: newName },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(patchRes.ok()).toBe(true);
  const patched = await patchRes.json() as { agent_name: string };
  expect(patched.agent_name).toBe(newName);

  // Navigate to chat (TanStack Query refetches profile on mount)
  await page.goto('/chat');
  await page.waitForLoadState('networkidle');

  await expect(page.getByTestId('agent-name-header')).toHaveText(newName, { timeout: 10_000 });

  // Cleanup
  await api.patch('/app/v1/settings/profile', {
    data: { agent_name: '' },
    headers: { 'Content-Type': 'application/json' },
  });
});

// GC-E-PRF-W11-003
test('agent_name persists across browser reload', async ({ page, api }) => {
  const persistName = `Persist-${Date.now()}`;

  await api.patch('/app/v1/settings/profile', {
    data: { agent_name: persistName },
    headers: { 'Content-Type': 'application/json' },
  });

  await page.goto('/chat');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('agent-name-header')).toHaveText(persistName, { timeout: 10_000 });

  // Reload
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Must still show the same name
  await expect(page.getByTestId('agent-name-header')).toHaveText(persistName, { timeout: 10_000 });

  // Cleanup
  await api.patch('/app/v1/settings/profile', {
    data: { agent_name: '' },
    headers: { 'Content-Type': 'application/json' },
  });
});
