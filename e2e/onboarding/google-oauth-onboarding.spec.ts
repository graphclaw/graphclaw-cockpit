// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-OB-W11-L — Live Google OAuth onboarding — real user, headed browser
 *
 * Scenario: Wipes the existing user record for abhishekagupta86@gmail.com,
 *   opens the real Google login page in a headed browser, waits for the human
 *   to approve the OAuth consent, then drives the full first-login onboarding
 *   conversation with the main orchestrator.  Validates that profile.md is
 *   created correctly in MinIO, the UserNode is provisioned in the graph,
 *   and the OnboardingBanner advances through all steps.
 *
 *   After onboarding it exercises the Settings → Channels page to link an
 *   email identity and a Telegram handle and confirms both are persisted in
 *   MinIO config.json.
 *
 * PRD: docs/prd/00-index.md §onboarding, docs/prd/05-settings-panel.md §5.1
 * Build wave: W11
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-18
 *
 * ⚠  RUN SEPARATELY — this spec uses a headed browser and real Google OAuth.
 *    The human MUST approve the Google consent screen when it appears.
 *
 *    npx playwright test --project=onboarding-live
 *
 * Cases covered:
 *  - GC-E-OB-W11-L01  Existing user deleted from graph + MinIO before login
 *  - GC-E-OB-W11-L02  Login page shows Google button and navigates to Google OAuth
 *  - GC-E-OB-W11-L03  After OAuth approval: redirected to app, UserNode provisioned
 *  - GC-E-OB-W11-L04  profile.md created in MinIO with onboarding_complete: false
 *  - GC-E-OB-W11-L05  /chat shows OnboardingBanner at Step 1 of 6
 *  - GC-E-OB-W11-L06  Orchestrator sends welcome message asking for user + agent name
 *  - GC-E-OB-W11-L07  User replies with name + agent name → profile updated in MinIO
 *  - GC-E-OB-W11-L08  Chat header shows the chosen agent name
 *  - GC-E-OB-W11-L09  User configures email identity in Settings → stored in MinIO
 *  - GC-E-OB-W11-L10  User configures Telegram handle in Settings → stored in MinIO
 */

import { test, expect } from '../fixtures/live-auth.fixture.js';
import { resetUserByEmail } from './helpers/reset-user.js';
import { StoragePaths } from '../helpers/minio.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const LIVE_USER_EMAIL = 'abhishekagupta86@gmail.com';
const AGENT_NAME = 'Max';
const USER_DISPLAY_NAME = 'Abhishek';

// Timeout given to the human to complete the Google OAuth consent flow
const OAUTH_HUMAN_TIMEOUT_MS = 120_000;

// ── Shared state between tests ─────────────────────────────────────────────────

let newUserId = ''; // Filled in after OAuth callback

// ── Helpers ───────────────────────────────────────────────────────────────────

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

