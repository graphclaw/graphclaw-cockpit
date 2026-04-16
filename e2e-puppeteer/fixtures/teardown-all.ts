/**
 * teardown-all.ts — Deletes every entity created by seed-all.ts.
 *
 * Run standalone after the test suite:
 *   npx tsx e2e-puppeteer/fixtures/teardown-all.ts
 *
 * Reads the manifest from .seed-manifest.json, deletes via real API, and
 * verifies deletion in the AGE graph DB and MinIO.
 */

import * as fs from 'fs';
import { getDevToken, TEST_USER_ID } from '../helpers/auth.helper';
import { ApiClient } from '../helpers/api.helper';
import { DbClient } from '../helpers/db.helper';
import { MinioClient } from '../helpers/minio.helper';
import { loadManifest, MANIFEST_PATH } from './seed-all';

async function teardownAll(): Promise<void> {
  const manifest = loadManifest();
  if (!manifest) {
    console.log('[teardown-all] No manifest found — nothing to clean up.');
    return;
  }

  console.log(`\n[teardown-all] Cleaning up seed data (created ${manifest.created_at})`);

  const { access_token } = await getDevToken();
  const api = new ApiClient(access_token);
  const db = new DbClient();
  await db.connect();
  const minio = new MinioClient();

  let deleted = 0;
  let failed = 0;

  // ── Helper ──────────────────────────────────────────────────────────────────
  async function tryDelete(label: string, path: string): Promise<void> {
    if (!path.includes('/undefined') && !path.endsWith('/')) {
      const r = await api.delete(path);
      if (r.ok || r.status === 404) {
        deleted++;
        console.log(`  ✓ deleted ${label} (${r.status})`);
      } else {
        failed++;
        console.warn(`  ✗ failed ${label}: ${r.status}`);
      }
    }
  }

  // ── Delete in reverse-dependency order ─────────────────────────────────────

  // Edges (must go before nodes)
  console.log('[teardown-all] Removing edges...');
  for (const e of manifest.edges) {
    await tryDelete(`edge ${e.edge_id}`, `/graph/edges/${e.edge_id}`);
  }

  // Sub-tasks
  console.log('[teardown-all] Removing sub-tasks...');
  for (const s of manifest.sub_tasks) {
    await tryDelete(`sub-task ${s.id}`, `/graph/tasks/${s.id}`);
    const absent = await db.nodeAbsent(s.id).catch(() => true);
    if (absent) console.log(`    DB: node ${s.id} absent ✓`);
    else console.warn(`    DB: node ${s.id} still present ✗`);
  }

  // Tasks
  console.log('[teardown-all] Removing tasks...');
  for (const t of manifest.tasks) {
    await tryDelete(`task ${t.id}`, `/graph/tasks/${t.id}`);
    const absent = await db.nodeAbsent(t.id).catch(() => true);
    if (absent) console.log(`    DB: node ${t.id} absent ✓`);
    else console.warn(`    DB: node ${t.id} still present ✗`);
  }

  // Goals
  console.log('[teardown-all] Removing goals...');
  for (const g of manifest.goals) {
    await tryDelete(`goal ${g.id}`, `/graph/tasks/${g.id}`);
    const absent = await db.nodeAbsent(g.id).catch(() => true);
    if (absent) console.log(`    DB: node ${g.id} absent ✓`);
    else console.warn(`    DB: node ${g.id} still present ✗`);
  }

  // Agents
  console.log('[teardown-all] Removing agents...');
  for (const a of manifest.agents) {
    await tryDelete(`agent ${a.agent_id}`, `/agents/${a.agent_id}`);
  }

  // Authored skills
  console.log('[teardown-all] Removing authored skills...');
  for (const s of manifest.authored_skills) {
    await tryDelete(`authored-skill ${s.skill_id}`, `/intelligence/skills/authored/${s.skill_id}`);
    const exists = await minio.objectExists(s.minio_key).catch(() => false);
    if (!exists) console.log(`    MinIO: ${s.minio_key} absent ✓`);
    else console.warn(`    MinIO: ${s.minio_key} still present ✗`);
  }

  // Installed skills
  console.log('[teardown-all] Removing installed skills...');
  for (const s of manifest.skills) {
    await tryDelete(`skill ${s.skill_id}`, `/skills/${s.skill_id}`);
  }

  // MCP servers
  console.log('[teardown-all] Removing MCP servers...');
  for (const m of manifest.mcp_servers) {
    await tryDelete(`mcp-server ${m.server_id}`, `/mcp-servers/${m.server_id}`);
  }

  // A2A keys
  console.log('[teardown-all] Removing A2A keys...');
  for (const k of manifest.a2a_keys) {
    await tryDelete(`a2a-key ${k.key_id}`, `/a2a/agents/${k.key_id}`);
  }

  // Connectors
  console.log('[teardown-all] Removing connectors...');
  for (const c of manifest.connectors) {
    await tryDelete(`connector ${c.connector_id}`, `/admin/connectors/${c.connector_id}`);
  }

  // Members (invited users)
  console.log('[teardown-all] Removing invited members...');
  for (const u of manifest.users) {
    await tryDelete(`member ${u.member_id}`, `/admin/members/${u.member_id}`);
  }

  // MinIO objects (profile, memories)
  console.log('[teardown-all] Removing MinIO objects...');
  for (const key of manifest.minio_keys) {
    try {
      await minio.deleteObject(key);
      deleted++;
      console.log(`  ✓ MinIO: ${key}`);
    } catch {
      // Object may not exist (e.g. episodic compact didn't run)
      console.log(`  ~ MinIO: ${key} (already absent)`);
    }
  }

  await db.disconnect();

  // Remove the manifest file
  try {
    fs.unlinkSync(MANIFEST_PATH);
    console.log(`\n[teardown-all] Manifest removed.`);
  } catch {
    // Ignore
  }

  console.log(`\n[teardown-all] Done. Deleted: ${deleted}, Failed: ${failed}`);
}

export { teardownAll };

// Standalone entry point
// Run: npx tsx e2e-puppeteer/fixtures/teardown-all.ts
if (require.main === module) {
  teardownAll()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[teardown-all] Fatal error:', err);
      process.exit(1);
    });
}
