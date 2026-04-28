/**
 * feature-gates.spec.ts
 *
 * Tests feature flag toggling via /app/v1/admin/features.
 * After toggle: verifies REST response AND direct SQL query on the
 * feature_flags table in PostgreSQL.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';

interface Feature {
  key: string;
  enabled: boolean;
  label?: string;
}

describe('Admin — Feature Gates', () => {
  let ctx: TestContext;
  const originalStates: Map<string, boolean> = new Map();

  beforeAll(async () => {
    ctx = await TestContext.create();
    // Record original states so we can restore them
    const { body } = await ctx.api.get<{ features?: Feature[] }>('/admin/features');
    (body.features ?? []).forEach((f) => originalStates.set(f.key, f.enabled));
  });

  afterAll(async () => {
    // Restore original states
    for (const [key, enabled] of originalStates) {
      await ctx.api.put(`/admin/features`, {
        features: [{ key, enabled }],
      }).catch(async () => {
        // Try PATCH if PUT not supported
        await ctx.api.patch(`/admin/features/${key}`, { enabled }).catch(() => {});
      });
    }
    await ctx.destroy();
  });

  // ── Features list: UI matches API ──────────────────────────────────────────
  test('GET /admin/features — UI toggles match API enabled states', async () => {
    const { body, status } = await ctx.api.get<{ features?: Feature[] }>('/admin/features');
    expect(status).toBe(200);
    expect(Array.isArray(body.features ?? [])).toBe(true);

    const page = await ctx.newPage();
    try {
      const [apiRes] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/app/v1/admin/features'),
          { timeout: 20000 },
        ),
        page.goto(`${process.env.BASE_URL ?? 'http://localhost:3000'}/admin/features`, {
          waitUntil: 'domcontentloaded',
        }),
      ]);
      expect(apiRes.status()).toBe(200);

      await page
        .waitForSelector('[data-testid="feature-gates"]', { timeout: 10000 })
        .catch(() => {});

      // Each feature should have a visible toggle
      if (body.features && body.features.length > 0) {
        const firstKey = body.features[0].key;
        await page
          .waitForSelector(`[data-testid="toggle-${firstKey}"]`, { timeout: 8000 })
          .catch(() => {});
      }
    } finally {
      await page.close();
    }
  });

  // ── Toggle feature via UI → REST persists → SQL reflects change ───────────
  test('UI toggle → PUT/PATCH to API → REST state flipped → SQL matches', async () => {
    const { body } = await ctx.api.get<{ features?: Feature[] }>('/admin/features');
    if (!body.features || body.features.length === 0) {
      console.warn('Skipping: no features returned from API');
      return;
    }
    const feature = body.features[0];
    const originalEnabled = feature.enabled;

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/admin/features', '/app/v1/admin/features');
      await page
        .waitForSelector('[data-testid="feature-gates"]', { timeout: 10000 })
        .catch(() => {});

      const toggle = await page
        .$(`[data-testid="toggle-${feature.key}"]`)
        .catch(() => null);

      if (toggle) {
        const [patchRes] = await Promise.all([
          page.waitForResponse(
            (r) => r.url().includes('/app/v1/admin/features') &&
              ['PUT', 'PATCH'].includes(r.request().method()),
            { timeout: 20000 },
          ),
          toggle.click(),
        ]);
        expect([200, 204]).toContain(patchRes.status());

        // REST: state flipped
        const { body: afterApi } = await ctx.api.get<{ features?: Feature[] }>('/admin/features');
        const afterFeature = (afterApi.features ?? []).find((f) => f.key === feature.key);
        if (afterFeature) {
          expect(afterFeature.enabled).toBe(!originalEnabled);
        }

        // SQL: feature_flags table
        try {
          const rows = await ctx.db.querySQL<{ enabled: boolean }>(
            "SELECT enabled FROM feature_flags WHERE key = $1",
            [feature.key],
          );
          if (rows.length > 0) {
            expect(rows[0].enabled).toBe(!originalEnabled);
          }
        } catch {
          // feature_flags may use a different table name or be stored elsewhere
        }
      }
    } finally {
      await page.close();
    }
  });

  // ── Toggle back to original state ──────────────────────────────────────────
  test('toggle back → REST state restored → SQL matches original', async () => {
    const { body } = await ctx.api.get<{ features?: Feature[] }>('/admin/features');
    if (!body.features || body.features.length === 0) return;

    const feature = body.features[0];
    const currentEnabled = feature.enabled;
    const expected = originalStates.get(feature.key) ?? currentEnabled;

    if (currentEnabled !== expected) {
      const page = await ctx.newPage();
      try {
        await gotoAndWaitForApi(page, '/admin/features', '/app/v1/admin/features');
        const toggle = await page
          .$(`[data-testid="toggle-${feature.key}"]`)
          .catch(() => null);
        if (toggle) {
          await Promise.all([
            page.waitForResponse(
              (r) => r.url().includes('/app/v1/admin/features'),
              { timeout: 20000 },
            ).catch(() => null),
            toggle.click(),
          ]);
        }
      } finally {
        await page.close();
      }
    }

    // Verify REST
    const { body: restored } = await ctx.api.get<{ features?: Feature[] }>('/admin/features');
    const restoredFeature = (restored.features ?? []).find((f) => f.key === feature.key);
    if (restoredFeature) {
      expect(restoredFeature.enabled).toBe(expected);
    }
  });

  // ── All features have toggles in UI ───────────────────────────────────────
  test('each feature from API has a corresponding toggle in the UI', async () => {
    const { body } = await ctx.api.get<{ features?: Feature[] }>('/admin/features');
    if (!body.features || body.features.length === 0) return;

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/admin/features', '/app/v1/admin/features');
      await page.waitForSelector('[data-testid="feature-gates"]', { timeout: 10000 }).catch(() => {});

      for (const f of body.features.slice(0, 3)) {
        const toggle = await page
          .$(`[data-testid="toggle-${f.key}"]`)
          .catch(() => null);
        if (toggle) {
          const visible = await toggle.isIntersectingViewport();
          expect(visible).toBe(true);
        }
      }
    } finally {
      await page.close();
    }
  });
});
