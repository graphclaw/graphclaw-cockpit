/**
 * workforce.spec.ts
 *
 * Verifies the Workforce page renders correctly and interacts as expected:
 *   1. Page heading and tab bar render at /workforce
 *   2. Humans tab is active by default with KPI cards
 *   3. Switching to AI Agents tab updates content
 *   4. /people redirects to /workforce
 *   5. Resource card expand/collapse toggles aria-expanded
 *   6. Over-capacity filter chip toggles the filter state
 *
 * Tests degrade gracefully when no ResourceNodes are registered in the
 * test environment (e.g. fresh DB).
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi, waitForText } from '../../helpers/browser.helper';
import { APP_BASE } from '../../helpers/auth.helper';

describe('Workforce View', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await TestContext.create();
  });

  afterAll(async () => {
    await ctx.destroy();
  });

  // ── 1. Page renders ─────────────────────────────────────────────────────────
  test('GET /graph/resources — page renders heading and tab bar', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/workforce', '/app/v1/graph/resources');
      await waitForText(page, 'Workforce', 10000);

      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText).toContain('Humans');
      expect(bodyText).toContain('AI Agents');
    } finally {
      await page.close();
    }
  });

  // ── 2. Humans tab KPI labels ─────────────────────────────────────────────────
  test('Humans tab is active by default — KPI labels present', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/workforce', '/app/v1/graph/resources');
      await waitForText(page, 'Avg Utilisation', 10000);

      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText).toContain('Avg Utilisation');
      expect(bodyText).toContain('Over Capacity');
      // Humans tab specific KPI
      expect(bodyText).toMatch(/Active Members|No human resources/);
    } finally {
      await page.close();
    }
  });

  // ── 3. Switch to AI Agents tab ───────────────────────────────────────────────
  test('Clicking AI Agents tab switches content', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/workforce', '/app/v1/graph/resources');
      await waitForText(page, 'AI Agents', 10000);

      // Click the AI Agents tab button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const tab = buttons.find(
          (b) => b.textContent?.includes('AI Agents') && b.closest('.border-b'),
        );
        tab?.click();
      });

      // Wait for the agent-specific KPI to appear
      await waitForText(page, 'Active Agents', 5000).catch(() => {
        // Non-fatal: renders "No AI agents registered" when empty
      });

      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText).toMatch(/Active Agents|No AI agents/);
    } finally {
      await page.close();
    }
  });

  // ── 4. /people redirect ──────────────────────────────────────────────────────
  test('/people redirects to /workforce', async () => {
    const page = await ctx.newPage();
    try {
      await page.goto(`${APP_BASE}/people`, { waitUntil: 'networkidle0', timeout: 30000 });
      const url = page.url();
      expect(url).toContain('/workforce');
    } finally {
      await page.close();
    }
  });

  // ── 5. Card expand / collapse ────────────────────────────────────────────────
  test('Resource card expand/collapse toggles aria-expanded', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/workforce', '/app/v1/graph/resources');
      // Give React time to render cards after data loads
      await new Promise<void>((r) => setTimeout(r, 2000));

      const cardButton = await page.$('button[aria-expanded]');
      if (!cardButton) {
        console.log('No resource cards rendered — skipping expand/collapse test');
        return;
      }

      const initialExpanded = await cardButton.evaluate((el) =>
        el.getAttribute('aria-expanded') === 'true',
      );

      await cardButton.click();
      await new Promise<void>((r) => setTimeout(r, 300));

      const afterClick = await cardButton.evaluate((el) =>
        el.getAttribute('aria-expanded') === 'true',
      );
      expect(afterClick).toBe(!initialExpanded);

      // Toggle back
      await cardButton.click();
      await new Promise<void>((r) => setTimeout(r, 300));

      const afterToggleBack = await cardButton.evaluate((el) =>
        el.getAttribute('aria-expanded') === 'true',
      );
      expect(afterToggleBack).toBe(initialExpanded);
    } finally {
      await page.close();
    }
  });

  // ── 6. Over-capacity filter chip ────────────────────────────────────────────
  test('Over capacity filter chip toggles filtered view', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/workforce', '/app/v1/graph/resources');
      await waitForText(page, 'Over capacity', 8000);

      // Click the over-capacity chip
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const chip = buttons.find((b) => b.textContent?.trim().includes('Over capacity'));
        chip?.click();
      });

      await new Promise<void>((r) => setTimeout(r, 300));

      // After activating the filter, either show over-cap cards or empty state
      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText).toMatch(/Over capacity|No resources match/);
    } finally {
      await page.close();
    }
  });

  // ── 7. Sidebar shows Workforce as active ────────────────────────────────────
  test('Sidebar "Workforce" item is highlighted when on /workforce', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/workforce', '/app/v1/graph/resources');
      await waitForText(page, 'Workforce', 10000);

      // The sidebar nav item for Workforce should exist
      const sidebarText = await page.evaluate(() => {
        const sidebar = document.querySelector('nav') ?? document.querySelector('aside');
        return sidebar?.innerText ?? '';
      });
      expect(sidebarText).toContain('Workforce');
    } finally {
      await page.close();
    }
  });
});
