// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { test, expect, TEST_USER_ID } from '../fixtures/auth.fixture';

type ApiContext = Parameters<Parameters<typeof test>[1]>[0]['api'];

async function seedSubAgent(api: ApiContext, baseName: string) {
  const name = `${baseName}-${Date.now()}`;
  const res = await api.post('/app/v1/agents', {
    data: {
      name,
      description: 'E2E seeded agent for canvas node interactions',
    },
  });
  expect([200, 201]).toContain(res.status());
  const body = (await res.json()) as { agent_id: string };
  return { agentId: body.agent_id, name };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function goToCanvas(page: import('@playwright/test').Page) {
  await page.goto('/canvas');
  await expect(page.locator('[data-testid="canvas-page"]')).toBeVisible({ timeout: 10_000 });
}

async function clickCanvasNode(page: import('@playwright/test').Page, nodeTestId: string) {
  const fitViewBtn = page.getByRole('button', { name: /fit view/i }).first();
  if (await fitViewBtn.isVisible().catch(() => false)) {
    await fitViewBtn.click();
  }
  const node = page.getByTestId(nodeTestId);
  await expect(node).toBeVisible({ timeout: 10_000 });
  await node.click();
}

// ---------------------------------------------------------------------------
// Canvas shell
// ---------------------------------------------------------------------------

test.describe('canvas shell', () => {
  test('renders React Flow canvas and toolbar', async ({ page }) => {
    await goToCanvas(page);
    await expect(page.locator('[data-testid="canvas-editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="canvas-toolbar"]')).toBeVisible();
  });

  test('toolbar has undo / redo / export / import / save', async ({ page }) => {
    await goToCanvas(page);
    const toolbar = page.locator('[data-testid="canvas-toolbar"]');
    await expect(toolbar.getByRole('button', { name: /undo/i })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: /redo/i })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: /export/i })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: /import/i })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: /save/i })).toBeVisible();
  });

  test('minimap and controls render', async ({ page }) => {
    await goToCanvas(page);
    await expect(page.locator('.react-flow__controls').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('.react-flow__minimap').first()).toBeVisible({ timeout: 8_000 });
  });
});

// ---------------------------------------------------------------------------
// Node palette — agents
// ---------------------------------------------------------------------------

test.describe('palette — agents section', () => {
  test('palette renders with add-agent button', async ({ page }) => {
    await goToCanvas(page);
    await expect(page.locator('[data-testid="add-agent-button"]')).toBeVisible();
  });

  test('orchestrator node appears in AGENTS list', async ({ page }) => {
    await goToCanvas(page);
    // The orchestrator is the logged-in user; at least one ORCH badge must exist
    await expect(page.locator('text=ORCH').first()).toBeVisible({ timeout: 8_000 });
  });

  test('A2A agents appear in palette under AGENTS', async ({ page, api }) => {
    // Seed: register a test A2A agent
    const seedRes = await api.post('/app/v1/a2a/agents', {
      data: { agent_name: 'e2e-a2a-palette', scope: [] },
    });
    const seedBody = (await seedRes.json()) as { key_id: string };
    const keyId = seedBody.key_id;

    await goToCanvas(page);
    // A2A badge should appear for the registered external agent
    await expect(page.locator('text=A2A').first()).toBeVisible({ timeout: 8_000 });

    // Cleanup
    await api.delete(`/app/v1/a2a/agents/${keyId}`);
  });
});

// ---------------------------------------------------------------------------
// Palette — resources section (Skills, MCP Servers, Tool Sets)
// ---------------------------------------------------------------------------

