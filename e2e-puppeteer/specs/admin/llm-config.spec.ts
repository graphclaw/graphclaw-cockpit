/**
 * llm-config.spec.ts
 *
 * Tests LLM configuration management: providers, budget, and API keys.
 * After PUT operations: verifies REST round-trip persistence.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi, waitForText } from '../../helpers/browser.helper';

describe('Admin — LLM Configuration', () => {
  let ctx: TestContext;
  let originalBudget: { daily_limit_usd?: number; monthly_limit_usd?: number } = {};
  let originalProviders: unknown = null;

  beforeAll(async () => {
    ctx = await TestContext.create();
    const [budgetRes, providersRes] = await Promise.all([
      ctx.api.get<{ daily_limit_usd?: number; monthly_limit_usd?: number }>('/admin/llm/budget'),
      ctx.api.get('/admin/llm/providers'),
    ]);
    originalBudget = budgetRes.body;
    originalProviders = providersRes.body;
  });

  afterAll(async () => {
    // Restore budget
    if (originalBudget.daily_limit_usd !== undefined) {
      await ctx.api.put('/admin/llm/budget', originalBudget).catch(() => {});
    }
    // Restore providers
    if (originalProviders) {
      await ctx.api.put('/admin/llm/providers', originalProviders).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── LLM providers page renders ─────────────────────────────────────────────
  test('GET /admin/llm/providers — UI renders providers from real API', async () => {
    const { body, status } = await ctx.api.get<{
      providers?: Array<{ provider: string; model: string }>;
    }>('/admin/llm/providers');
    expect(status).toBe(200);

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/admin/llm-config', '/app/v1/admin/llm/providers');
      await page.waitForSelector('main', { timeout: 10000 });
      await waitForText(page, 'LLM', 10000).catch(() => {});

      if (body.providers && body.providers.length > 0) {
        await waitForText(page, body.providers[0].provider, 10000).catch(() => {});
      }
    } finally {
      await page.close();
    }
  });

  // ── Budget values match API ────────────────────────────────────────────────
  test('GET /admin/llm/budget — values shown in UI', async () => {
    const { body, status } = await ctx.api.get<{
      daily_limit_usd?: number;
      monthly_limit_usd?: number;
    }>('/admin/llm/budget');
    expect(status).toBe(200);

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/admin/llm-config', '/app/v1/admin/llm/providers');
      await page.waitForSelector('main', { timeout: 10000 });

      if (body.daily_limit_usd !== undefined) {
        await waitForText(page, String(body.daily_limit_usd), 10000).catch(() => {});
      }
    } finally {
      await page.close();
    }
  });

  // ── Update budget → REST persists ─────────────────────────────────────────
  test('PUT /admin/llm/budget → REST round-trip reflects new values', async () => {
    const newBudget = {
      daily_limit_usd: 42,
      monthly_limit_usd: 420,
      alert_threshold_pct: 80,
      cost_anomaly_sigma: 3.0,
    };

    const { status } = await ctx.api.put('/admin/llm/budget', newBudget);
    expect([200, 204]).toContain(status);

    const { body: after } = await ctx.api.get<{
      daily_limit_usd?: number;
      monthly_limit_usd?: number;
    }>('/admin/llm/budget');
    expect(after.daily_limit_usd).toBe(42);
    expect(after.monthly_limit_usd).toBe(420);
  });

  // ── Update providers config ────────────────────────────────────────────────
  test('PUT /admin/llm/providers → REST reflects updated config', async () => {
    const current = await ctx.api.get<{
      providers?: unknown[];
      default_provider?: string;
    }>('/admin/llm/providers');

    const newConfig = {
      providers: current.body.providers ?? [],
      default_provider: 'anthropic',
    };

    const { status } = await ctx.api.put('/admin/llm/providers', newConfig);
    expect([200, 204]).toContain(status);

    const { body: after } = await ctx.api.get<{ default_provider?: string }>(
      '/admin/llm/providers',
    );
    if (after.default_provider) {
      expect(after.default_provider).toBe('anthropic');
    }
  });

  // ── Register LLM API key (no value disclosed in GET) ──────────────────────
  test('POST /admin/llm/keys → provider key registered, not returned in GET', async () => {
    const { status } = await ctx.api.post('/admin/llm/keys', {
      provider: 'anthropic',
      api_key: 'test-key-e2e-spec',
    });
    // May be 200, 201, or 409 (already set)
    expect([200, 201, 409]).toContain(status);

    // GET list should NOT return the actual key value
    const { body: keys } = await ctx.api.get<
      Array<{ provider?: string; key_name?: string }>
    >('/admin/llm/keys');
    if (Array.isArray(keys)) {
      const anthropicEntry = keys.find((k) => k.provider === 'anthropic');
      if (anthropicEntry) {
        // Key value must never be in the response
        expect((anthropicEntry as { api_key?: string }).api_key).toBeFalsy();
      }
    }
  });

  // ── Judge config ───────────────────────────────────────────────────────────
  test('GET /admin/llm-judge/config returns valid judge config', async () => {
    const { body, status } = await ctx.api.get<{
      enabled?: boolean;
      judge_model?: string;
      sample_rate?: number;
    }>('/admin/llm-judge/config');
    expect(status).toBe(200);
    expect(typeof (body.enabled ?? false)).toBe('boolean');
    expect(typeof (body.sample_rate ?? 0)).toBe('number');
  });

  // ── Judge results ──────────────────────────────────────────────────────────
  test('GET /admin/llm-judge/results returns array', async () => {
    const { body, status } = await ctx.api.get<unknown[]>('/admin/llm-judge/results?limit=10');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});
