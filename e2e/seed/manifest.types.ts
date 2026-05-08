// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// ── Seed Manifest ─────────────────────────────────────────────────────────────
/**
 * Shape of the JSON written by seed-all.ts and read by teardown-all.ts
 * and individual spec files.  Only IDs needed for deletion are stored;
 * full response bodies are discarded after seeding.
 */

export interface SeedUser {
  member_id: string;
  email: string;
  role: string;
}

export interface SeedTask {
  id: string;
  title: string;
  task_type: string;
  parent_goal_id?: string;
  parent_task_id?: string;
}

export interface SeedEdge {
  edge_id: string;
  source_id: string;
  target_id: string;
  edge_type: string;
}

export interface SeedAgent {
  agent_id: string;
  name: string;
}

export interface SeedSkill {
  skill_id: string;
  skill_name: string;
  installed: boolean;
}

export interface SeedAuthoredSkill {
  skill_id: string;
  minio_key: string;
}

export interface SeedMcpServer {
  server_id: string;
  name: string;
}

export interface SeedA2aKey {
  key_id: string;
  agent_name: string;
  api_key: string; // One-time disclosure — stored only in manifest
}

export interface SeedConnector {
  connector_id: string;
  name: string;
}

export interface SeedManifest {
  created_at: string;
  users: SeedUser[];
  goals: SeedTask[];
  tasks: SeedTask[];
  sub_tasks: SeedTask[];
  edges: SeedEdge[];
  agents: SeedAgent[];
  skills: SeedSkill[];
  authored_skills: SeedAuthoredSkill[];
  mcp_servers: SeedMcpServer[];
  a2a_keys: SeedA2aKey[];
  connectors: SeedConnector[];
  minio_keys: string[];
}

export const EMPTY_MANIFEST: SeedManifest = {
  created_at: new Date().toISOString(),
  users: [],
  goals: [],
  tasks: [],
  sub_tasks: [],
  edges: [],
  agents: [],
  skills: [],
  authored_skills: [],
  mcp_servers: [],
  a2a_keys: [],
  connectors: [],
  minio_keys: [],
};
