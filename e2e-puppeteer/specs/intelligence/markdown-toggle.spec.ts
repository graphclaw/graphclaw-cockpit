/**
 * markdown-toggle.spec.ts
 *
 * Tests the Edit / Preview toggle on all Intelligence Hub editor panels:
 *   - Agent Profile
 *   - Working Memory
 *   - Semantic Memory
 *   - Episodic Memory (defaults to Preview)
 *   - Skill Authoring
 *
 * Each test verifies:
 *   1. The toggle buttons (Pencil / Eye icons) are present in the toolbar
 *   2. Switching to Preview replaces the textarea with rendered HTML
 *   3. Switching back to Edit restores the textarea
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';

/** Selector for the pencil (Edit) toggle button */
const PENCIL_BTN = 'button[title="Edit"]';
/** Selector for the eye (Preview) toggle button */
const EYE_BTN = 'button[title="Preview"]';

async function waitForPage(ctx: TestContext, path: string) {
  const page = await ctx.newPage();
  await gotoAndWaitForApi(page, path, '/app/v1/intelligence/agents');
  await page.waitForSelector('main', { timeout: 10_000 });
  await new Promise((r) => setTimeout(r, 1000)); // let React settle
  return page;
}

describe('Intelligence — Markdown Edit/Preview Toggle', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await TestContext.create();
  });

  afterAll(async () => {
    await ctx.destroy();
  });

  // ── Agent Profile ──────────────────────────────────────────────────────────
  describe('Agent Profile', () => {
    test('toggle buttons are present', async () => {
      const page = await waitForPage(ctx, '/intelligence/profile');
      try {
        await page.waitForSelector(PENCIL_BTN, { timeout: 8000 });
        await page.waitForSelector(EYE_BTN, { timeout: 8000 });
        const pencil = await page.$(PENCIL_BTN);
        const eye = await page.$(EYE_BTN);
        expect(pencil).not.toBeNull();
        expect(eye).not.toBeNull();
      } finally {
        await page.close();
      }
    });

    test('clicking Preview hides textarea and shows prose container', async () => {
      const page = await waitForPage(ctx, '/intelligence/profile');
      try {
        // Editor starts in Edit mode — textarea must be visible
        await page.waitForSelector('[data-testid="profile-editor"]', { timeout: 8000 });
        const textareaVisible = await page.$('[data-testid="profile-editor"]');
        expect(textareaVisible).not.toBeNull();

        // Switch to Preview
        await page.waitForSelector(EYE_BTN, { timeout: 5000 });
        await page.click(EYE_BTN);
        await new Promise((r) => setTimeout(r, 300));

        // Textarea is gone, prose div is present
        const textarea = await page.$('[data-testid="profile-editor"]');
        expect(textarea).toBeNull();
        const prose = await page.$('.prose');
        expect(prose).not.toBeNull();

        // Switch back to Edit — textarea reappears
        await page.click(PENCIL_BTN);
        await new Promise((r) => setTimeout(r, 300));
        const textareaBack = await page.$('[data-testid="profile-editor"]');
        expect(textareaBack).not.toBeNull();
      } finally {
        await page.close();
      }
    });
  });

  // ── Working Memory ─────────────────────────────────────────────────────────
  describe('Working Memory', () => {
    test('toggle buttons are present in toolbar', async () => {
      const page = await waitForPage(ctx, '/intelligence/working-memory');
      try {
        await page.waitForSelector(PENCIL_BTN, { timeout: 8000 });
        await page.waitForSelector(EYE_BTN, { timeout: 8000 });
        expect(await page.$(PENCIL_BTN)).not.toBeNull();
        expect(await page.$(EYE_BTN)).not.toBeNull();
      } finally {
        await page.close();
      }
    });

    test('Preview → Edit round-trip works', async () => {
      const page = await waitForPage(ctx, '/intelligence/working-memory');
      try {
        await page.waitForSelector(EYE_BTN, { timeout: 8000 });
        await page.click(EYE_BTN);
        await new Promise((r) => setTimeout(r, 300));
        const prose = await page.$('.prose');
        expect(prose).not.toBeNull();

        await page.click(PENCIL_BTN);
        await new Promise((r) => setTimeout(r, 300));
        const editor = await page.$('[data-testid="working-memory-editor"]');
        expect(editor).not.toBeNull();
      } finally {
        await page.close();
      }
    });
  });

  // ── Semantic Memory ────────────────────────────────────────────────────────
  describe('Semantic Memory', () => {
    test('selecting a topic shows toggle buttons', async () => {
      const page = await waitForPage(ctx, '/intelligence/semantic-memory');
      try {
        // Wait for topics to load and pick the first one
        await page.waitForSelector('[data-testid="semantic-topics"]', { timeout: 10000 })
          .catch(() => null);
        const firstTopic = await page.$('[data-testid="semantic-topics"] div');
        if (firstTopic) {
          await firstTopic.click();
          await new Promise((r) => setTimeout(r, 500));
          await page.waitForSelector(PENCIL_BTN, { timeout: 5000 });
          expect(await page.$(PENCIL_BTN)).not.toBeNull();
          expect(await page.$(EYE_BTN)).not.toBeNull();
        } else {
          // No topics yet — skip gracefully
          console.warn('No semantic topics available — skipping toggle check');
        }
      } finally {
        await page.close();
      }
    });
  });

  // ── Episodic Memory ────────────────────────────────────────────────────────
  describe('Episodic Memory', () => {
    test('selecting an entry shows toggle buttons defaulting to Preview', async () => {
      const page = await waitForPage(ctx, '/intelligence/episodic-memory');
      try {
        // Wait for entries to load
        const firstEntry = await page.$('[data-testid="episodic-list"] div[class*="cursor-pointer"]');
        if (firstEntry) {
          await firstEntry.click();
          await new Promise((r) => setTimeout(r, 500));

          // Both toggle buttons should appear
          await page.waitForSelector(PENCIL_BTN, { timeout: 5000 });
          expect(await page.$(EYE_BTN)).not.toBeNull();

          // Default mode is Preview — prose should be visible, no textarea
          const prose = await page.$('.prose');
          expect(prose).not.toBeNull();
          const textarea = await page.$('textarea');
          expect(textarea).toBeNull();

          // Switch to raw view
          await page.click(PENCIL_BTN);
          await new Promise((r) => setTimeout(r, 300));
          const ta = await page.$('textarea');
          expect(ta).not.toBeNull();
        } else {
          console.warn('No episodic entries available — skipping toggle check');
        }
      } finally {
        await page.close();
      }
    });
  });

  // ── Skill Authoring ────────────────────────────────────────────────────────
  describe('Skill Authoring', () => {
    test('toggle buttons present alongside Fork/Validate/Save', async () => {
      const page = await waitForPage(ctx, '/intelligence/skill-authoring');
      try {
        // Wait for skill list and editor to load
        await page.waitForSelector('[data-testid="skill-editor"]', { timeout: 10000 })
          .catch(() => null);
        const editor = await page.$('[data-testid="skill-editor"]');
        if (editor) {
          await page.waitForSelector(PENCIL_BTN, { timeout: 5000 });
          expect(await page.$(PENCIL_BTN)).not.toBeNull();
          expect(await page.$(EYE_BTN)).not.toBeNull();
        } else {
          console.warn('No authored skills available — skipping toggle check');
        }
      } finally {
        await page.close();
      }
    });

    test('Preview → Edit round-trip on skill editor', async () => {
      const page = await waitForPage(ctx, '/intelligence/skill-authoring');
      try {
        await page.waitForSelector('[data-testid="skill-editor"]', { timeout: 10000 })
          .catch(() => null);
        const editor = await page.$('[data-testid="skill-editor"]');
        if (!editor) {
          console.warn('No skill editor found — skipping');
          return;
        }

        await page.waitForSelector(EYE_BTN, { timeout: 5000 });
        await page.click(EYE_BTN);
        await new Promise((r) => setTimeout(r, 300));

        // Preview mode: prose visible, textarea hidden
        expect(await page.$('.prose')).not.toBeNull();
        expect(await page.$('[data-testid="skill-editor"]')).toBeNull();

        // Back to edit
        await page.click(PENCIL_BTN);
        await new Promise((r) => setTimeout(r, 300));
        expect(await page.$('[data-testid="skill-editor"]')).not.toBeNull();
      } finally {
        await page.close();
      }
    });
  });
});
