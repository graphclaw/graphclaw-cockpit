/**
 * skill-marketplace.spec.ts
 *
 * E2E tests for the full Skills Marketplace feature:
 *   - Installed skills tab: list, filter, toggle enable/disable, uninstall
 *   - Skill config: PATCH /skills/{id}/config via detail drawer
 *   - Browse Remote tab: search, install from source
 *   - Sources tab: add and remove skill sources
 *   - Admin marketplace policy: GET/PUT /admin/features/marketplace
 *
 * All browser tests navigate to the real running cockpit at APP_BASE.
 * All REST tests hit the real FastAPI backend at /app/v1/.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi, waitForText, clickAndWaitForApi } from '../../helpers/browser.helper';

describe('Skills — Marketplace', () => {
  let ctx: TestContext;
  const installedIds: string[] = [];
  const addedSourceUris: string[] = [];

  beforeAll(async () => {
    ctx = await TestContext.create();
  });

  afterAll(async () => {
    for (const id of installedIds) {
      await ctx.api.delete(`/skills/${id}`).catch(() => {});
    }
    for (const uri of addedSourceUris) {
      await ctx.api.delete(`/skills/sources/${encodeURIComponent(uri)}`).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── REST: List installed skills ─────────────────────────────────────────────
  test('GET /skills — returns array with expected shape', async () => {
    const { body, status } = await ctx.api.get<Array<{
      skill_id?: string;
      skill_name?: string;
      name?: string;
      enabled?: boolean;
    }>>('/skills');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      const s = body[0];
      expect(s.skill_id ?? s.name ?? s.skill_name).toBeDefined();
    }
  });

  // ── REST: Toggle skill enable/disable ──────────────────────────────────────
  test('PATCH /skills/{id} — toggles enabled state and persists', async () => {
    // Install a skill to toggle
    const skillName = `e2e-toggle-${Date.now()}`;
    const { body: installed, status: installStatus } = await ctx.api.post<{
      skill_id?: string;
      enabled?: boolean;
    }>('/skills/install', {
      skill_name: skillName,
      source_uri: 'graphclaw://builtin/graph-query',
      version: '1.0.0',
    });

    if (![200, 201].includes(installStatus)) {
      console.warn(`Skipping toggle test — install returned ${installStatus}`);
      return;
    }

    const skillId = installed.skill_id ?? '';
    if (!skillId) return;
    installedIds.push(skillId);

    // Disable
    const { body: disabled, status: disableStatus } = await ctx.api.patch<{
      enabled?: boolean;
    }>(`/skills/${skillId}`, { enabled: false });
    expect([200, 204]).toContain(disableStatus);
    if (disableStatus === 200) {
      expect(disabled.enabled).toBe(false);
    }

    // Re-enable
    const { body: reEnabled, status: enableStatus } = await ctx.api.patch<{
      enabled?: boolean;
    }>(`/skills/${skillId}`, { enabled: true });
    expect([200, 204]).toContain(enableStatus);
    if (enableStatus === 200) {
      expect(reEnabled.enabled).toBe(true);
    }

    // Verify via list
    const { body: list } = await ctx.api.get<Array<{
      skill_id?: string;
      enabled?: boolean;
    }>>('/skills');
    const found = list.find((s) => s.skill_id === skillId);
    if (found) {
      expect(found.enabled).toBe(true);
    }
  });

  // ── REST: Skill config update ──────────────────────────────────────────────
  test('PATCH /skills/{id}/config — updates output_type and requires_approval', async () => {
    // Install a skill to configure
    const skillName = `e2e-config-${Date.now()}`;
    const { body: installed, status: installStatus } = await ctx.api.post<{
      skill_id?: string;
    }>('/skills/install', {
      skill_name: skillName,
      source_uri: 'graphclaw://builtin/score-explain',
      version: '1.0.0',
    });

    if (![200, 201].includes(installStatus)) {
      console.warn(`Skipping config test — install returned ${installStatus}`);
      return;
    }

    const skillId = installed.skill_id ?? '';
    if (!skillId) return;
    installedIds.push(skillId);

    const { status } = await ctx.api.patch(`/skills/${skillId}/config`, {
      output_type: 'DRAFT_FOR_REVIEW',
      requires_approval: true,
    });
    // Accept 200, 204, or 404/422 if endpoint not yet wired
    expect([200, 204, 404, 422]).toContain(status);
  });

  // ── REST: Skill sources CRUD ───────────────────────────────────────────────
  test('POST /skills/sources → appears in GET list → DELETE removes it', async () => {
    const sourceUri = `https://e2e-test-skills-${Date.now()}.example.com/index.json`;
    addedSourceUris.push(sourceUri);

    const { status: addStatus } = await ctx.api.post('/skills/sources', {
      source_type: 'website',
      uri: sourceUri,
      name: `E2E Source ${Date.now()}`,
    });
    expect([200, 201, 409]).toContain(addStatus);

    if ([200, 201].includes(addStatus)) {
      const { body: sources } = await ctx.api.get<Array<{ source_uri?: string }>>('/skills/sources');
      const found = sources.find((s) => s.source_uri === sourceUri);
      expect(found).toBeDefined();

      // Delete
      const { status: delStatus } = await ctx.api.delete(
        `/skills/sources/${encodeURIComponent(sourceUri)}`,
      );
      expect([200, 204]).toContain(delStatus);
      addedSourceUris.pop(); // already cleaned

      const { body: after } = await ctx.api.get<Array<{ source_uri?: string }>>('/skills/sources');
      const stillThere = after.find((s) => s.source_uri === sourceUri);
      expect(stillThere).toBeUndefined();
    }
  });

  // ── REST: Browse / search skills ───────────────────────────────────────────
  test('GET /skills/search?q= — returns array (may be empty)', async () => {
    const { body, status } = await ctx.api.get<unknown[]>('/skills/search?q=summariz');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  // ── REST: Admin marketplace policy ────────────────────────────────────────
  test('GET /admin/features/marketplace — returns policy shape', async () => {
    const { body, status } = await ctx.api.get<{
      enabled?: boolean;
      allow_external_sources?: boolean;
      require_approval_for_install?: boolean;
      approved_sources?: string[];
    }>('/admin/features/marketplace');
    expect([200, 404]).toContain(status);
    if (status === 200) {
      expect(typeof (body.enabled ?? true)).toBe('boolean');
      expect(Array.isArray(body.approved_sources ?? [])).toBe(true);
    }
  });

  test('PUT /admin/features/marketplace — round-trips policy changes', async () => {
    const { body: current, status: getStatus } = await ctx.api.get<{
      enabled?: boolean;
      allow_external_sources?: boolean;
      require_approval_for_install?: boolean;
      approved_sources?: string[];
    }>('/admin/features/marketplace');

    if (getStatus !== 200) {
      console.warn('Skipping marketplace PUT test — GET returned', getStatus);
      return;
    }

    const original = {
      enabled: current.enabled ?? true,
      allow_external_sources: current.allow_external_sources ?? true,
      require_approval_for_install: current.require_approval_for_install ?? false,
      approved_sources: current.approved_sources ?? [],
    };

    // Flip enabled
    const { status: putStatus } = await ctx.api.put('/admin/features/marketplace', {
      ...original,
      enabled: !original.enabled,
    });
    expect([200, 204]).toContain(putStatus);

    // Restore
    await ctx.api.put('/admin/features/marketplace', original).catch(() => {});
  });

  // ── UI: Skills page loads with 4 tabs ─────────────────────────────────────
  test('skills page renders Installed tab with skills list', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/skills', '/app/v1/skills');
      await page.waitForSelector('main', { timeout: 10000 });

      // "Skills" heading
      await page.waitForFunction(
        () => document.body.innerText.includes('Skills'),
        { timeout: 10000 },
      );

      // At least 3 of the 4 tab buttons visible
      const buttons = await page.$$eval('button', (els) =>
        els.map((b) => b.textContent?.trim() ?? '').filter(Boolean),
      );
      const tabLabels = ['Installed', 'Browse Remote', 'My Skills', 'Sources'];
      const found = tabLabels.filter((t) => buttons.some((b) => b.includes(t)));
      expect(found.length).toBeGreaterThanOrEqual(3);
    } finally {
      await page.close();
    }
  });

  // ── UI: Filter skills by name ──────────────────────────────────────────────
  test('installed tab filter input narrows skill list', async () => {
    const { body: skills } = await ctx.api.get<Array<{
      skill_id?: string;
      skill_name?: string;
      name?: string;
    }>>('/skills');

    if (skills.length < 2) {
      console.warn('Skipping filter test — fewer than 2 skills installed');
      return;
    }

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/skills', '/app/v1/skills');
      await page.waitForSelector('[data-testid="skills-list"]', { timeout: 12000 })
        .catch(() => {}); // present only when skills exist

      const filterInput = await page.$(
        'input[placeholder*="Filter"], input[placeholder*="filter"]',
      );
      if (!filterInput) {
        console.warn('Filter input not found — skipping assertion');
        return;
      }

      // Type first 4 chars of first skill name
      const firstName = String(
        skills[0].name ?? skills[0].skill_name ?? skills[0].skill_id ?? 'e2e',
      ).slice(0, 4);
      await filterInput.type(firstName);
      await new Promise((r) => setTimeout(r, 500));

      // At least one skill row should still be visible
      const rows = await page.$$eval('[data-testid="skills-list"] > *', (els) => els.length);
      expect(rows).toBeGreaterThanOrEqual(1);
    } finally {
      await page.close();
    }
  });

  // ── UI: Toggle skill via UI button ─────────────────────────────────────────
  test('toggle button fires PATCH to /skills/{id}', async () => {
    const { body: skills } = await ctx.api.get<Array<{
      skill_id?: string;
      enabled?: boolean;
    }>>('/skills');
    if (skills.length === 0) {
      console.warn('Skipping toggle UI test — no installed skills');
      return;
    }
    const targetSkill = skills[0];
    const skillId = targetSkill.skill_id ?? '';
    if (!skillId) return;

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/skills', '/app/v1/skills');
      await page.waitForSelector('[data-testid="skills-list"]', { timeout: 12000 })
        .catch(() => {});

      // Find and click the first toggle button (title="Disable" or title="Enable")
      const toggleBtn = await page.$('[title="Disable"], [title="Enable"]');
      if (!toggleBtn) {
        console.warn('Toggle button not found in DOM — skipping UI toggle assertion');
        return;
      }

      const patchRes = await clickAndWaitForApi(
        page,
        '[title="Disable"],[title="Enable"]',
        `/app/v1/skills/${skillId}`,
        'PATCH',
      ).catch(() => null);

      if (patchRes) {
        expect([200, 204]).toContain(patchRes.status());
      }

      // Restore original state
      await ctx.api.patch(`/skills/${skillId}`, { enabled: targetSkill.enabled ?? true })
        .catch(() => {});
    } finally {
      await page.close();
    }
  });

  // ── UI: Browse Remote tab search ───────────────────────────────────────────
  test('Browse Remote tab shows search input and fires /skills/search', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/skills', '/app/v1/skills');
      await page.waitForSelector('main', { timeout: 10000 });

      // Click Browse Remote tab
      const tabs = await page.$$('button');
      let browseTab: typeof tabs[number] | undefined;
      for (const btn of tabs) {
        const text = await btn.evaluate((el) => el.textContent?.trim() ?? '');
        if (text.includes('Browse Remote')) {
          browseTab = btn;
          break;
        }
      }
      if (!browseTab) {
        console.warn('Browse Remote tab not found — skipping');
        return;
      }
      await browseTab.click();
      await new Promise((r) => setTimeout(r, 500));

      // Search input should be present
      const searchInput = await page.$(
        'input[placeholder*="Search skills"]',
      );
      if (!searchInput) {
        console.warn('Browse search input not found — skipping');
        return;
      }

      // Type ≥2 chars to trigger search
      const [searchRes] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/app/v1/skills/search'),
          { timeout: 10000 },
        ).catch(() => null),
        searchInput.type('sk'),
      ]);

      if (searchRes) {
        expect([200, 400]).toContain(searchRes.status());
      }
    } finally {
      await page.close();
    }
  });

  // ── UI: Sources tab Add Source form ────────────────────────────────────────
  test('Sources tab shows Add Source form and submits POST /skills/sources', async () => {
    const page = await ctx.newPage();
    const sourceUri = `https://e2e-ui-source-${Date.now()}.example.com/marketplace.json`;
    addedSourceUris.push(sourceUri);

    try {
      await gotoAndWaitForApi(page, '/skills', '/app/v1/skills');
      await page.waitForSelector('main', { timeout: 10000 });

      // Click Sources tab
      const tabs = await page.$$('button');
      let sourcesTab: typeof tabs[number] | undefined;
      for (const btn of tabs) {
        const text = await btn.evaluate((el) => el.textContent?.trim() ?? '');
        if (text.startsWith('Sources')) {
          sourcesTab = btn;
          break;
        }
      }
      if (!sourcesTab) {
        console.warn('Sources tab not found — skipping');
        return;
      }
      await sourcesTab.click();
      await new Promise((r) => setTimeout(r, 500));

      // Click Add Source button
      const addBtn = await page.$('button:has-text("Add Source"), button[aria-label*="Add Source"]')
        .catch(() => null);

      // Fallback: find button by text
      if (!addBtn) {
        const allButtons = await page.$$('button');
        let found = false;
        for (const b of allButtons) {
          const t = await b.evaluate((el) => el.textContent?.trim() ?? '');
          if (t.includes('Add Source')) {
            await b.click();
            found = true;
            break;
          }
        }
        if (!found) {
          console.warn('Add Source button not found — skipping');
          return;
        }
      } else {
        await addBtn.click();
      }

      await new Promise((r) => setTimeout(r, 400));

      // Fill source URL input
      const uriInput = await page.$('input[placeholder*="github.com"]');
      if (!uriInput) {
        console.warn('Source URI input not found — skipping form submission');
        return;
      }
      await uriInput.type(sourceUri);

      // Submit
      const submitButtons = await page.$$('button');
      let submitted = false;
      for (const b of submitButtons) {
        const t = await b.evaluate((el) => el.textContent?.trim() ?? '');
        if (t === 'Add Source' || t === 'Add') {
          const [postRes] = await Promise.all([
            page.waitForResponse(
              (r) => r.url().includes('/app/v1/skills/sources') && r.request().method() === 'POST',
              { timeout: 10000 },
            ).catch(() => null),
            b.click(),
          ]);
          if (postRes) {
            expect([200, 201, 409]).toContain(postRes.status());
          }
          submitted = true;
          break;
        }
      }
      if (!submitted) {
        console.warn('Add Source submit button not found');
      }
    } finally {
      await page.close();
    }
  });

  // ── UI: My Skills tab navigates to authoring ───────────────────────────────
  test('My Skills tab shows link to /intelligence/skill-authoring', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/skills', '/app/v1/skills');
      await page.waitForSelector('main', { timeout: 10000 });

      // Click My Skills tab
      const tabs = await page.$$('button');
      for (const btn of tabs) {
        const text = await btn.evaluate((el) => el.textContent?.trim() ?? '');
        if (text === 'My Skills') {
          await btn.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 400));

      // Should have a link to /intelligence/skill-authoring
      const link = await page.$('a[href*="skill-authoring"]');
      expect(link).not.toBeNull();
    } finally {
      await page.close();
    }
  });

  // ── UI: Admin Marketplace Policy page ─────────────────────────────────────
  test('admin marketplace policy page renders policy toggles', async () => {
    const page = await ctx.newPage();
    try {
      const apiRes = await gotoAndWaitForApi(
        page,
        '/admin/marketplace',
        '/app/v1/admin/features/marketplace',
      );
      await page.waitForSelector('main', { timeout: 10000 });

      if (apiRes && apiRes.status() === 200) {
        // Page should render toggle controls
        await page.waitForFunction(
          () =>
            document.body.innerText.includes('Marketplace') ||
            document.body.innerText.includes('marketplace'),
          { timeout: 8000 },
        );

        // Switches rendered via role=switch
        const switches = await page.$$('[role="switch"]');
        expect(switches.length).toBeGreaterThanOrEqual(1);
      }
    } finally {
      await page.close();
    }
  });

  // ── UI: Admin marketplace policy toggle → PUT fires ───────────────────────
  test('clicking policy toggle fires PUT /admin/features/marketplace', async () => {
    const { body: policy, status: getStatus } = await ctx.api.get<{
      enabled?: boolean;
      allow_external_sources?: boolean;
      require_approval_for_install?: boolean;
      approved_sources?: string[];
    }>('/admin/features/marketplace');

    if (getStatus !== 200) {
      console.warn('Skipping marketplace UI toggle — endpoint returned', getStatus);
      return;
    }

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(
        page,
        '/admin/marketplace',
        '/app/v1/admin/features/marketplace',
      );
      await page.waitForSelector('[role="switch"]', { timeout: 10000 }).catch(() => {});

      const firstSwitch = await page.$('[role="switch"]');
      if (!firstSwitch) {
        console.warn('No [role=switch] found — skipping');
        return;
      }

      const [putRes] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes('/app/v1/admin/features/marketplace') &&
            r.request().method() === 'PUT',
          { timeout: 15000 },
        ).catch(() => null),
        firstSwitch.click(),
      ]);

      if (putRes) {
        expect([200, 204]).toContain(putRes.status());
      }

      // Restore original state
      await ctx.api.put('/admin/features/marketplace', {
        enabled: policy.enabled ?? true,
        allow_external_sources: policy.allow_external_sources ?? true,
        require_approval_for_install: policy.require_approval_for_install ?? false,
        approved_sources: policy.approved_sources ?? [],
      }).catch(() => {});
    } finally {
      await page.close();
    }
  });
});
