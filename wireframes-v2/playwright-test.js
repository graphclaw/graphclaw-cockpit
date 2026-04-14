const { chromium } = require('playwright');
const path = require('path');

const PAGE_URL = 'file:///C:/Users/abhis/Projects/graphclaw-cockpit/wireframes-v2/pages/intelligence-hub.html';
const SCREENSHOTS_DIR = 'C:/Users/abhis/Projects/graphclaw-cockpit/wireframes-v2/screenshots';

async function takeScreenshot(page, name) {
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/${name}.png`, fullPage: false });
  console.log(`Saved: ${name}.png`);
}

async function waitForLucide(page) {
  // Wait for Lucide icons to render
  await page.waitForTimeout(800);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ─── 1. Desktop Light (1440×900) — default state (Agent Profile active) ───
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
    await waitForLucide(page);
    await takeScreenshot(page, 'intelligence-hub-desktop-light');

    // Click Working Memory
    await page.click('[data-section="working"]');
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'intelligence-hub-working-memory');

    // Click Episodic Memory
    await page.click('[data-section="episodic"]');
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'intelligence-hub-episodic-memory');

    // Click Skill Authoring
    await page.click('[data-section="skills"]');
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'intelligence-hub-skill-authoring');

    await page.close();
  }

  // ─── 2. Desktop Dark (1440×900) ────────────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
    await waitForLucide(page);
    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'intelligence-hub-desktop-dark');
    await page.close();
  }

  // ─── 3. Tablet (768×1024) ──────────────────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
    await waitForLucide(page);
    await takeScreenshot(page, 'intelligence-hub-tablet');
    await page.close();
  }

  // ─── 4. Mobile (390×844) ───────────────────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
    await waitForLucide(page);
    await takeScreenshot(page, 'intelligence-hub-mobile');
    await page.close();
  }

  await browser.close();
  console.log('All screenshots done.');
})();