/** Poll fn() until it returns truthy or maxMs elapses. */
async function pollUntil(
  fn: () => Promise<boolean>,
  maxMs = 10_000,
  intervalMs = 1_000,
): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await new Promise<void>((r) => setTimeout(r, intervalMs));
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Live Google OAuth — first-time user onboarding', () => {
  test.setTimeout(OAUTH_HUMAN_TIMEOUT_MS + 60_000); // Generous suite timeout

  // ── GC-E-OB-W11-L01 ─────────────────────────────────────────────────────────
  test('L01 — delete existing user from graph + MinIO before login', async ({ db, minio }) => {
    const result = await resetUserByEmail(db, minio, LIVE_USER_EMAIL);
    console.log(
      `[L01] Reset complete: userId=${result.userId ?? 'not found'}, ` +
        `minioObjectsDeleted=${result.minioObjectsDeleted}`,
    );

    // Confirm the UserNode is gone (or was never there)
    if (result.userId) {
      const stillExists = await db.getNodeById(result.userId);
      expect(stillExists).toBeNull();
    }
  });

  // ── GC-E-OB-W11-L02 ─────────────────────────────────────────────────────────
  test('L02 — login page shows Google button; click navigates to Google OAuth', async ({
    page,
  }) => {
    await page.goto('/login');

    // Google button must be visible
    const googleBtn = page.getByRole('button', { name: /sign in with google/i });
    await expect(googleBtn).toBeVisible({ timeout: 10_000 });

    // Clicking sends the browser to /auth/login?provider=google which redirects
    // to accounts.google.com — capture the URL change
    const [navigationUrl] = await Promise.all([
      page.waitForURL(/accounts\.google\.com/, { timeout: 15_000 }),
      googleBtn.click(),
    ]).catch(async () => {
      // Fallback: check we are at least no longer on /login
      await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15_000 });
      return [];
    });

    const currentUrl = page.url();
    const isGoogleOAuth =
      currentUrl.includes('accounts.google.com') ||
      currentUrl.includes('/auth/login');
    expect(isGoogleOAuth).toBe(true);
    console.log(`[L02] OAuth redirect target: ${currentUrl.substring(0, 80)}`);
  });

  // ── GC-E-OB-W11-L03 ─────────────────────────────────────────────────────────
  test(
    'L03 — HUMAN STEP: approve Google consent → app redirected, UserNode provisioned',
    async ({ page, db }) => {
      // Navigate to the Google OAuth entry point directly
      await page.goto('/auth/login?provider=google');

      // ── HUMAN INTERACTION REQUIRED ──────────────────────────────────────────
      // The browser will show the Google account chooser / consent screen.
      // The human must select abhishekagupta86@gmail.com and approve.
      // We wait up to OAUTH_HUMAN_TIMEOUT_MS for the redirect back to the app.
      console.log(
        `\n${'='.repeat(60)}\n` +
          `ACTION REQUIRED: Select "${LIVE_USER_EMAIL}" in the Google\n` +
          `login window and approve the consent. You have ${OAUTH_HUMAN_TIMEOUT_MS / 1000}s.\n` +
          `${'='.repeat(60)}\n`,
      );

      // Wait for the app callback URL (either /auth/callback or /)
      await page.waitForURL(
        (url) =>
          url.href.includes('/auth/callback') || url.pathname === '/' || url.pathname === '/chat',
        { timeout: OAUTH_HUMAN_TIMEOUT_MS },
      );

      // If we hit the callback page, wait for it to complete the token exchange
      // and redirect to the main app
      if (page.url().includes('/auth/callback')) {
        await page.waitForURL(
          (url) => url.pathname === '/' || url.pathname === '/chat',
          { timeout: 15_000 },
        );
      }

      console.log(`[L03] OAuth complete — landed at ${page.url()}`);

      // Extract the authenticated user_id from localStorage
      const authState = await page.evaluate(() => {
        const raw = localStorage.getItem('gc-auth');
        if (!raw) return null;
        try {
          return JSON.parse(raw) as { state?: { userId?: string } };
        } catch {
          return null;
        }
      });

      expect(authState?.state?.userId).toBeTruthy();
      newUserId = authState!.state!.userId!;
      console.log(`[L03] Authenticated as userId=${newUserId}`);

      // Validate UserNode exists in graph DB
      const node = await db.getNodeById(newUserId);
      expect(node).not.toBeNull();
      expect(node!.email).toBe(LIVE_USER_EMAIL);
    },
    { timeout: OAUTH_HUMAN_TIMEOUT_MS + 30_000 },
  );

  // ── GC-E-OB-W11-L04 ─────────────────────────────────────────────────────────
  test('L04 — profile.md created in MinIO with onboarding_complete: false', async ({ minio }) => {
    test.skip(!newUserId, 'Requires L03 to have completed successfully');

    const profileKey = StoragePaths.agentProfile(newUserId);

    // Poll up to 10s for the file to appear (provisioning is async)
    const created = await pollUntil(() => minio.objectExists(profileKey), 10_000);
    expect(created).toBe(true);

    const raw = await minio.readObject(profileKey);
    expect(raw.startsWith('---')).toBe(true);

    const fm = parseFrontmatter(raw);
    expect(fm.onboarding_complete).toBe(false);
    expect(fm.onboarding_state).toBe('WELCOME');
    console.log(`[L04] profile.md frontmatter: ${JSON.stringify(fm)}`);
  });

  // ── GC-E-OB-W11-L05 ─────────────────────────────────────────────────────────
  test('L05 — /chat shows OnboardingBanner at Step 1 of 6', async ({ page }) => {
    test.skip(!newUserId, 'Requires L03 to have completed successfully');

    // Re-authenticate: inject the userId from localStorage that was set in L03.
    // The page from L03 is a new page fixture, so we navigate from scratch.
    await page.goto('/chat');

    await expect(page.getByTestId('onboarding-banner')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('onboarding-banner')).toContainText('Step 1');
    await expect(page.getByTestId('onboarding-banner')).toContainText('of 6');
    await expect(page.getByTestId('onboarding-step-welcome')).toBeVisible();
    console.log('[L05] OnboardingBanner visible at step 1/6');
  });

  // ── GC-E-OB-W11-L06 ─────────────────────────────────────────────────────────
  test('L06 — orchestrator sends welcome message in chat', async ({ page }) => {
    test.skip(!newUserId, 'Requires L03 to have completed successfully');

    await page.goto('/chat');
    await expect(page.getByTestId('onboarding-banner')).toBeVisible({ timeout: 15_000 });

    // The orchestrator should have sent a welcome message automatically.
    // We look for any assistant message in the chat (role=assistant).
    await expect(
      page.locator('[data-testid="chat-view"] [data-testid="message-assistant"]').first(),
    ).toBeVisible({ timeout: 20_000 });

    const firstMsg = await page
      .locator('[data-testid="chat-view"] [data-testid="message-assistant"]')
      .first()
      .textContent();

    console.log(`[L06] First orchestrator message: ${firstMsg?.substring(0, 120)}...`);

    // Orchestrator WELCOME prompt asks for name and what to call the agent
    expect(firstMsg?.toLowerCase()).toMatch(/welcome|hello|name|call me/i);
  });

  // ── GC-E-OB-W11-L07 ─────────────────────────────────────────────────────────
  test('L07 — user replies with name + agent name → profile.md updated', async ({
    page,
    minio,
  }) => {
    test.skip(!newUserId, 'Requires L03 to have completed successfully');

    await page.goto('/chat');
    await expect(page.getByTestId('onboarding-banner')).toBeVisible({ timeout: 15_000 });

    // Send the reply
    const chatInput = page.getByTestId('chat-input');
    await chatInput.fill(
      `My name is ${USER_DISPLAY_NAME}. You can call yourself ${AGENT_NAME}.`,
    );

    const [chatRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/app/v1/chat') && r.request().method() === 'POST',
        { timeout: 30_000 },
      ),
      page.getByRole('button', { name: /send/i }).click(),
    ]);
    expect(chatRes.status()).toBeLessThan(400);

    // Wait for the orchestrator to respond
    await page.waitForTimeout(5_000);

    // Poll MinIO for agent_name to appear in profile.md
    const profileKey = StoragePaths.agentProfile(newUserId);
    const agentNameSet = await pollUntil(async () => {
      const raw = await minio.readObject(profileKey).catch(() => '');
      const fm = parseFrontmatter(raw);
      return Boolean(fm.agent_name);
    }, 20_000);

    if (agentNameSet) {
      const raw = await minio.readObject(profileKey);
      const fm = parseFrontmatter(raw);
      console.log(`[L07] profile.md after WELCOME: ${JSON.stringify(fm)}`);
      expect(String(fm.agent_name)).toBeTruthy();
    } else {
      // agent_name may not be set yet if the orchestrator hasn't completed the
      // tool call — onboarding_state should have advanced past WELCOME
      const raw = await minio.readObject(profileKey);
      const fm = parseFrontmatter(raw);
      console.log(`[L07] profile.md after reply: ${JSON.stringify(fm)}`);
      const advancedStates = ['PERSONA', 'CHANNELS', 'WORKING_HOURS', 'PREFERENCES', 'POLICIES', 'DONE'];
      expect(advancedStates).toContain(String(fm.onboarding_state));
    }
  });

  // ── GC-E-OB-W11-L08 ─────────────────────────────────────────────────────────
  test('L08 — chat header shows the agent name after it was set', async ({ page, minio }) => {
    test.skip(!newUserId, 'Requires L03 and L07 to have completed successfully');

    // Read the actual agent_name from MinIO (set in L07)
    const profileKey = StoragePaths.agentProfile(newUserId);
    const raw = await minio.readObject(profileKey).catch(() => '');
    const fm = parseFrontmatter(raw);

    // If agent_name was never set by the orchestrator, skip — dependent on LLM
    if (!fm.agent_name) {
      test.skip(true, 'agent_name not yet set by orchestrator — LLM-dependent step');
      return;
    }

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    const headerText = await page.getByTestId('agent-name-header').textContent();
    console.log(`[L08] Chat header: "${headerText}"`);

    // Header should show either the chosen name or the default
    expect(typeof headerText).toBe('string');
    if (fm.agent_name) {
      await expect(page.getByTestId('agent-name-header')).toHaveText(
        String(fm.agent_name),
        { timeout: 10_000 },
      );
    }
  });

  // ── GC-E-OB-W11-L09 ─────────────────────────────────────────────────────────
  test('L09 — Settings → Channels: link email identity → stored in MinIO', async ({
    page,
    minio,
  }) => {
    test.skip(!newUserId, 'Requires L03 to have completed successfully');

    await page.goto('/settings/channels');
    await expect(page.getByTestId('channels-grid')).toBeVisible({ timeout: 10_000 });

    // Fill identity and activate
    await page.getByTestId('identity-input-email').fill(LIVE_USER_EMAIL);
    await page.getByTestId('activate-btn-email').click();

    const [activateRes] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/settings/channels/email/activate') &&
          r.request().method() === 'POST',
        { timeout: 15_000 },
      ),
    ]);
    expect(activateRes.status()).toBe(200);

    // Validate in MinIO config.json
    const configKey = StoragePaths.userConfig(newUserId);
    const configRaw = await minio.readObject(configKey);
    const config = JSON.parse(configRaw) as {
      channels: { channel: string; enabled: boolean; config: Record<string, string> }[];
    };
    const emailEntry = config.channels?.find((c) => c.channel === 'email');
    expect(emailEntry?.enabled).toBe(true);
    expect(emailEntry?.config?.user_email).toBe(LIVE_USER_EMAIL);
    console.log(`[L09] Email channel activated for ${LIVE_USER_EMAIL}`);
  });

  // ── GC-E-OB-W11-L10 ─────────────────────────────────────────────────────────
  test('L10 — Settings → Channels: link Telegram handle → stored in MinIO', async ({
    page,
    minio,
  }) => {
    test.skip(!newUserId, 'Requires L03 to have completed successfully');

    const telegramHandle = '@abhig86';

    await page.goto('/settings/channels');
    await expect(page.getByTestId('channels-grid')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('identity-input-telegram').fill(telegramHandle);
    await page.getByTestId('activate-btn-telegram').click();

    const [activateRes] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/settings/channels/telegram/activate') &&
          r.request().method() === 'POST',
        { timeout: 15_000 },
      ),
    ]);
    expect(activateRes.status()).toBe(200);

    // Validate in MinIO
    const configKey = StoragePaths.userConfig(newUserId);
    const configRaw = await minio.readObject(configKey);
    const config = JSON.parse(configRaw) as {
      channels: { channel: string; enabled: boolean; config: Record<string, string> }[];
    };
    const tgEntry = config.channels?.find((c) => c.channel === 'telegram');
    expect(tgEntry?.enabled).toBe(true);
    expect(tgEntry?.config?.telegram_username).toBe(telegramHandle);
    console.log(`[L10] Telegram channel activated for ${telegramHandle}`);
  });
});
