/**
 * seed-all.ts — Creates the full reference dataset in the live stack.
 *
 * Run standalone before the test suite:
 *   npx tsx e2e-puppeteer/fixtures/seed-all.ts
 *
 * Writes a manifest to e2e-puppeteer/fixtures/.seed-manifest.json so that
 * specs can reference stable IDs without recreating data each time.
 *
 * All calls go to the REAL FastAPI backend — no stubs.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getDevToken } from '../helpers/auth.helper';
import { ApiClient } from '../helpers/api.helper';
import { StoragePaths } from '../helpers/minio.helper';
import {
  type SeedManifest,
  EMPTY_MANIFEST,
} from './types';

const MANIFEST_PATH = path.join(__dirname, '.seed-manifest.json');

// ── Seed definitions ──────────────────────────────────────────────────────────

const GOAL_DEFS = [
  {
    task_type: 'COMPOSITE',
    title: '[SEED] Wave 1 — Core Infrastructure',
    description: 'Set up base graph and API layer for E2E testing',
    priority: 'HIGH',
    tags: ['wave-1', 'seed', 'e2e'],
  },
  {
    task_type: 'COMPOSITE',
    title: '[SEED] Wave 2 — Agent Orchestration',
    description: 'Wire agent loop and scoring pipeline for E2E testing',
    priority: 'HIGH',
    tags: ['wave-2', 'seed', 'e2e'],
  },
];

const TASK_DEFS = (goalIds: string[]) => [
  {
    task_type: 'ATOMIC',
    title: '[SEED] Implement graph node CRUD',
    description: 'CRUD operations for AGE vertices and edges',
    priority: 'HIGH',
    parent_goal_id: goalIds[0],
    tags: ['backend', 'seed'],
  },
  {
    task_type: 'ATOMIC',
    title: '[SEED] Add PostgreSQL AGE extension',
    description: 'Install and configure Apache AGE',
    priority: 'MEDIUM',
    parent_goal_id: goalIds[0],
    tags: ['infra', 'seed'],
  },
  {
    task_type: 'ATOMIC',
    title: '[SEED] Write repository layer',
    description: 'GraphStore abstract class and AGE implementation',
    priority: 'MEDIUM',
    parent_goal_id: goalIds[0],
    tags: ['backend', 'seed'],
  },
  {
    task_type: 'ATOMIC',
    title: '[SEED] Build scoring algorithm',
    description: '7-factor scoring with chain topology modifiers',
    priority: 'HIGH',
    parent_goal_id: goalIds[1],
    tags: ['scoring', 'seed'],
  },
  {
    task_type: 'ATOMIC',
    title: '[SEED] Implement state machine',
    description: 'Task lifecycle state machine with valid transitions',
    priority: 'HIGH',
    parent_goal_id: goalIds[1],
    tags: ['core', 'seed'],
  },
];

const SUB_TASK_DEFS = (parentTaskIds: string[]) => [
  {
    task_type: 'ATOMIC',
    title: '[SEED] Sub-task: unit tests for scoring',
    description: 'pytest coverage for scoring factors',
    priority: 'LOW',
    parent_goal_id: parentTaskIds[3], // "Build scoring algorithm"
    tags: ['testing', 'seed'],
  },
  {
    task_type: 'ATOMIC',
    title: '[SEED] Sub-task: document state transitions',
    description: 'Markdown docs for valid state transitions',
    priority: 'LOW',
    parent_goal_id: parentTaskIds[4], // "Implement state machine"
    tags: ['docs', 'seed'],
  },
];

const AGENT_DEFS = [
  {
    name: '[SEED] Eva — Main Orchestrator',
    description: 'Lead orchestrating agent for GraphClaw E2E reference dataset',
    config: {
      model: 'claude-sonnet-4-6',
      autonomy_level: 'HIGH',
      max_actions_per_cycle: 10,
      tools: ['graph_read', 'graph_write', 'score_read', 'brief_generate'],
      role: 'orchestrator',
    },
    tags: ['orchestrator', 'seed', 'e2e'],
  },
  {
    name: '[SEED] Cockpit Builder — Sub-agent',
    description: 'Sub-agent specialised in React feature implementation',
    config: {
      model: 'claude-sonnet-4-6',
      autonomy_level: 'MEDIUM',
      max_actions_per_cycle: 5,
      tools: ['graph_read', 'score_read'],
      role: 'builder',
      parent_agent: 'eva-orchestrator',
    },
    tags: ['builder', 'sub-agent', 'seed', 'e2e'],
  },
];

const MCP_SERVER_DEFS = [
  {
    name: '[SEED] GitHub MCP Server',
    transport: 'HTTP_SSE',
    endpoint_url: 'http://localhost:9100/mcp',
    trust_tier: 'SANDBOXED',
    scope: ['read_repos', 'create_issues'],
  },
  {
    name: '[SEED] Jira MCP Server',
    transport: 'STDIO',
    endpoint_url: 'http://localhost:9101/mcp',
    trust_tier: 'TRUSTED',
    scope: ['read_issues', 'write_issues', 'read_projects'],
  },
];

const A2A_AGENT_DEFS = [
  {
    agent_name: '[SEED] eva-to-builder',
    description: 'A2A key: Eva → cockpit-builder sub-agent delegation',
  },
  {
    agent_name: '[SEED] eva-to-tester',
    description: 'A2A key: Eva → cockpit-tester sub-agent delegation',
  },
];

const CONNECTOR_DEF = {
  name: '[SEED] Jira Cloud Connector',
  type: 'JIRA',
  config: {
    base_url: 'https://graphclaw-test.atlassian.net',
    project_key: 'GC',
    sync_interval_minutes: 30,
  },
};

// ── Intelligence / MinIO content ──────────────────────────────────────────────

const buildProfileContent = () =>
  `# Eva — Orchestrator Profile\n\nCreated by E2E seed at ${new Date().toISOString()}.\n\n` +
  `Agent: eva-main. Role: lead orchestrator.\nGraph: graphclaw.\n\n` +
  `## Capabilities\n- Graph read/write\n- Scoring evaluation\n- Briefing generation\n- Task delegation to sub-agents\n`;

const buildWorkingMemory = (goalIds: string[]) =>
  `## Current Context\n\n` +
  `Wave: 1. Active tasks: 3. Blocked: 0.\n` +
  `Goals seeded: ${goalIds.join(', ')}\n` +
  `Last action: seeded reference dataset via seed-all.ts.\n` +
  `Seed timestamp: ${new Date().toISOString()}\n`;

const buildSemanticMemory = () =>
  `## GraphClaw Architecture\n\n` +
  `PostgreSQL + Apache AGE for graph storage.\n` +
  `FastAPI gateway on :8000. React cockpit on :3000.\n` +
  `All mutations via /app/v1/ REST endpoints.\n` +
  `Object storage: MinIO S3-compatible on :9000.\n` +
  `Auth: RS256 JWT via /auth/dev-token (development).\n`;

const AUTHORED_SKILL_CONTENT =
  `# seed-task-reporter\n\n` +
  `## Description\nReports task completion metrics for E2E test validation.\n\n` +
  `## Tools\n- graph_read\n\n` +
  `## Instructions\nGiven a goal_id, return all COMPLETED tasks and their final scores.\n` +
  `Format output as a markdown table with columns: Task ID | Title | Score | Completed At.\n`;

// ── Seed runner ───────────────────────────────────────────────────────────────

async function seedAll(): Promise<SeedManifest> {
  const manifest: SeedManifest = { ...EMPTY_MANIFEST, created_at: new Date().toISOString() };

  console.log('\n[seed-all] Obtaining dev token from real backend...');
  const { access_token } = await getDevToken();
  const api = new ApiClient(access_token);
  // ── 1. Users ────────────────────────────────────────────────────────────────
  console.log('[seed-all] Creating users...');
  const userDefs = [
    { email: 'eva-orchestrator@graphclaw.test', role: 'ADMIN' },
    { email: 'builder-agent@graphclaw.test', role: 'MEMBER' },
    { email: 'viewer-user@graphclaw.test', role: 'VIEWER' },
  ];
  for (const u of userDefs) {
    const r = await api.post<{ member_id?: string; user_id?: string; id?: string }>('/admin/members/invite', u);
    if (r.ok) {
      const id = r.body.member_id ?? r.body.user_id ?? r.body.id ?? '';
      manifest.users.push({ member_id: id, email: u.email, role: u.role });
      console.log(`  ✓ user ${u.email} (${r.status})`);
    } else {
      console.warn(`  ✗ user ${u.email} → ${r.status} (skipped)`);
    }
  }

  // ── 2. Goals ─────────────────────────────────────────────────────────────────
  console.log('[seed-all] Creating goals (COMPOSITE tasks)...');
  for (const g of GOAL_DEFS) {
    const r = await api.post<{ id?: string }>('/graph/tasks', g);
    if (r.ok && r.body.id) {
      manifest.goals.push({ id: r.body.id, title: g.title, task_type: 'COMPOSITE' });
      console.log(`  ✓ goal ${r.body.id}: ${g.title}`);
    } else {
      console.warn(`  ✗ goal "${g.title}" → ${r.status}`);
    }
  }

  const goalIds = manifest.goals.map((g) => g.id);

  // ── 3. Tasks ──────────────────────────────────────────────────────────────────
  console.log('[seed-all] Creating tasks...');
  for (const t of TASK_DEFS(goalIds)) {
    const r = await api.post<{ id?: string }>('/graph/tasks', t);
    if (r.ok && r.body.id) {
      manifest.tasks.push({ id: r.body.id, title: t.title, task_type: 'ATOMIC', parent_goal_id: t.parent_goal_id });
      console.log(`  ✓ task ${r.body.id}: ${t.title}`);
    } else {
      console.warn(`  ✗ task "${t.title}" → ${r.status}`);
    }
  }

  const taskIds = manifest.tasks.map((t) => t.id);

  // ── 4. Sub-tasks ──────────────────────────────────────────────────────────────
  console.log('[seed-all] Creating sub-tasks...');
  for (const s of SUB_TASK_DEFS(taskIds)) {
    const r = await api.post<{ id?: string }>('/graph/tasks', s);
    if (r.ok && r.body.id) {
      manifest.sub_tasks.push({ id: r.body.id, title: s.title, task_type: 'ATOMIC', parent_task_id: s.parent_goal_id });
      console.log(`  ✓ sub-task ${r.body.id}: ${s.title}`);
    } else {
      console.warn(`  ✗ sub-task "${s.title}" → ${r.status}`);
    }
  }

  // ── 5. Edges ───────────────────────────────────────────────────────────────────
  console.log('[seed-all] Creating dependency edges...');
  const edgeDefs = taskIds.length >= 3
    ? [
        { source_id: taskIds[0], target_id: taskIds[2], edge_type: 'DEPENDS_ON' },
        { source_id: taskIds[2], target_id: taskIds[3], edge_type: 'DEPENDS_ON' },
        { source_id: taskIds[3], target_id: taskIds[4], edge_type: 'RELATES_TO' },
      ]
    : [];

  for (const e of edgeDefs) {
    const r = await api.post<{ id?: string; edge_id?: string }>('/graph/edges', e);
    if (r.ok) {
      const edgeId = r.body.edge_id ?? r.body.id ?? '';
      manifest.edges.push({ edge_id: edgeId, ...e });
      console.log(`  ✓ edge ${e.source_id} --[${e.edge_type}]--> ${e.target_id}`);
    } else {
      console.warn(`  ✗ edge ${e.source_id} → ${e.target_id}: ${r.status}`);
    }
  }

  // ── 6. Agents ──────────────────────────────────────────────────────────────────
  console.log('[seed-all] Creating agents...');
  for (const a of AGENT_DEFS) {
    const r = await api.post<{ agent_id?: string; id?: string }>('/agents', a);
    if (r.ok) {
      const agentId = r.body.agent_id ?? r.body.id ?? '';
      manifest.agents.push({ agent_id: agentId, name: a.name });
      console.log(`  ✓ agent ${agentId}: ${a.name}`);
    } else {
      console.warn(`  ✗ agent "${a.name}" → ${r.status}`);
    }
  }

  // ── 7. Skills (install from registry) ─────────────────────────────────────────
  console.log('[seed-all] Installing skills from registry...');
  const skillInstalls = [
    { skill_name: 'graph-query', source_uri: 'graphclaw://builtin/graph-query', version: '1.0.0' },
    { skill_name: 'score-explain', source_uri: 'graphclaw://builtin/score-explain', version: '1.0.0' },
  ];
  for (const s of skillInstalls) {
    const r = await api.post<{ skill_id?: string; id?: string }>('/skills/install', s);
    if (r.ok) {
      const skillId = r.body.skill_id ?? r.body.id ?? s.skill_name;
      manifest.skills.push({ skill_id: skillId, skill_name: s.skill_name, installed: true });
      console.log(`  ✓ skill ${skillId}: ${s.skill_name}`);
    } else {
      console.warn(`  ✗ skill "${s.skill_name}" → ${r.status}`);
    }
  }

  // ── 8. Authored skill (MinIO) ──────────────────────────────────────────────────
  console.log('[seed-all] Creating authored skill...');
  const authoredSkillId = 'seed-task-reporter';
  const ar = await api.post<{ skill_id?: string }>('/intelligence/skills/authored', {
    skill_id: authoredSkillId,
    content: AUTHORED_SKILL_CONTENT,
  });
  if (ar.ok) {
    const key = StoragePaths.authoredSkill(TEST_USER_ID, authoredSkillId);
    manifest.authored_skills.push({ skill_id: authoredSkillId, minio_key: key });
    manifest.minio_keys.push(key);
    console.log(`  ✓ authored skill ${authoredSkillId} → MinIO: ${key}`);
  } else {
    console.warn(`  ✗ authored skill → ${ar.status}`);
  }

  // ── 9. MCP Servers ─────────────────────────────────────────────────────────────
  console.log('[seed-all] Registering MCP servers...');
  for (const m of MCP_SERVER_DEFS) {
    const r = await api.post<{ server_id?: string; id?: string }>('/mcp-servers', m);
    if (r.ok) {
      const serverId = r.body.server_id ?? r.body.id ?? '';
      manifest.mcp_servers.push({ server_id: serverId, name: m.name });
      console.log(`  ✓ MCP server ${serverId}: ${m.name}`);
    } else {
      console.warn(`  ✗ MCP server "${m.name}" → ${r.status}`);
    }
  }

  // ── 10. A2A Keys ───────────────────────────────────────────────────────────────
  console.log('[seed-all] Generating A2A keys...');
  for (const a of A2A_AGENT_DEFS) {
    const r = await api.post<{ key_id?: string; api_key?: string }>('/a2a/agents', a);
    if (r.ok) {
      manifest.a2a_keys.push({
        key_id: r.body.key_id ?? '',
        agent_name: a.agent_name,
        api_key: r.body.api_key ?? '',
      });
      console.log(`  ✓ A2A key ${r.body.key_id}: ${a.agent_name}`);
    } else {
      console.warn(`  ✗ A2A key "${a.agent_name}" → ${r.status}`);
    }
  }

  // ── 11. Connectors ─────────────────────────────────────────────────────────────
  console.log('[seed-all] Creating connectors...');
  const cr = await api.post<{ connector_id?: string; id?: string }>('/admin/connectors', CONNECTOR_DEF);
  if (cr.ok) {
    const connId = cr.body.connector_id ?? cr.body.id ?? '';
    manifest.connectors.push({ connector_id: connId, name: CONNECTOR_DEF.name });
    console.log(`  ✓ connector ${connId}: ${CONNECTOR_DEF.name}`);
  } else {
    console.warn(`  ✗ connector → ${cr.status}`);
  }

  // ── 12. Intelligence / MinIO content ───────────────────────────────────────────
  console.log('[seed-all] Writing intelligence content to MinIO...');

  // Agent profile
  const profileRes = await api.put(`/intelligence/agents/${TEST_USER_ID}/profile`, {
    content: buildProfileContent(),
  });
  if (profileRes.ok) {
    const key = StoragePaths.agentProfile(TEST_USER_ID);
    manifest.minio_keys.push(key);
    console.log(`  ✓ profile → MinIO: ${key}`);
  }

  // Working memory
  const wmRes = await api.put(`/intelligence/agents/${TEST_USER_ID}/memory/working`, {
    content: buildWorkingMemory(goalIds),
  });
  if (wmRes.ok) {
    const key = StoragePaths.workingMemory(TEST_USER_ID);
    manifest.minio_keys.push(key);
    console.log(`  ✓ working memory → MinIO: ${key}`);
  }

  // Semantic memory
  const smRes = await api.put(
    `/intelligence/agents/${TEST_USER_ID}/memory/semantic/graphclaw-architecture`,
    { content: buildSemanticMemory() },
  );
  if (smRes.ok) {
    const key = StoragePaths.semanticTopic(TEST_USER_ID, 'graphclaw-architecture');
    manifest.minio_keys.push(key);
    console.log(`  ✓ semantic memory → MinIO: ${key}`);
  }

  // Episodic memory via compact
  const compactRes = await api.post(
    `/intelligence/agents/${TEST_USER_ID}/memory/compact`,
    { summary: 'Wave 1 complete: 3 tasks finished, all tests passing.', session_label: 'wave-1-complete' },
  );
  if (compactRes.ok) {
    const key = StoragePaths.episodicEntry(TEST_USER_ID, 'wave-1-complete');
    manifest.minio_keys.push(key);
    console.log(`  ✓ episodic memory → MinIO: ${key}`);
  }

  // ── Write manifest ─────────────────────────────────────────────────────────────
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n[seed-all] Manifest written to ${MANIFEST_PATH}`);
  console.log(`[seed-all] Summary:`);
  console.log(`  Users:     ${manifest.users.length}`);
  console.log(`  Goals:     ${manifest.goals.length}`);
  console.log(`  Tasks:     ${manifest.tasks.length}`);
  console.log(`  Sub-tasks: ${manifest.sub_tasks.length}`);
  console.log(`  Edges:     ${manifest.edges.length}`);
  console.log(`  Agents:    ${manifest.agents.length}`);
  console.log(`  Skills:    ${manifest.skills.length} installed, ${manifest.authored_skills.length} authored`);
  console.log(`  MCP:       ${manifest.mcp_servers.length}`);
  console.log(`  A2A keys:  ${manifest.a2a_keys.length}`);
  console.log(`  Connectors:${manifest.connectors.length}`);
  console.log(`  MinIO keys:${manifest.minio_keys.length}`);

  return manifest;
}

// ── Manifest loader ────────────────────────────────────────────────────────────
/**
 * Load the seed manifest written by seed-all.ts.
 * Returns null if the manifest doesn't exist — callers should handle this
 * gracefully by seeding inline.
 */
export function loadManifest(): SeedManifest | null {
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw) as SeedManifest;
  } catch {
    return null;
  }
}

export { seedAll, MANIFEST_PATH };

// ── Standalone entry point ─────────────────────────────────────────────────────
// Run: npx tsx e2e-puppeteer/fixtures/seed-all.ts
if (require.main === module) {
  seedAll()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed-all] Fatal error:', err);
      process.exit(1);
    });
}