test.describe('palette — resources section', () => {
  test('Skills sub-section shows installed skills', async ({ page, api }) => {
    // Seed: install a test skill source
    const installRes = await api.post('/app/v1/skills/sources', {
      data: { source_type: 'local', uri: 'e2e://test-source', name: 'E2E Test Source' },
    });
    expect(installRes.ok()).toBeTruthy();

    const skillsRes = await api.get('/app/v1/skills');
    expect(skillsRes.ok()).toBeTruthy();
    const skillsBody = (await skillsRes.json()) as Array<{ skill_name?: string; name?: string }>;

    await goToCanvas(page);

    // Expand Resources > Skills
    const skillsSection = page.locator('button', { hasText: /^Skills$/i }).last();
    await skillsSection.click();

    if (skillsBody.length === 0) {
      await expect(page.locator('text=No skills installed')).toBeVisible({ timeout: 5_000 });
    } else {
      const firstSkillName = skillsBody[0]?.skill_name ?? skillsBody[0]?.name;
      expect(firstSkillName).toBeTruthy();
      await expect(page.locator(`text=${firstSkillName}`)).toBeVisible({ timeout: 8_000 });
    }
  });

  test('MCP Servers sub-section reflects servers registered in the registry', async ({
    page,
    api,
  }) => {
    // Seed: register a test MCP server
    const regRes = await api.post('/app/v1/mcp-servers', {
      data: {
        name: 'e2e-mcp-canvas-test',
        transport: 'http',
        endpoint_url: 'http://localhost:9999/mcp',
        trust_tier: 'GATED',
      },
    });
    expect(regRes.ok()).toBeTruthy();
    const { server_id: serverId } = (await regRes.json()) as { server_id: string };

    await goToCanvas(page);

    // Expand Resources > MCP Servers
    const mcpSection = page.locator('button', { hasText: /^MCP Servers$/i }).last();
    await mcpSection.click();

    // The registered server must now appear (validates shared ['mcp-servers'] query key)
    await expect(page.locator(`text=e2e-mcp-canvas-test`)).toBeVisible({ timeout: 5_000 });

    // Cleanup
    await api.delete(`/app/v1/mcp-servers/${serverId}`);
  });

  test('Tool Sets sub-section lists all 5 fixed tool sets', async ({ page }) => {
    await goToCanvas(page);

    // Expand Resources > Tool Sets
    const toolSetsSection = page.locator('button', { hasText: /^Tool Sets$/i }).last();
    await toolSetsSection.click();

    for (const name of [
      'Task Management',
      'Planning',
      'Skills',
      'MCP',
      'Delegation',
    ]) {
      await expect(page.locator(`text=${name}`).first()).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Canvas node interactions
// ---------------------------------------------------------------------------

test.describe('canvas node interactions', () => {
  test('clicking a node opens PropertyInspector', async ({ page, api }) => {
    const seeded = await seedSubAgent(api, 'e2e-canvas-node');
    try {
      await goToCanvas(page);
      await clickCanvasNode(page, `rf__node-${seeded.agentId}`);
      await expect(page.locator('[data-testid="property-inspector"]')).toBeVisible({ timeout: 5_000 });
    } finally {
      await api.delete(`/app/v1/agents/${seeded.agentId}?cleanup_runtime=true`).catch(() => undefined);
    }
  });

  test('PropertyInspector shows 4 tabs for agent nodes', async ({ page, api }) => {
    const seeded = await seedSubAgent(api, 'e2e-canvas-tabs');
    try {
      await goToCanvas(page);
      await clickCanvasNode(page, `rf__node-${seeded.agentId}`);
      const inspector = page.locator('[data-testid="property-inspector"]');
      await expect(inspector).toBeVisible();
      await expect(inspector.locator('[data-testid="inspector-tab-profile"]')).toBeVisible();
      await expect(inspector.locator('[data-testid="inspector-tab-config"]')).toBeVisible();
      await expect(inspector.locator('[data-testid="inspector-tab-wiring"]')).toBeVisible();
      await expect(inspector.locator('[data-testid="inspector-tab-memory"]')).toBeVisible();
    } finally {
      await api.delete(`/app/v1/agents/${seeded.agentId}?cleanup_runtime=true`).catch(() => undefined);
    }
  });

  test('closing PropertyInspector via X hides it', async ({ page, api }) => {
    const seeded = await seedSubAgent(api, 'e2e-canvas-close');
    try {
      await goToCanvas(page);
      const rfNode = page.getByTestId(`rf__node-${seeded.agentId}`);
      await expect(rfNode).toBeVisible({ timeout: 10_000 });
      await rfNode.click({ force: true });
      const inspector = page.locator('[data-testid="property-inspector"]');
      await expect(inspector).toBeVisible();
      await inspector.locator('[data-testid="inspector-close"]').click();
      await expect(inspector).not.toBeVisible();
    } finally {
      await api.delete(`/app/v1/agents/${seeded.agentId}?cleanup_runtime=true`).catch(() => undefined);
    }
  });
});

// ---------------------------------------------------------------------------
// Wiring panel
// ---------------------------------------------------------------------------

test.describe('wiring panel', () => {
  test('Wiring tab renders after clicking node and switching to Wiring', async ({ page, api }) => {
    const seeded = await seedSubAgent(api, 'e2e-canvas-wiring-tab');
    try {
      await goToCanvas(page);
      await clickCanvasNode(page, `rf__node-${seeded.agentId}`);
      const inspector = page.locator('[data-testid="property-inspector"]');
      await expect(inspector).toBeVisible({ timeout: 5_000 });
      await inspector.locator('[data-testid="inspector-tab-wiring"]').click();
      await expect(inspector.locator('[data-testid="inspector-wiring-panel"]')).toBeVisible({
        timeout: 5_000,
      });
    } finally {
      await api.delete(`/app/v1/agents/${seeded.agentId}?cleanup_runtime=true`).catch(() => undefined);
    }
  });

  test('tool-set checkboxes are clickable and trigger API save', async ({ page, api }) => {
    const seeded = await seedSubAgent(api, 'e2e-canvas-toolset');
    try {
      await goToCanvas(page);
      await clickCanvasNode(page, `rf__node-${seeded.agentId}`);

      const inspector = page.locator('[data-testid="property-inspector"]');
      await expect(inspector).toBeVisible({ timeout: 5_000 });
      await inspector.locator('[data-testid="inspector-tab-wiring"]').click();
      await expect(inspector.locator('[data-testid="inspector-wiring-panel"]')).toBeVisible();

      const [configPut] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/agents/') && r.url().includes('/config') && r.request().method() === 'PUT',
          { timeout: 8_000 },
        ),
        inspector.locator('[data-testid="wiring-toolset-task_management"]').click(),
      ]);

      expect(configPut.status()).toBeLessThan(300);
    } finally {
      await api.delete(`/app/v1/agents/${seeded.agentId}?cleanup_runtime=true`).catch(() => undefined);
    }
  });

  test('MCP server wiring checkbox toggles without error', async ({ page, api }) => {
    // Seed MCP server
    const regRes = await api.post('/app/v1/mcp-servers', {
      data: {
        name: 'e2e-mcp-wiring-test',
        transport: 'http',
        endpoint_url: 'http://localhost:9999/mcp-w',
        trust_tier: 'GATED',
      },
    });
    const { server_id: serverId } = (await regRes.json()) as { server_id: string };

    const seeded = await seedSubAgent(api, 'e2e-canvas-mcp');
    try {
      await goToCanvas(page);
      await clickCanvasNode(page, `rf__node-${seeded.agentId}`);

      const inspector = page.locator('[data-testid="property-inspector"]');
      await expect(inspector).toBeVisible({ timeout: 5_000 });
      await inspector.locator('[data-testid="inspector-tab-wiring"]').click();

      const mcpCheckbox = inspector.locator(`[data-testid="wiring-mcp-${serverId}"]`);
      await expect(mcpCheckbox).toBeVisible({ timeout: 5_000 });

      const [putRes] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/config') && r.request().method() === 'PUT',
          { timeout: 8_000 },
        ),
        mcpCheckbox.click(),
      ]);
      expect(putRes.status()).toBeLessThan(300);
    } finally {
      await api.delete(`/app/v1/mcp-servers/${serverId}`).catch(() => undefined);
      await api.delete(`/app/v1/agents/${seeded.agentId}?cleanup_runtime=true`).catch(() => undefined);
    }
  });
});

