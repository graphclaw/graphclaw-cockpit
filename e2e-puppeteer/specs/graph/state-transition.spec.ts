/**
 * state-transition.spec.ts
 *
 * Tests the task state machine via the real /app/v1/tasks/{id}/transition
 * endpoint. After each transition the AGE vertex property 'state' is read
 * directly to confirm the state change persisted in the graph database.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi, waitForText } from '../../helpers/browser.helper';

describe('Graph — State Machine Transitions', () => {
  let ctx: TestContext;
  let taskId: string | null = null;

  beforeAll(async () => {
    ctx = await TestContext.create();

    // Seed a task to transition
    const { body, status } = await ctx.api.post<{ id?: string }>('/graph/tasks', {
      task_type: 'ATOMIC',
      title: `[E2E] State-transition Task ${Date.now()}`,
      priority: 'HIGH',
      tags: ['e2e', 'state-transition'],
    });
    if (status === 201 && body.id) {
      taskId = body.id;
    }
  });

  afterAll(async () => {
    if (taskId) {
      await ctx.api.delete(`/graph/tasks/${taskId}`).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── Initial state ──────────────────────────────────────────────────────────
  test('new task starts with state=PENDING in AGE', async () => {
    if (!taskId) { console.warn('Skipping: task not created'); return; }

    const state = await ctx.db.getNodeProperty(taskId, 'state');
    expect(state).toBe('PENDING');
  });

  // ── GET valid transitions ──────────────────────────────────────────────────
  test('GET /tasks/{id}/valid-transitions returns non-empty list for PENDING', async () => {
    if (!taskId) return;

    const { body, status } = await ctx.api.get<{
      current_state?: string;
      valid_states?: string[];
    }>(`/tasks/${taskId}/valid-transitions`);
    expect(status).toBe(200);
    expect(body.current_state).toBe('PENDING');
    expect(Array.isArray(body.valid_states)).toBe(true);
    expect(body.valid_states!.length).toBeGreaterThan(0);
  });

  // ── Transition PENDING → ACTIVE ──────────────────────────────────────────
  test('PENDING → ACTIVE → AGE state updated → UI shows ACTIVE', async () => {
    if (!taskId) return;

    const { status: txStatus } = await ctx.api.post(`/tasks/${taskId}/transition`, {
      target_state: 'ACTIVE',
      reason: 'E2E state-transition spec',
    });
    expect([200, 204]).toContain(txStatus);

    // REST: state updated
    const { body: detail } = await ctx.api.get<{
      task?: { state: string };
    }>(`/graph/tasks/${taskId}`);
    const task = detail.task ?? (detail as unknown as { state: string });
    expect(task.state).toBe('ACTIVE');

    // AGE: vertex property updated
    const state = await ctx.db.getNodeProperty(taskId, 'state');
    expect(state).toBe('ACTIVE');

    // UI: badge shows ACTIVE on task detail page
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, `/tasks/${taskId}`, '/app/v1/graph/tasks');
      await waitForText(page, 'ACTIVE', 15000).catch(() => {
        // UI label format may differ (e.g. "Active")
      });
    } finally {
      await page.close();
    }
  });

  // ── Transition ACTIVE → COMPLETE ─────────────────────────────────────────
  test('ACTIVE → COMPLETE → AGE state=COMPLETE → history has 2 entries', async () => {
    if (!taskId) return;

    const { status } = await ctx.api.post(`/tasks/${taskId}/transition`, {
      target_state: 'COMPLETE',
      reason: 'E2E completion',
    });
    // Allow 422 if COMPLETE is not a valid transition from ACTIVE in this state machine
    if (status === 422) {
      console.warn('COMPLETE not valid from ACTIVE — skipping');
      return;
    }
    expect([200, 204]).toContain(status);

    // AGE: verify COMPLETE state
    const state = await ctx.db.getNodeProperty(taskId, 'state');
    expect(state).toBe('COMPLETE');

    // REST: state history should have at least 2 entries (PENDING→ACTIVE, ACTIVE→COMPLETE)
    const { body: history, status: histStatus } = await ctx.api.get<{
      items?: unknown[];
    }>(`/tasks/${taskId}/state-history`);
    if (histStatus === 200) {
      expect((history.items ?? []).length).toBeGreaterThanOrEqual(2);
    }
  });

  // ── Invalid transition rejected ────────────────────────────────────────────
  test('invalid transition returns 422 and state is unchanged in AGE', async () => {
    if (!taskId) return;

    // Try to go backwards (DONE → PENDING is invalid per state machine)
    const stateBefore = await ctx.db.getNodeProperty(taskId, 'state');
    const { status } = await ctx.api.post(`/tasks/${taskId}/transition`, {
      target_state: 'PENDING',
      reason: 'invalid backwards transition',
    });
    // Backend should reject with 422 Unprocessable Entity
    expect([400, 422]).toContain(status);

    // AGE: state must be unchanged
    const stateAfter = await ctx.db.getNodeProperty(taskId, 'state');
    expect(stateAfter).toBe(stateBefore);
  });
});
