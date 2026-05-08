// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * teardown-all.ts — Deletes every entity created by seed-all.ts.
 *
 * Run standalone after the E2E suite:
 *   npx tsx e2e/seed/teardown-all.ts
 *
 * Reads the manifest from .seed-manifest.json, deletes via real API,
 * and verifies deletion in the AGE graph DB and MinIO.
 */

import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { getDevToken, ApiClient } from '../helpers/api.js';
import { DbClient } from '../helpers/db.js';
import { MinioClient } from '../helpers/minio.js';
import { loadManifest, MANIFEST_PATH } from './seed-all.js';

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

  async function tryDelete(label: string, deletePath: string): Promise<void> {
    if (!deletePath.includes('/undefined') && !deletePath.endsWith('/')) {
      const r = await api.delete(deletePath);
      if (r.ok || r.status === 404) {
        deleted++;
        console.log(`  ✓ deleted ${label} (${r.status})`);
      } else {
        failed++;
        console.warn(`  ✗ failed ${label}: ${r.status}`);
      }
    }
  }

  // Delete in reverse-dependency order

  console.log('[teardown-all] Removing edges...');
  for (const e of manifest.edges) {
    await tryDelete(`edge ${e.edge_id}`, `/graph/edges/${e.edge_id}`);
  }

  console.log('[teardown-all] Removing sub-tasks...');
  for (const s of manifest.sub_tasks) {
    await tryDelete(`sub-task ${s.id}`, `/graph/tasks/${s.id}`);
    const absent = await db.nodeAbsent(s.id).catch(() => true);
    if (absent) console.log(`    DB: node ${s.id} absent ✓`);
    else console.warn(`    DB: node ${s.id} still present ✗`);
  }

  console.log('[teardown-all] Removing tasks...');
  for (const t of manifest.tasks) {
    await tryDelete(`task ${t.id}`, `/graph/tasks/${t.id}`);
    const absent = await db.nodeAbsent(t.id).catch(() => true);
    if (absent) console.log(`    DB: node ${t.id} absent ✓`);
    else console.warn(`    DB: node ${t.id} still present ✗`);
  }

  console.log('[teardown-all] Removing goals...');
  for (const g of manifest.goals) {
    await tryDelete(`goal ${g.id}`, `/graph/tasks/${g.id}`);
    const absent = await db.nodeAbsent(g.id).catch(() => true);
    if (absent) console.log(`    DB: node ${g.id} absent ✓`);
    else console.warn(`    DB: node ${g.id} still present ✗`);
  }

  console.log('[teardown-all] Removing agents...');
  for (const a of manifest.agents) {
    await tryDelete(`agent ${a.agent_id}`, `/agents/${a.agent_id}`);
  }

  console.log('[teardown-all] Removing authored skills...');
  for (const s of manifest.authored_skills) {
    await tryDelete(`authored-skill ${s.skill_id}`, `/intelligence/skills/authored/${s.skill_id}`);
    const exists = await minio.objectExists(s.minio_key).catch(() => false);
    if (!exists) console.log(`    MinIO: ${s.minio_key} absent ✓`);
    else console.warn(`    MinIO: ${s.minio_key} still present ✗`);
  }

  console.log('[teardown-all] Removing installed skills...');
  for (const s of manifest.skills) {
    await tryDelete(`skill ${s.skill_id}`, `/skills/${s.skill_id}`);
  }

  console.log('[teardown-all] Removing MCP servers...');
  for (const m of manifest.mcp_servers) {
    await tryDelete(`mcp-server ${m.server_id}`, `/mcp-servers/${m.server_id}`);
  }

  console.log('[teardown-all] Removing A2A keys...');
  for (const k of manifest.a2a_keys) {
    await tryDelete(`a2a-key ${k.key_id}`, `/a2a/agents/${k.key_id}`);
  }

  console.log('[teardown-all] Removing connectors...');
  for (const c of manifest.connectors) {
    await tryDelete(`connector ${c.connector_id}`, `/admin/connectors/${c.connector_id}`);
  }

  console.log('[teardown-all] Removing MinIO objects...');
  for (const key of manifest.minio_keys) {
    try {
      await minio.deleteObject(key);
      deleted++;
      console.log(`  ✓ MinIO: ${key}`);
    } catch {
      console.log(`  ~ MinIO: ${key} (already absent)`);
    }
  }

  await db.disconnect();

  try {
    fs.unlinkSync(MANIFEST_PATH);
    console.log('\n[teardown-all] Manifest removed.');
  } catch { /* ignore */ }

  console.log(`\n[teardown-all] Done. Deleted: ${deleted}, Failed: ${failed}`);
}

export { teardownAll };

// Standalone entry point: npx tsx e2e/seed/teardown-all.ts
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  teardownAll()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[teardown-all] Fatal error:', err);
      process.exit(1);
    });
}
