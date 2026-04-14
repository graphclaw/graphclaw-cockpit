/**
 * GraphClaw Cockpit — Full Consistency Audit (all 20 pages)
 * Screenshots every page at desktop-light, desktop-dark, tablet, mobile.
 * Also checks for theme-picker injection and avatar consistency.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'file:///C:/Users/abhis/Projects/graphclaw-cockpit/wireframes-v2';
const SHOTS_DIR = 'C:/Users/abhis/Projects/graphclaw-cockpit/wireframes-v2/screenshots/consistency';

const PAGES = [
  // Phase B — Core Task Views
  { id: 'goal-view',         file: 'pages/goal-view.html',         label: 'Goals' },
  { id: 'my-tasks',          file: 'pages/my-tasks.html',          label: 'My Tasks' },
  { id: 'project-view',      file: 'pages/project-view.html',      label: 'Projects' },
  { id: 'timeline-view',     file: 'pages/timeline-view.html',     label: 'Timeline' },
  { id: 'resource-view',     file: 'pages/resource-view.html',     label: 'People' },
  { id: 'task-detail',       file: 'pages/task-detail.html',       label: 'Task Detail' },
  // Phase C — Agent & Chat
  { id: 'agent-monitor',     file: 'pages/agent-monitor.html',     label: 'Agent Monitor' },
  { id: 'chat-sidebar',      file: 'pages/chat-sidebar.html',      label: 'Chat Sidebar' },
  { id: 'chat-fullpage',     file: 'pages/chat-fullpage.html',     label: 'Chat Full Page' },
  // Phase D — Canvas & Settings
  { id: 'canvas-editor',     file: 'pages/canvas-editor.html',     label: 'Canvas Editor', noSidebar: true },
  { id: 'settings-channels', file: 'pages/settings-channels.html', label: 'Settings: Channels' },
  { id: 'settings-llm',      file: 'pages/settings-llm.html',      label: 'Settings: LLM' },
  { id: 'settings-scoring',  file: 'pages/settings-scoring.html',  label: 'Settings: Scoring' },
  { id: 'settings-briefing', file: 'pages/settings-briefing.html', label: 'Settings: Briefing' },
  { id: 'settings-triggers', file: 'pages/settings-triggers.html', label: 'Settings: Triggers' },
  { id: 'settings-a2a',      file: 'pages/settings-a2a.html',      label: 'Settings: A2A' },
  // Phase E — Marketplace & Admin
  { id: 'skill-marketplace', file: 'pages/skill-marketplace.html', label: 'Skill Marketplace' },
  { id: 'mcp-registry',      file: 'pages/mcp-registry.html',      label: 'MCP Registry' },
  { id: 'admin-panel',       file: 'pages/admin-panel.html',       label: 'Admin Panel' },
  // Phase G — Intelligence Hub
  { id: 'intelligence-hub',  file: 'pages/intelligence-hub.html',  label: 'Intelligence Hub' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'mobile',  width: 390,  height: 844 },
];

async function waitForReady(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(900); // let Lucide + nav.js + theme.js settle
}

async function checkConsistency(page, pageId, noSidebar) {
  const issues = [];

  // 1. Theme picker injected?
  const hasPicker = await page.$('#gc-theme-picker') !== null;
  if (!hasPicker) issues.push('MISSING theme picker (#gc-theme-picker)');

  if (!noSidebar) {
    // 2. Sidebar logo image present?
    const hasLogoImg = await page.$('.sidebar-logo-img') !== null;
    if (!hasLogoImg) issues.push('MISSING sidebar logo img (.sidebar-logo-img)');

    // 3. Nav item for this page is active?
    if (pageId !== 'home') {
      const activeItems = await page.$$('.nav-item.active');
      if (activeItems.length === 0) issues.push('No active nav item found');
    }
  } else {
    // No-sidebar page: check topbar logo img instead
    const hasTopbarLogo = await page.$('img[alt="GraphClaw"]') !== null;
    if (!hasTopbarLogo) issues.push('MISSING topbar logo img (img[alt="GraphClaw"])');
  }

  // 4. Lucide icons rendered? (check at least one svg)
  const svgCount = await page.$$eval('svg', els => els.length);
  if (svgCount < 3) issues.push(`Too few SVG icons (${svgCount}), Lucide may not have rendered`);

  // 5. Topbar avatar = AR?
  const avatarText = await page.$eval(
    '.topbar-avatar, .avatar.avatar-sm[style*="0EA5E9"]',
    el => el.textContent.trim()
  ).catch(() => null);
  if (avatarText && avatarText !== 'AR') issues.push(`Topbar avatar shows "${avatarText}", expected "AR"`);

  return issues;
}

(async () => {
  if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const report = [];

  for (const pg of PAGES) {
    const url = BASE + '/' + pg.file;
    console.log(`\n── ${pg.label} ──`);
    const pageReport = { id: pg.id, label: pg.label, issues: [], screenshots: [] };

    // ── Desktop Light ──────────────────────────────────────────────────
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      await p.goto(url, { waitUntil: 'domcontentloaded' });
      await waitForReady(p);
      const issues = await checkConsistency(p, pg.id, pg.noSidebar);
      pageReport.issues.push(...issues.map(i => `[desktop-light] ${i}`));
      const shot = path.join(SHOTS_DIR, `${pg.id}-desktop-light.png`);
      await p.screenshot({ path: shot, fullPage: false });
      pageReport.screenshots.push(shot);
      console.log(`  desktop-light  ${issues.length ? '⚠ ' + issues.join('; ') : '✓'}`);
      await ctx.close();
    }

    // ── Desktop Dark ───────────────────────────────────────────────────
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      await p.goto(url, { waitUntil: 'domcontentloaded' });
      await waitForReady(p);
      await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await p.waitForTimeout(200);
      const shot = path.join(SHOTS_DIR, `${pg.id}-desktop-dark.png`);
      await p.screenshot({ path: shot, fullPage: false });
      pageReport.screenshots.push(shot);
      console.log(`  desktop-dark   ✓`);
      await ctx.close();
    }

    // ── Tablet ────────────────────────────────────────────────────────
    {
      const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
      const p = await ctx.newPage();
      await p.goto(url, { waitUntil: 'domcontentloaded' });
      await waitForReady(p);
      const shot = path.join(SHOTS_DIR, `${pg.id}-tablet.png`);
      await p.screenshot({ path: shot, fullPage: false });
      pageReport.screenshots.push(shot);
      console.log(`  tablet         ✓`);
      await ctx.close();
    }

    // ── Mobile ────────────────────────────────────────────────────────
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const p = await ctx.newPage();
      await p.goto(url, { waitUntil: 'domcontentloaded' });
      await waitForReady(p);
      const shot = path.join(SHOTS_DIR, `${pg.id}-mobile.png`);
      await p.screenshot({ path: shot, fullPage: false });
      pageReport.screenshots.push(shot);
      console.log(`  mobile         ✓`);
      await ctx.close();
    }

    report.push(pageReport);
  }

  await browser.close();

  // ── Summary ───────────────────────────────────────────────────────
  console.log('\n\n══════════ CONSISTENCY AUDIT SUMMARY ══════════');
  let totalIssues = 0;
  for (const r of report) {
    if (r.issues.length > 0) {
      console.log(`\n⚠  ${r.label}:`);
      r.issues.forEach(i => console.log(`     • ${i}`));
      totalIssues += r.issues.length;
    } else {
      console.log(`✓  ${r.label}`);
    }
  }
  console.log(`\nTotal issues: ${totalIssues} across ${report.length} pages`);
  console.log(`Screenshots saved to: ${SHOTS_DIR}`);
  console.log('════════════════════════════════════════════════');
})();
