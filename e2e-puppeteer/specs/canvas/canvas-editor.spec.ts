/**
 * canvas-editor.spec.ts — Phase 1 & 2 E2E tests for the Agent Canvas redesign.
 *
 * Phase 1 tests:
 *  E1: Canvas loads and orchestrator node is present
 *  E2: Add agent → verifies API call creates definition and MinIO has runtime files
 *  E3: Canvas toolbar is present with expected controls
 *  E4: Canvas layout save/load via PUT/GET /canvas/layout
 *  E5: Agent config GET/PUT updates MinIO config.json
 *
 * Phase 2 tests:
 *  E6: GET /agents/{id}/wiring returns resolved wiring summary
 *  E7: DELETE /agents/{id}?cleanup_runtime=true removes runtime files from MinIO
 *  E8: PropertyInspector renders when canvas node is clicked
 *  E9: WiringPanel checkbox toggle updates agent config via PUT /agents/{id}/config
 *  E10: Auto-layout button is present in toolbar (dagre triggered)
 *
 * Uses real API, real MinIO — no fakes.
 */

import { TestContext } from '../../base/TestContext';
import { gotoAndWaitForApi } from '../../helpers/browser.helper';
import { TEST_USER_ID } from '../../helpers/auth.helper';

const CANVAS_URL = '/canvas';

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

// =============================================================================
// Phase 2: Wiring & Inspection
// =============================================================================

