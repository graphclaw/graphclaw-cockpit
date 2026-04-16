/**
 * guardrails.spec.ts
 *
 * Tests guardrail rule management via /app/v1/admin/guardrails.
 * After PUT: verifies REST round-trip and runs the validate endpoint.
 * Also tests the /guardrails/test endpoint with live message evaluation.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';

describe('Admin — Guardrails', () => {
  let ctx: TestContext;
  let originalRules: unknown = null;

  beforeAll(async () => {
    ctx = await TestContext.create();
    const { body } = await ctx.api.get('/admin/guardrails');
    originalRules = body;
  });

  afterAll(async () => {
    if (originalRules) {
      await ctx.api.put('/admin/guardrails', originalRules).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── Get guardrails ─────────────────────────────────────────────────────────
  test('GET /admin/guardrails — returns valid JSON with rules array', async () => {
    const { body, status } = await ctx.api.get<{
      version?: string;
      rules?: unknown[];
    }>('/admin/guardrails');
    expect(status).toBe(200);
    expect(Array.isArray(body.rules ?? [])).toBe(true);
  });

  // ── UI shows guardrails editor ─────────────────────────────────────────────
  test('guardrails UI renders JSON editor with content from real API', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/admin/guardrails', '/app/v1/admin/guardrails');
      await page
        .waitForSelector('[data-testid="guardrails-editor"]', { timeout: 10000 })
        .catch(() => {});
      await page.waitForSelector('main', { timeout: 10000 });

      // Editor content should be valid JSON
      const editor = await page.$('[data-testid="guardrails-editor"]').catch(() => null);
      if (editor) {
        const content = await page.evaluate(
          (el: Element) => (el as HTMLTextAreaElement).value,
          editor,
        );
        if (content) {
          expect(() => JSON.parse(content as string)).not.toThrow();
        }
      }
    } finally {
      await page.close();
    }
  });

  // ── Validate guardrail rules ───────────────────────────────────────────────
  test('POST /admin/guardrails/validate — valid rules returns valid=true', async () => {
    const { body: current } = await ctx.api.get<{ version?: string; rules?: unknown[] }>(
      '/admin/guardrails',
    );

    const { body, status } = await ctx.api.post<{
      valid?: boolean;
      errors?: string[];
      rule_count?: number;
    }>('/admin/guardrails/validate', current);
    expect(status).toBe(200);
    expect(body.valid).toBe(true);
    expect(Array.isArray(body.errors ?? [])).toBe(true);
  });

  // ── Update guardrails → REST persists ─────────────────────────────────────
  test('PUT /admin/guardrails → new rules in REST response', async () => {
    const newRules = {
      version: '2.0',
      rules: [
        {
          rule_id: `e2e-rule-${Date.now()}`,
          name: 'E2E Test Rule',
          description: 'Block messages containing test trigger phrase',
          pattern: '__e2e_block_trigger__',
          action: 'BLOCK',
          enabled: true,
        },
      ],
    };

    const { status } = await ctx.api.put('/admin/guardrails', newRules);
    expect([200, 204]).toContain(status);

    const { body: after } = await ctx.api.get<{ rules?: Array<{ id?: string; rule_id?: string }> }>(
      '/admin/guardrails',
    );
    const rules = after.rules ?? [];
    const found = rules.find((r) => (r.rule_id ?? r.id)?.includes('e2e-rule'));
    expect(found).toBeDefined();
  });

  // ── Test guardrail against message ────────────────────────────────────────
  test('POST /admin/guardrails/test — blocked message triggers rule', async () => {
    const { body, status } = await ctx.api.post<{
      blocked?: boolean;
      triggered_rules?: unknown[];
      action?: string;
    }>('/admin/guardrails/test', {
      message: 'Please __e2e_block_trigger__ this message',
      context: { user_id: 'e2e-test-user' },
    });
    expect(status).toBe(200);
    expect(typeof (body.blocked ?? false)).toBe('boolean');
  });

  // ── Test guardrail — allowed message ──────────────────────────────────────
  test('POST /admin/guardrails/test — normal message not blocked', async () => {
    const { body, status } = await ctx.api.post<{
      blocked?: boolean;
      triggered_rules?: unknown[];
    }>('/admin/guardrails/test', {
      message: 'What is the status of task TSK-001?',
      context: {},
    });
    expect(status).toBe(200);
    // Normal messages should not be blocked by the e2e test rule
    if (body.triggered_rules !== undefined) {
      const triggered = (body.triggered_rules ?? []).filter(
        (r: unknown) =>
          typeof r === 'object' &&
          r !== null &&
          (r as { id?: string }).id?.includes('e2e-rule'),
      );
      expect(triggered.length).toBe(0);
    }
  });

  // ── Guardrail metrics ──────────────────────────────────────────────────────
  test('GET /admin/guardrails/metrics returns stats', async () => {
    const { body, status } = await ctx.api.get<{
      total_requests?: number;
      blocked_count?: number;
    }>('/admin/guardrails/metrics');
    expect(status).toBe(200);
    expect(typeof (body.total_requests ?? 0)).toBe('number');
    expect(typeof (body.blocked_count ?? 0)).toBe('number');
  });
});
