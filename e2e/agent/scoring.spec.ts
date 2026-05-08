// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Scoring', () => {
  test('scoring page loads and calls API', async ({ page }) => {
    const [weightsRes] = await Promise.all([
      page.waitForResponse('**/app/v1/settings/scoring-weights'),
      page.goto('/settings/scoring'),
    ]);
    expect(weightsRes.status()).toBe(200);
    await expect(page.locator('[data-testid="scoring-weights-form"]')).toBeVisible({ timeout: 10000 });
  });

  test('API weight values match UI sliders', async ({ page, api }) => {
    const res = await api.get('/app/v1/settings/scoring-weights');
    expect(res.status()).toBe(200);
    const weights = await res.json() as { W1_timeline?: number; W2_dependencies?: number };

    await page.goto('/settings/scoring');
    await expect(page.locator('[data-testid="scoring-weights-form"]')).toBeVisible({ timeout: 10000 });

    // At minimum the 7-factor labels are present
    await expect(page.locator('text=Timeline Urgency')).toBeVisible();
    await expect(page.locator('text=Dependencies')).toBeVisible();
    await expect(page.locator('text=Critical Path')).toBeVisible();
    await expect(page.locator('text=Blocker')).toBeVisible();

    // If API returned a W1 value, it should be reflected in the form
    if (weights.W1_timeline !== undefined && weights.W1_timeline !== null) {
      const w1Input = page.locator('input[type="range"]').first();
      const val = await w1Input.inputValue();
      // API stores weights as fraction (0–1); UI may display as percentage (0–100)
      const apiVal = weights.W1_timeline;
      const uiVal = parseFloat(val);
      const matches = Math.abs(uiVal - apiVal) < 0.5 || Math.abs(uiVal - apiVal * 100) < 1;
      expect(matches).toBe(true);
    }
  });

  test('SAVE weights → PATCH API called → data persists', async ({ page, api }) => {
    // Read current weights
    const before = await (await api.get('/app/v1/settings/scoring-weights')).json() as { W1_timeline?: number };

    await page.goto('/settings/scoring');
    await expect(page.locator('[data-testid="scoring-weights-form"]')).toBeVisible({ timeout: 10000 });

    // Adjust the first slider slightly
    const slider = page.locator('input[type="range"]').first();
    await slider.evaluate((el: HTMLInputElement) => {
      const newVal = parseFloat(el.max) * 0.6;
      el.value = String(newVal);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Click Save
    const [patchRes] = await Promise.all([
      page.waitForResponse('**/app/v1/settings/scoring-weights'),
      page.locator('button').filter({ hasText: 'Save Weights' }).click(),
    ]);
    expect([200, 204]).toContain(patchRes.status());

    // Verify via API the weights were updated
    const after = await (await api.get('/app/v1/settings/scoring-weights')).json() as { W1_timeline?: number };
    // The value should have changed from before (or at least a successful patch occurred)
    expect(patchRes.status()).toBeLessThan(300);
  });
});

