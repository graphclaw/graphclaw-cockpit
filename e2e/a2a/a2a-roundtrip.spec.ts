// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-A2A-W20-002 — External callback plus inbound task-update roundtrip
 *
 * Scenario: Verifies full future A2A loop where the orchestrator triggers an
 * external agent and that agent sends a status update back into
 * /api/v1/task-update. This is a pending scaffold and is skipped until canonical
 * A2A trigger/update flow is fully wired.
 *
 * PRD: docs/prd/11-api-contract.md §11.19
 * Build wave: W20
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-18
 *
 * Cases covered:
 *  - Receive outbound callback in external harness
 *  - Replay inbound JSON-RPC task update through /api/v1/task-update
 *  - Verify task lifecycle/audit side effects through API checks
 */

import { test, expect } from '../fixtures/test';

test.describe.skip('A2A — External roundtrip (pending)', () => {
  test('external harness callback is replayed as inbound update', async ({ page }) => {
    // Pending implementation notes:
    // 1. Trigger outbound callback and capture event via harness /events
    // 2. POST captured status payload to harness /replay/task-update
    // 3. Validate state transition and audit trail via backend API
    await page.goto('/tasks');
    await expect(page.locator('main')).toBeVisible();
  });
});
