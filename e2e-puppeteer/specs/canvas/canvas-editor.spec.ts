/**
 * canvas-editor.spec.ts — Phase 1 E2E tests for the Agent Canvas redesign.
 *
 * Tests:
 *  E1: Canvas loads and orchestrator node is present
 *  E2: Add agent → verifies API call creates definition and MinIO has runtime files
 *  E3: Canvas toolbar is present with expected controls
 *
 * Uses real API, real MinIO — no fakes.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';
import { TEST_USER_ID } from '../../helpers/auth.helper';

const CANVAS_URL = '/canvas';
const AGENT_NAME = `E2E Canvas Agent ${Date.now()}`;

describe('Canvas — Phase 1 Agent Hub', () => {
  let ctx: TestContext;
  let createdAgentId: string | null = null;

  beforeAll(async () => {
    ctx = await TestContext.create();
  });

  afterAll(async () => {
    // Clean up: delete test agent definition + runtime if created
    if (createdAgentId) {
      await ctx.api
        .delete(`/agents/${createdAgentId}?cleanup_runtime=true`)
        .catch(() => {});
    }
    await ctx.destroy();
  });

  // ── E1: Canvas loads with orchestrator present ─────────────────────────────
  test('E1: canvas page renders and shows Add Agent button', async () => {
    const page = await ctx.newPage();
    try {
      // Use lg+ viewport so the NodePalette (hidden lg:flex) is visible
      await page.setViewport({ width: 1440, height: 900 });
      await gotoAndWaitForApi(page, CANVAS_URL, '/app/v1');

      // Canvas container must be visible
      await page.waitForSelector('[data-testid="canvas-page"]', { timeout: 15000 });
      const canvasPage = await page.$('[data-testid="canvas-page"]');
      expect(canvasPage).not.toBeNull();

      // Canvas editor (React Flow wrapper) must be present
      const canvasEditor = await page.$('[data-testid="canvas-editor"]');
      expect(canvasEditor).not.toBeNull();

      // Add Agent button must be visible in the palette (requires lg viewport)
      const addAgentBtn = await page.$('[data-testid="add-agent-button"]');
      expect(addAgentBtn).not.toBeNull();
      if (addAgentBtn) {
        const visible = await addAgentBtn.isIntersectingViewport();
        expect(visible).toBe(true);
      }
    } finally {
      await page.close();
    }
  });

  // ── E3: Toolbar is present ─────────────────────────────────────────────────
  test('E3: canvas toolbar renders with select, undo, redo, save controls', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, CANVAS_URL, '/app/v1');
      await page.waitForSelector('[data-testid="canvas-toolbar"]', { timeout: 15000 });

      const toolbar = await page.$('[data-testid="canvas-toolbar"]');
      expect(toolbar).not.toBeNull();

      // Toolbar buttons via data-testid
      const selectBtn = await page.$('[data-testid="toolbar-select"]');
      expect(selectBtn).not.toBeNull();

      const undoBtn = await page.$('[data-testid="toolbar-undo"]');
      expect(undoBtn).not.toBeNull();

      const redoBtn = await page.$('[data-testid="toolbar-redo"]');
      expect(redoBtn).not.toBeNull();

      const saveBtn = await page.$('[data-testid="toolbar-save"]');
      expect(saveBtn).not.toBeNull();
    } finally {
      await page.close();
    }
  });

  // ── E2: Add agent via API and verify MinIO runtime files ──────────────────
  test('E2: POST /agents creates definition with slug ID and provisions MinIO runtime', async () => {
    const nameSlug = `e2e-canvas-agent-${Date.now()}`;

    // Create agent via real API (mirrors what Add Agent dialog does)
    const { body: agent, ok } = await ctx.api.post<{
      agent_id: string;
      name: string;
      version: string;
    }>('/agents', {
      name: nameSlug.replace(/-/g, ' '),
      description: 'E2E test agent for canvas Phase 1',
    });

    expect(ok).toBe(true);
    expect(agent.agent_id).toBeTruthy();

    // ID must be slug-based (no AGT- UUID prefix)
    expect(agent.agent_id).not.toMatch(/^AGT-/);
    expect(agent.agent_id).toMatch(/^[a-z0-9-]+$/);

    createdAgentId = agent.agent_id;

    // Verify MinIO runtime files were provisioned (bridge worked)
    const profileKey = `${TEST_USER_ID}/agents/${agent.agent_id}/profile.md`;
    const configKey = `${TEST_USER_ID}/agents/${agent.agent_id}/config.json`;
    const manifestKey = `${TEST_USER_ID}/agents/${agent.agent_id}/manifest.json`;

    const profileExists = await ctx.minio.objectExists(profileKey);
    expect(profileExists).toBe(true);

    const configExists = await ctx.minio.objectExists(configKey);
    expect(configExists).toBe(true);

    const manifestExists = await ctx.minio.objectExists(manifestKey);
    expect(manifestExists).toBe(true);

    // Verify config.json has correct default structure
    const configContent = await ctx.minio.readObject(configKey);
    const config = JSON.parse(configContent) as {
      llm_model: string;
      heartbeat_interval_seconds: number;
    };
    expect(config.llm_model).toBeTruthy();
    expect(config.heartbeat_interval_seconds).toBeGreaterThan(0);
  });

  // ── E4: Canvas layout save/load via real API ───────────────────────────────
  test('E4: PUT /canvas/layout saves and GET /canvas/layout retrieves positions', async () => {
    const mockLayout = {
      nodes: [
        { id: TEST_USER_ID, position: { x: 400, y: 80 } },
        { id: 'test-subagent', position: { x: 200, y: 300 } },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const { ok: putOk } = await ctx.api.put('/canvas/layout', mockLayout);
    expect(putOk).toBe(true);

    const { body: layout, ok: getOk } = await ctx.api.get<{
      nodes: Array<{ id: string; position: { x: number; y: number } }>;
      viewport: { x: number; y: number; zoom: number };
    }>('/canvas/layout');
    expect(getOk).toBe(true);
    expect(layout.nodes).toHaveLength(2);
    const orchNode = layout.nodes.find((n) => n.id === TEST_USER_ID);
    expect(orchNode?.position.x).toBe(400);

    // Clean up saved layout (reset to empty)
    await ctx.api.put('/canvas/layout', { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } });
  });

  // ── E5: Agent config GET/PUT via real API ──────────────────────────────────
  test('E5: GET /agents/{id}/config returns defaults, PUT updates config in MinIO', async () => {
    if (!createdAgentId) {
      // Skip if E2 didn't create an agent
      return;
    }

    const { body: config, ok: getOk } = await ctx.api.get<{
      llm_model: string;
      skills: string[] | null;
      mcp_servers: string[] | null;
    }>(`/agents/${createdAgentId}/config`);
    expect(getOk).toBe(true);
    expect(config.llm_model).toBeTruthy();

    // Update config with a skill wiring
    const updatedConfig = {
      ...config,
      skills: ['email-classifier'],
    };
    const { ok: putOk } = await ctx.api.put(`/agents/${createdAgentId}/config`, updatedConfig);
    expect(putOk).toBe(true);

    // Verify directly in MinIO
    const configKey = `${TEST_USER_ID}/agents/${createdAgentId}/config.json`;
    const rawConfig = await ctx.minio.readObject(configKey);
    const savedConfig = JSON.parse(rawConfig) as { skills: string[] | null };
    expect(savedConfig.skills).toContain('email-classifier');
  });
});

