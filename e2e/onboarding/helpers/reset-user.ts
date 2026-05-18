// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * Reset a user by email — wipes their MinIO objects and graph nodes.
 * Used as the beforeAll precondition for the live onboarding test so a
 * clean first-login experience is guaranteed.
 */
import type { DbClient } from '../../helpers/db.js';
import type { MinioClient } from '../../helpers/minio.js';

function escapeCypherString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Find a user's ID by email address in the graph DB.
 * Returns null if no matching UserNode exists.
 */
export async function findUserIdByEmail(
  db: DbClient,
  email: string,
): Promise<string | null> {
  const esc = escapeCypherString(email);
  const result = await db.runCypher(
    `MATCH (u:UserNode {email: '${esc}'}) RETURN u.id AS id`,
    ['id agtype'],
  );
  if (!result.rows.length || result.rows[0].id == null) return null;
  // AGE returns string values quoted: "USER-abc-123" → strip outer quotes
  const raw = String(result.rows[0].id);
  return raw.replace(/^"|"$/g, '');
}

/**
 * Delete all MinIO objects under `{userId}/` prefix.
 */
export async function wipeUserMinIO(
  minio: MinioClient,
  userId: string,
): Promise<number> {
  const keys = await minio.listObjects(`${userId}/`);
  for (const key of keys) {
    await minio.deleteObject(key);
  }
  return keys.length;
}

/**
 * Delete WorkspaceNodes owned by userId, then the UserNode itself.
 */
export async function wipeUserGraph(
  db: DbClient,
  userId: string,
): Promise<void> {
  const esc = escapeCypherString(userId);
  // Delete owned workspaces first, RETURN 0 to satisfy AGE's column requirement
  await db.runCypher(
    `MATCH (u:UserNode {id: '${esc}'})-[:OWNS]->(w:WorkspaceNode) DETACH DELETE w RETURN 0`,
    ['r agtype'],
  );
  // Delete the UserNode and all remaining edges
  await db.runCypher(
    `MATCH (u:UserNode {id: '${esc}'}) DETACH DELETE u RETURN 0`,
    ['r agtype'],
  );
}

/**
 * Full user reset: find by email → wipe MinIO → wipe graph.
 * Safe to call when the user doesn't exist (no-op).
 */
export async function resetUserByEmail(
  db: DbClient,
  minio: MinioClient,
  email: string,
): Promise<{ userId: string | null; minioObjectsDeleted: number }> {
  const userId = await findUserIdByEmail(db, email);
  if (!userId) {
    return { userId: null, minioObjectsDeleted: 0 };
  }

  const minioObjectsDeleted = await wipeUserMinIO(minio, userId);
  await wipeUserGraph(db, userId);

  return { userId, minioObjectsDeleted };
}