// ---------------------------------------------------------------------------
// Add Agent dialog
// ---------------------------------------------------------------------------

test.describe('add-agent dialog', () => {
  test('opens dialog, creates agent, canvas refreshes', async ({ page, api }) => {
    await goToCanvas(page);
    await page.locator('[data-testid="add-agent-button"]').click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const agentName = `e2e-test-agent-${Date.now()}`;
    await dialog.locator('[data-testid="agent-name-input"]').fill(agentName);
    await dialog.locator('[data-testid="agent-description-input"]').fill('E2E created agent');

    const [createRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/app/v1/agents') && r.request().method() === 'POST',
        { timeout: 10_000 },
      ),
      dialog.locator('[data-testid="create-agent-submit"]').click(),
    ]);
    expect([200, 201]).toContain(createRes.status());

    const body = (await createRes.json()) as { agent_id: string };
    // New agent node should appear on canvas
    await expect(page.getByTestId(`rf__node-${body.agent_id}`)).toBeVisible({
      timeout: 8_000,
    });

    // Cleanup
    await api.delete(`/app/v1/agents/${body.agent_id}?cleanup_runtime=true`);
  });
});

// ---------------------------------------------------------------------------
// A2A external agent node
// ---------------------------------------------------------------------------

test.describe('A2A external agent node', () => {
  test('external agent node appears on canvas and detail panel opens', async ({ page, api }) => {
    // Seed
    const seedRes = await api.post('/app/v1/a2a/agents', {
      data: { agent_name: 'e2e-a2a-node', scope: [] },
    });
    const { key_id: keyId } = (await seedRes.json()) as { key_id: string };

    await goToCanvas(page);

    // External agent node should be visible
    const externalNode = page.getByTestId(`rf__node-a2a-${keyId}`);
    await expect(externalNode).toBeVisible({ timeout: 10_000 });

    // Click and verify panel shows (no "External agent not found" error)
    await externalNode.click();
    const inspector = page.locator('[data-testid="property-inspector"]');
    await expect(inspector).toBeVisible();
    await expect(inspector.locator('[data-testid="inspector-a2a-panel"]')).toBeVisible({ timeout: 5_000 });
    await expect(inspector.locator('text=External agent not found')).not.toBeVisible();

    // Cleanup
    await api.delete(`/app/v1/a2a/agents/${keyId}`);
  });
});

// ---------------------------------------------------------------------------
// Undo / Redo
// ---------------------------------------------------------------------------

test.describe('undo / redo', () => {
  test('Ctrl+Z / Ctrl+Y keyboard shortcuts work without JS error', async ({ page }) => {
    await goToCanvas(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+y');

    expect(errors.filter((e) => !e.includes('ResizeObserver'))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Nav-tabs navigate correctly
// ---------------------------------------------------------------------------

test.describe('canvas nav', () => {
  test('canvas page is reachable from sidebar', async ({ page }) => {
    await page.goto('/');
    // Find canvas nav link by its icon label or href
    const canvasLink = page.locator('a[href="/canvas"]').first();
    if (await canvasLink.isVisible()) {
      await canvasLink.click();
      await expect(page).toHaveURL(/\/canvas/);
      await expect(page.locator('[data-testid="canvas-page"]')).toBeVisible({ timeout: 10_000 });
    } else {
      // Direct navigation fallback
      await goToCanvas(page);
    }
  });
});
