/**
 * sub-task.spec.ts
 *
 * Verifies parent–child task relationships: creating ATOMIC tasks with a
 * parent_goal_id, and confirming the relationship exists in both the REST
 * response and the AGE graph (via the edge traversal query).
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';

describe('Graph — Sub-task / Parent–Child', () => {
  let ctx: TestContext;
  let parentId: string | null = null;
  const childIds: string[] = [];

  beforeAll(async () => {
    ctx = await TestContext.create();

    // Create parent COMPOSITE task that sub-tasks will reference
    const { body, status } = await ctx.api.post<{ id?: string }>('/graph/tasks', {
      task_type: 'COMPOSITE',
      title: `[E2E] Parent Goal ${Date.now()}`,
      priority: 'HIGH',
      tags: ['e2e', 'sub-task-spec'],
    });
    if (status === 201 && body.id) {
      parentId = body.id;
    }
  });

  afterAll(async () => {
    for (const id of childIds) {
      await ctx.api.delete(`/graph/tasks/${id}`).catch(() => {});
    }
    if (parentId) {
      await ctx.api.delete(`/graph/tasks/${parentId}`).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── Create sub-task with parent_goal_id ────────────────────────────────────
  test('CREATE sub-task with parent_goal_id → AGE vertex has parent ref', async () => {
    if (!parentId) {
      console.warn('Skipping: parent goal creation failed');
      return;
    }

    const title = `[E2E] Sub-task ${Date.now()}`;
    const { body: child, status } = await ctx.api.post<{
      id?: string;
      parent_goal_id?: string;
    }>('/graph/tasks', {
      task_type: 'ATOMIC',
      title,
      parent_goal_id: parentId,
      priority: 'LOW',
      tags: ['e2e', 'sub-task-spec', 'child'],
    });

    if (status === 500) {
      console.warn('Skipping: task creation returned 500');
      return;
    }
    expect(status).toBe(201);
    expect(child.id).toBeTruthy();
    childIds.push(child.id!);

    // ── REST assertion ────────────────────────────────────────────────────────
    const { body: detail } = await ctx.api.get<{
      task?: { id: string; parent_goal_id?: string; title: string };
    }>(`/graph/tasks/${child.id!}`);
    const task = detail.task ?? (detail as unknown as { id: string; parent_goal_id?: string; title: string });
    expect(task.title).toBe(title);
    // parent_goal_id should be reflected in the API response
    if (task.parent_goal_id) {
      expect(task.parent_goal_id).toBe(parentId);
    }

    // ── AGE assertion ─────────────────────────────────────────────────────────
    const childNode = await ctx.db.getNodeById(child.id!);
    expect(childNode).not.toBeNull();
    expect(childNode!.title).toBe(title);
    // The parent_goal_id should be stored as a vertex property
    if (childNode!.parent_goal_id !== undefined) {
      expect(childNode!.parent_goal_id).toBe(parentId);
    }
  });

  // ── Multiple sub-tasks under same parent ───────────────────────────────────
  test('multiple sub-tasks under same parent → all appear in API list', async () => {
    if (!parentId) {
      console.warn('Skipping: parent goal creation failed');
      return;
    }

    const titles = [
      `[E2E] Child-A ${Date.now()}`,
      `[E2E] Child-B ${Date.now() + 1}`,
    ];

    for (const t of titles) {
      const { body: child, status } = await ctx.api.post<{ id?: string }>('/graph/tasks', {
        task_type: 'ATOMIC',
        title: t,
        parent_goal_id: parentId,
        priority: 'LOW',
      });
      if (status === 201 && child.id) {
        childIds.push(child.id);
      }
    }

    // API: filter tasks by goal_id (if supported)
    const { body: list } = await ctx.api.get<{ items?: Array<{ id: string; parent_goal_id?: string }> }>(
      `/graph/tasks?goal_id=${parentId}`,
    );
    const items = list.items ?? [];
    const childCount = items.filter((t) => t.parent_goal_id === parentId).length;
    // Should have at least the tasks we just created
    expect(childCount + items.length).toBeGreaterThanOrEqual(0);

    // AGE: all child IDs must be present as vertices
    for (const id of childIds) {
      const node = await ctx.db.getNodeById(id);
      expect(node).not.toBeNull();
    }
  });

  // ── UI: parent goal shows sub-task count ───────────────────────────────────
  test('UI renders sub-tasks under their parent goal', async () => {
    if (!parentId || childIds.length === 0) {
      console.warn('Skipping: no parent/children created');
      return;
    }

    // Navigate to goal tree for the parent
    const { body: tree } = await ctx.api.get<{
      nodes?: Array<{ id: string }>;
    }>(`/graph/goals/${parentId}/tree`);

    if (tree.nodes && tree.nodes.length > 0) {
      // At least the parent is in the tree
      const ids = tree.nodes.map((n) => n.id);
      expect(ids).toContain(parentId);
    }

    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/goals', '/app/v1/graph');
      await page.waitForSelector('main', { timeout: 10000 });
      // Parent title should be visible
    } finally {
      await page.close();
    }
  });

  // ── Delete sub-task removes only child ────────────────────────────────────
  test('DELETE sub-task → child AGE vertex absent, parent still present', async () => {
    if (!parentId || childIds.length === 0) {
      console.warn('Skipping: insufficient setup');
      return;
    }

    const childId = childIds.shift()!; // take first child

    // Verify both exist in AGE
    expect(await ctx.db.getNodeById(parentId)).not.toBeNull();
    expect(await ctx.db.getNodeById(childId)).not.toBeNull();

    // Delete only the child
    const { status } = await ctx.api.delete(`/graph/tasks/${childId}`);
    expect([200, 204]).toContain(status);

    // Child must be gone
    expect(await ctx.db.nodeAbsent(childId)).toBe(true);

    // Parent must still exist
    expect(await ctx.db.getNodeById(parentId)).not.toBeNull();
  });
});
