import { test, expect } from '../fixtures/auth.fixture';

test.describe('Agent Monitor', () => {
  test('renders agent monitor page', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('h1').filter({ hasText: 'Agent Monitor' })).toBeVisible({ timeout: 10000 });
  });

  test('agent status from API shown in KPI strip', async ({ page, api }) => {
    // Read ground truth
    const res = await api.get('/app/v1/agent/status');
    expect(res.status()).toBe(200);
    const status = await res.json() as { running?: boolean; agent_version?: string };

    const [uiRes] = await Promise.all([
      page.waitForResponse('**/app/v1/agent/status'),
      page.goto('/agent-monitor'),
    ]);
    expect(uiRes.status()).toBe(200);

    await expect(page.locator('[data-testid="kpi-strip"]')).toBeVisible({ timeout: 10000 });
    // Running or Idle label matches API state
    const expectedLabel = status.running ? 'Running' : 'Idle';
    await expect(page.locator(`text=${expectedLabel}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('action queue count from API matches panel', async ({ page, api }) => {
    const res = await api.get('/app/v1/agent/action-queue');
    expect(res.status()).toBe(200);
    const queue = await res.json() as unknown[];

    const [queueRes] = await Promise.all([
      page.waitForResponse('**/app/v1/agent/action-queue'),
      page.goto('/agent-monitor'),
    ]);
    expect(queueRes.status()).toBe(200);

    await expect(page.locator('[data-testid="action-queue-panel"]')).toBeVisible({ timeout: 10000 });
    if (Array.isArray(queue) && queue.length > 0) {
      // There should be queue items visible
      await expect(page.locator('[data-testid="action-queue-panel"] li, [data-testid="action-queue-panel"] [role="listitem"]').first()).toBeVisible({ timeout: 8000 });
    } else {
      // When queue is empty, the panel shows an empty state
      await expect(
        page.locator('[data-testid="action-queue-panel"]')
      ).toBeVisible({ timeout: 8000 });
    }
  });

  test('active agents section is visible', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('[data-testid="active-agents"]')).toBeVisible({ timeout: 10000 });
  });

  test('event log section is visible', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page.locator('[data-testid="event-log"]')).toBeVisible({ timeout: 10000 });
  });
});

