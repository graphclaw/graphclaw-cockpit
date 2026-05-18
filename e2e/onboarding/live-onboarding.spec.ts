// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-OB-W11-001 — Onboarding banner E2E (dev-token auth)
 *
 * Scenario: The test user's profile.md is seeded with onboarding_complete:false
 *   before each test run. The app is loaded via dev-token auth (no real OAuth).
 *   Tests verify that the OnboardingBanner appears correctly, advances through
 *   steps, and disappears once onboarding_complete:true is set.
 *
 * PRD: docs/prd/00-index.md §onboarding, docs/prd/05-settings-panel.md §5.1
 * Build wave: W11
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-18
 *
 * Cases covered:
 *  - GC-E-OB-W11-001  Onboarding state seeded → OnboardingBanner visible at step 1/6
 *  - GC-E-OB-W11-002  Banner shows progress bar and WELCOME step pill highlighted
 *  - GC-E-OB-W11-003  Mid-onboarding state (PERSONA) → banner shows step 2/6
 *  - GC-E-OB-W11-004  onboarding_complete:true in profile.md → banner absent
 *  - GC-E-OB-W11-005  Reload with onboarding_needed state → banner re-appears
 *  - GC-E-OB-W11-006  No profile.md (existing user migration) → banner absent
 */

import { test, expect, TEST_USER_ID } from '../fixtures/auth.fixture.js';
import { MinioClient, StoragePaths } from '../helpers/minio.js';

const PROFILE_KEY = StoragePaths.agentProfile(TEST_USER_ID);

const ONBOARDING_PROFILE_WELCOME = [
  '---',
  'onboarding_complete: false',
  'onboarding_state: WELCOME',
  '---',
  '',
].join('\n');

const ONBOARDING_PROFILE_PERSONA = [
  '---',
  'onboarding_complete: false',
  'onboarding_state: PERSONA',
  '---',
  '',
].join('\n');

const ONBOARDING_PROFILE_COMPLETE = [
  '---',
  'onboarding_complete: true',
  'onboarding_state: DONE',
  '---',
  '',
].join('\n');

test.describe('OnboardingBanner E2E', () => {
  const minio = new MinioClient();

  test.afterEach(async () => {
    // Restore to fully-onboarded state so downstream tests see a clean user
    await minio.writeObject(PROFILE_KEY, ONBOARDING_PROFILE_COMPLETE, 'text/markdown').catch(() => {/* ignore */});
  });

  // GC-E-OB-W11-001
  test('onboarding state seeded → OnboardingBanner visible at step 1/6', async ({ page }) => {
    await minio.writeObject(PROFILE_KEY, ONBOARDING_PROFILE_WELCOME, 'text/markdown');

    await page.goto('/chat');

    await expect(page.getByTestId('onboarding-banner')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="onboarding-banner"]')).toContainText('Step 1');
    await expect(page.locator('[data-testid="onboarding-banner"]')).toContainText('of 6');
  });

  // GC-E-OB-W11-002
  test('banner shows progress bar and WELCOME step pill highlighted', async ({ page }) => {
    await minio.writeObject(PROFILE_KEY, ONBOARDING_PROFILE_WELCOME, 'text/markdown');

    await page.goto('/chat');

    await expect(page.getByTestId('onboarding-banner')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('onboarding-progress')).toBeVisible();
    await expect(page.getByTestId('onboarding-step-welcome')).toBeVisible();
  });

  // GC-E-OB-W11-003
  test('mid-onboarding PERSONA state → banner shows step 2/6', async ({ page }) => {
    await minio.writeObject(PROFILE_KEY, ONBOARDING_PROFILE_PERSONA, 'text/markdown');

    await page.goto('/chat');

    await expect(page.getByTestId('onboarding-banner')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="onboarding-banner"]')).toContainText('Step 2');
    await expect(page.getByTestId('onboarding-step-persona')).toBeVisible();
  });

  // GC-E-OB-W11-004
  test('onboarding_complete:true in profile.md → banner absent', async ({ page }) => {
    await minio.writeObject(PROFILE_KEY, ONBOARDING_PROFILE_COMPLETE, 'text/markdown');

    await page.goto('/chat');

    // Give time for SSE to fire and React to render
    await page.waitForTimeout(3_000);
    await expect(page.getByTestId('onboarding-banner')).not.toBeVisible();
  });

  // GC-E-OB-W11-005
  test('reload with onboarding state → banner persists after reload', async ({ page }) => {
    await minio.writeObject(PROFILE_KEY, ONBOARDING_PROFILE_WELCOME, 'text/markdown');

    await page.goto('/chat');
    await expect(page.getByTestId('onboarding-banner')).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page.getByTestId('onboarding-banner')).toBeVisible({ timeout: 15_000 });
  });

  // GC-E-OB-W11-006
  test('no profile.md (existing user migration) → banner absent', async ({ page }) => {
    // Ensure profile.md is absent (afterEach will have removed it; this just confirms)
    await minio.deleteObject(PROFILE_KEY).catch(() => {/* already absent */});

    await page.goto('/chat');

    await page.waitForTimeout(3_000);
    await expect(page.getByTestId('onboarding-banner')).not.toBeVisible();
  });
});
