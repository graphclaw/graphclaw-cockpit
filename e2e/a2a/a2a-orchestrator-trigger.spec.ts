// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-A2A-W20-001 — Orchestrator outbound callback reaches external agent harness
 *
 * Scenario: Verifies future orchestrator-to-external A2A callback delivery using a
 * local harness service. This file is a pending scaffold and is intentionally skipped
 * until outbound trigger wiring is implemented.
 *
 * PRD: docs/prd/11-api-contract.md §11.19
 * Build wave: W20
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-18
 *
 * Cases covered:
 *  - Register external agent callback target in harness mode
 *  - Trigger outbound delegation from orchestrator context
 *  - Confirm harness receives callback with correlation metadata
 */

import { test, expect } from '../fixtures/test';

test.describe.skip('A2A — Orchestrator outbound trigger (pending)', () => {
  test('orchestrator sends callback to harness endpoint', async ({ page }) => {
    // Pending implementation notes:
    // 1. Seed an external agent with callback_url pointing to harness /callback
    // 2. Trigger orchestrator flow that delegates to external A2A agent
    // 3. Assert harness /events includes callback with expected correlation IDs
    await page.goto('/canvas');
    await expect(page.locator('main')).toBeVisible();
  });
});
