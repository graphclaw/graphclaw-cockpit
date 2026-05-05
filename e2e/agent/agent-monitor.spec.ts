/**
 * GC-E-SKL-W50-001 - validates core agent monitor routes in browser.
 *
 * Scenario: The Agent Monitor route shell resolves to the right section panel,
 * and the skills section exposes both worker utilization and recent job state.
 *
 * PRD: docs/prd/03-agent-monitor.md
 * Build wave: W50
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-05-05
 *
 * Cases covered:
 *  - route redirect and section panel rendering
 *  - comms inbound/outbound tab route behavior
 *  - skills worker pool and recent jobs section visibility
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Agent Monitor', () => {
  test('redirects /agent-monitor to /agent-monitor/overview', async ({ page }) => {
    await page.goto('/agent-monitor');
    await expect(page).toHaveURL(/\/agent-monitor\/overview$/);
    await expect(page.locator('[data-testid="agent-monitor-panel-overview"]')).toBeVisible({ timeout: 10000 });
  });

  test('section route renders matching panel', async ({ page }) => {
    await page.goto('/agent-monitor/scoring');
    await expect(page.locator('[data-testid="agent-monitor-panel-scoring"]')).toBeVisible({ timeout: 10000 });

    const scoreTable = page.locator('[data-testid="scoring-task-table"]');
    const scoreTableEmpty = page.locator('[data-testid="scoring-task-table-empty"]');

    await expect
      .poll(async () => (await scoreTable.isVisible()) || (await scoreTableEmpty.isVisible()), {
        timeout: 10000,
      })
      .toBeTruthy();

    await expect(page.getByText('No factor breakdown selected.')).toBeVisible({ timeout: 10000 });

    if (await page.locator('[data-testid="scoring-task-row-top"]').isVisible()) {
      await page.locator('[data-testid="scoring-task-row-top"]').click();
      await expect(page.locator('[data-testid="score-what-if-open"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('activity route renders feed and filters', async ({ page }) => {
    await page.goto('/agent-monitor/activity');

    const activityPanel = page.locator('[data-testid="agent-monitor-panel-activity"]');
    await expect(activityPanel).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="agent-monitor-activity-feed"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="activity-filter-time"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="activity-filter-type"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="activity-view-session"]')).toBeDisabled({ timeout: 10000 });
    await expect(page.locator('[data-testid="activity-view-session"]')).toHaveAttribute('title', 'Coming soon');
  });

  test('scheduling route renders next run card and run now control', async ({ page }) => {
    await page.goto('/agent-monitor/scheduling');

    const schedulingPanel = page.locator('[data-testid="agent-monitor-panel-scheduling"]');
    await expect(schedulingPanel).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="scheduling-next-run-card"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="scheduling-run-now-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('skills route renders worker pool panel and recent jobs section', async ({ page }) => {
    await page.goto('/agent-monitor/skills');

    const skillsPanel = page.locator('[data-testid="agent-monitor-panel-skills"]');
    await expect(skillsPanel).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="skills-worker-pool"]')).toBeVisible({ timeout: 10000 });

    const jobsTable = page.locator('[data-testid="skills-recent-jobs"]');
    const jobsEmpty = page.locator('[data-testid="skills-recent-jobs-empty"]');

    await expect
      .poll(async () => (await jobsTable.isVisible()) || (await jobsEmpty.isVisible()), {
        timeout: 10000,
      })
      .toBeTruthy();
  });

  test('comms tab route resolves to comms section and preserves tab', async ({ page }) => {
    await page.goto('/agent-monitor/comms/outbound');
    await expect(page).toHaveURL(/\/agent-monitor\/comms\/outbound$/);
    const commsPanel = page.locator('[data-testid="agent-monitor-panel-comms"]');
    await expect(commsPanel).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="comms-summary-banner"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="comms-summary-range"]')).toBeVisible({ timeout: 10000 });
    await expect(commsPanel.getByText(/No outbound messages yet\.|Subject\/Summary|Status/i)).toBeVisible({ timeout: 10000 });
    await expect(commsPanel.getByText(/^outbound$/)).toBeVisible({ timeout: 10000 });
  });

  test('inbound comms route renders inbound log panel', async ({ page }) => {
    await page.goto('/agent-monitor/comms/inbound');
    await expect(page).toHaveURL(/\/agent-monitor\/comms\/inbound$/);
    const commsPanel = page.locator('[data-testid="agent-monitor-panel-comms"]');
    await expect(commsPanel).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="comms-summary-banner"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="comms-summary-range"]')).toBeVisible({ timeout: 10000 });
    await expect(commsPanel.getByText(/No inbound messages yet\.|Message preview/i)).toBeVisible({ timeout: 10000 });
    await expect(commsPanel.getByText(/^inbound$/)).toBeVisible({ timeout: 10000 });
  });
});