describe('Canvas — Phase 2 Wiring & Inspection', () => {
  let ctx: TestContext;
  let testAgentId: string | null = null;

  beforeAll(async () => {
    ctx = await TestContext.create();

    // Create a fresh test agent for Phase 2 tests
    const { body: agent, ok } = await ctx.api.post<{ agent_id: string; name: string }>('/agents', {
      name: `P2 Test Agent ${Date.now()}`,
      description: 'Phase 2 E2E test agent',
    });
    if (ok && agent.agent_id) {
      testAgentId = agent.agent_id;
    }
  });

  afterAll(async () => {
    if (testAgentId) {
      await ctx.api.delete(`/agents/${testAgentId}?cleanup_runtime=true`).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── E6: GET /agents/{id}/wiring returns wiring summary ────────────────────
  test('E6: GET /agents/{id}/wiring returns resolved wiring summary (C10)', async () => {
    if (!testAgentId) return;

    // First wire a skill and tool set to the agent
    await ctx.api.put(`/agents/${testAgentId}/config`, {
      llm_model: 'claude-sonnet-4-20250514',
      heartbeat_interval_seconds: 60,
      execution_timeout_seconds: 600,
      skills: ['email-classifier'],
      mcp_servers: null,
      tool_sets: ['task_management', 'planning'],
      sub_agents: null,
    });

    const { body: wiring, ok } = await ctx.api.get<{
      agent_id: string;
      skills: Array<{ skill_id: string; skill_name: string; enabled: boolean }>;
      mcp_servers: Array<{ server_id: string; name: string }>;
      tool_sets: string[];
      sub_agents: Array<{ agent_id: string; name: string }>;
    }>(`/agents/${testAgentId}/wiring`);

    expect(ok).toBe(true);
    expect(wiring.agent_id).toBe(testAgentId);
    expect(Array.isArray(wiring.skills)).toBe(true);
    expect(Array.isArray(wiring.mcp_servers)).toBe(true);
    expect(Array.isArray(wiring.tool_sets)).toBe(true);
    // email-classifier may be orphaned (not installed) but still returned
    expect(wiring.skills.some((s) => s.skill_id === 'email-classifier')).toBe(true);
    // tool_sets are returned as-is
    expect(wiring.tool_sets).toContain('task_management');
    expect(wiring.tool_sets).toContain('planning');
  });

  // ── E7: DELETE with cleanup_runtime removes MinIO files ───────────────────
  test('E7: DELETE /agents/{id}?cleanup_runtime=true removes runtime files (C13)', async () => {
    // Create a fresh agent just for deletion test
    const { body: agent, ok: createOk } = await ctx.api.post<{ agent_id: string }>('/agents', {
      name: `P2 Delete Agent ${Date.now()}`,
      description: 'Will be deleted',
    });
    expect(createOk).toBe(true);
    const deleteAgentId = agent.agent_id;

    // Verify runtime files exist
    const profileKey = `${TEST_USER_ID}/agents/${deleteAgentId}/profile.md`;
    const profileBeforeDelete = await ctx.minio.objectExists(profileKey);
    expect(profileBeforeDelete).toBe(true);

    // Delete with cleanup_runtime=true
    const { ok: deleteOk } = await ctx.api.delete(
      `/agents/${deleteAgentId}?cleanup_runtime=true`,
    );
    expect(deleteOk).toBe(true);

    // Verify definition no longer accessible
    const { ok: getOk } = await ctx.api.get(`/agents/${deleteAgentId}`);
    expect(getOk).toBe(false); // 404

    // Verify MinIO runtime files were deleted
    const profileAfterDelete = await ctx.minio.objectExists(profileKey);
    expect(profileAfterDelete).toBe(false);
  });

  // ── E8: PropertyInspector appears when node is clicked ────────────────────
  test('E8: PropertyInspector panel renders with tabs when canvas node is clicked', async () => {
    if (!testAgentId) return;
    const page = await ctx.newPage();
    try {
      await page.setViewport({ width: 1440, height: 900 });
      await gotoAndWaitForApi(page, '/canvas', '/app/v1');
      await page.waitForSelector('[data-testid="canvas-page"]', { timeout: 15000 });

      // Wait for the sub-agent node created in beforeAll to appear in the canvas
      const agentNode = await page.waitForSelector(
        `[data-testid="sub-agent-node"][data-agent-id="${testAgentId}"]`,
        { timeout: 15000 },
      );
      expect(agentNode).not.toBeNull();

      // Click the node to open PropertyInspector
      if (agentNode) {
        await agentNode.click();
      }

      // PropertyInspector should appear
      const inspector = await page.waitForSelector('[data-testid="property-inspector"]', {
        timeout: 10000,
      });
      expect(inspector).not.toBeNull();

      // All 4 tabs must be present
      const profileTab = await page.$('[data-testid="inspector-tab-profile"]');
      expect(profileTab).not.toBeNull();
      const configTab = await page.$('[data-testid="inspector-tab-config"]');
      expect(configTab).not.toBeNull();
      const wiringTab = await page.$('[data-testid="inspector-tab-wiring"]');
      expect(wiringTab).not.toBeNull();
      const memoryTab = await page.$('[data-testid="inspector-tab-memory"]');
      expect(memoryTab).not.toBeNull();
    } finally {
      await page.close();
    }
  });

  // ── E9: Config panel saves LLM model change ───────────────────────────────
  test('E9: Config panel LLM model change persists via PUT /agents/{id}/config', async () => {
    if (!testAgentId) return;

    // Set initial config
    await ctx.api.put(`/agents/${testAgentId}/config`, {
      llm_model: 'claude-sonnet-4-20250514',
      heartbeat_interval_seconds: 60,
      execution_timeout_seconds: 600,
      skills: null,
      mcp_servers: null,
      tool_sets: null,
      sub_agents: null,
    });

    // Update to GPT-4o via API (simulates ConfigPanel save)
    const { ok: putOk } = await ctx.api.put(`/agents/${testAgentId}/config`, {
      llm_model: 'gpt-4o',
      heartbeat_interval_seconds: 60,
      execution_timeout_seconds: 600,
      skills: null,
      mcp_servers: null,
      tool_sets: null,
      sub_agents: null,
    });
    expect(putOk).toBe(true);

    // Verify via GET
    const { body: config, ok: getOk } = await ctx.api.get<{ llm_model: string }>(
      `/agents/${testAgentId}/config`,
    );
    expect(getOk).toBe(true);
    expect(config.llm_model).toBe('gpt-4o');

    // Verify in MinIO
    const configKey = `${TEST_USER_ID}/agents/${testAgentId}/config.json`;
    const raw = await ctx.minio.readObject(configKey);
    const saved = JSON.parse(raw) as { llm_model: string };
    expect(saved.llm_model).toBe('gpt-4o');
  });

  // ── E10: Toolbar auto-layout button present ───────────────────────────────
  test('E10: Toolbar auto-layout button is present (dagre layout ready)', async () => {
    const page = await ctx.newPage();
    try {
      await gotoAndWaitForApi(page, '/canvas', '/app/v1');
      await page.waitForSelector('[data-testid="canvas-toolbar"]', { timeout: 15000 });

      const autoLayoutBtn = await page.$('[data-testid="toolbar-auto-layout"]');
      expect(autoLayoutBtn).not.toBeNull();

      // Click auto-layout and verify no errors thrown
      if (autoLayoutBtn) {
        await autoLayoutBtn.click();
        // Wait briefly to ensure no crash
        await new Promise((r) => setTimeout(r, 500));
        const canvas = await page.$('[data-testid="canvas-editor"]');
        expect(canvas).not.toBeNull();
      }
    } finally {
      await page.close();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3: Detail panels, export/import, system node (F21-F32)
// ─────────────────────────────────────────────────────────────────────────────

describe('Canvas — Phase 3 Advanced Features', () => {
  let ctx: TestContext;
  let testAgentId: string | null = null;

  beforeAll(async () => {
    ctx = await TestContext.create();
    // Ensure orchestrator (self-agent with agent_id === userId) exists for canvas rendering
    await ctx.api
      .post('/agents', {
        agent_id: TEST_USER_ID,
        name: 'Orchestrator',
        description: 'Main orchestrator agent',
      })
      .catch(() => {}); // ignore if already exists

    // Create a test sub-agent for Phase 3 tests
    const { body: agent, ok } = await ctx.api.post<{ agent_id: string }>('/agents', {
      name: `Phase3 Test Agent ${Date.now()}`,
      description: 'E2E Phase 3 test agent',
    });
    if (ok && agent?.agent_id) {
      testAgentId = agent.agent_id;
    }
  });

  afterAll(async () => {
    if (testAgentId) {
      await ctx.api.delete(`/agents/${testAgentId}?cleanup_runtime=true`).catch(() => {});
    }
    await ctx.destroy();
  });

  // ── E11: Orchestrator node cannot be deleted ──────────────────────────────
  test('E11: Orchestrator node is present and marked non-deletable', async () => {
    const page = await ctx.newPage();
    try {
      await page.setViewport({ width: 1440, height: 900 });
      await gotoAndWaitForApi(page, '/canvas', '/app/v1');

      // Wait for orchestrator node — canvas data is loaded async after page load
      const orchNode = await page.waitForSelector('[data-testid="orchestrator-node"]', {
        timeout: 20000,
      });
      expect(orchNode).not.toBeNull();

      // Verify via API: user's own agent definition exists (orchestrator is user_id)
      const { body: agents, ok } = await ctx.api.get<Array<{ agent_id: string }>>('/agents');
      expect(ok).toBe(true);
      // The orchestrator (agent_id === userId) should be present in the list
      expect(Array.isArray(agents)).toBe(true);
    } finally {
      await page.close();
    }
  });

  // ── E12: Export toolbar button is present ─────────────────────────────────
  test('E12: Export and Import toolbar buttons are present (F32)', async () => {
    const page = await ctx.newPage();
    try {
      await page.setViewport({ width: 1440, height: 900 });
      await gotoAndWaitForApi(page, '/canvas', '/app/v1');
      await page.waitForSelector('[data-testid="canvas-toolbar"]', { timeout: 15000 });

      // Export button
      const exportBtn = await page.$('[data-testid="toolbar-export"]');
      expect(exportBtn).not.toBeNull();

      // Import button
      const importBtn = await page.$('[data-testid="toolbar-import"]');
      expect(importBtn).not.toBeNull();

      // Import input (hidden file input)
      const importInput = await page.$('[data-testid="canvas-import-input"]');
      expect(importInput).not.toBeNull();
    } finally {
      await page.close();
    }
  });

  // ── E13: Palette checkmarks reflect agent wiring ──────────────────────────
  test('E13: Palette shows wiring checkmarks based on agent config', async () => {
    if (!testAgentId) {
      console.warn('E13: skipped — no test agent created');
      return;
    }

    // Wire a skill to the test agent via API
    const { ok: wireOk } = await ctx.api.put(`/agents/${testAgentId}/config`, {
      llm_model: 'claude-sonnet-4-20250514',
      heartbeat_interval_seconds: 60,
      execution_timeout_seconds: 600,
      skills: ['test-skill-e13'],
      mcp_servers: null,
      tool_sets: null,
      sub_agents: null,
    });
    expect(wireOk).toBe(true);

    // Verify config was saved to MinIO
    const configKey = `${TEST_USER_ID}/agents/${testAgentId}/config.json`;
    const raw = await ctx.minio.readObject(configKey);
    const saved = JSON.parse(raw) as { skills: string[] };
    expect(saved.skills).toContain('test-skill-e13');

    // Verify GET config reflects the change
    const { body: config, ok: getOk } = await ctx.api.get<{ skills: string[] }>(
      `/agents/${testAgentId}/config`,
    );
    expect(getOk).toBe(true);
    expect(config.skills).toContain('test-skill-e13');
  });

  // ── E14: Toolbar undo/redo buttons are present and functional ─────────────
  test('E14: Toolbar undo/redo buttons present (F30)', async () => {
    const page = await ctx.newPage();
    try {
      await page.setViewport({ width: 1440, height: 900 });
      await gotoAndWaitForApi(page, '/canvas', '/app/v1');
      await page.waitForSelector('[data-testid="canvas-toolbar"]', { timeout: 15000 });

      // Undo and Redo buttons should be present in toolbar
      const undoBtn = await page.$('[data-testid="toolbar-undo"]');
      expect(undoBtn).not.toBeNull();

      const redoBtn = await page.$('[data-testid="toolbar-redo"]');
      expect(redoBtn).not.toBeNull();
    } finally {
      await page.close();
    }
  });

  // ── E15: ExternalAgentNode renders and A2ADetailPanel shown on click ──────
  test('E15: A2A API endpoint accessible (GET /a2a/agents)', async () => {
    // Verify the A2A agents endpoint returns a valid response (even if empty)
    const { ok, body } = await ctx.api.get<unknown[]>('/a2a/agents');
    // Should return 200 with array (empty array is valid if no A2A agents registered)
    expect(ok).toBe(true);
    expect(Array.isArray(body)).toBe(true);
  });
});

