// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0

export type A2aApiPlane = 'app' | 'runtime';

export interface CanonicalA2aAgent {
  key_id: string;
  agent_name: string;
  description: string;
  revoked: boolean;
  agent_id?: string;
  endpoint?: string;
  capabilities?: string[];
  trust_status?: string;
}

export interface CanonicalA2aCreateResponse {
  key_id: string;
  agent_name: string;
  api_key: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value.filter((entry): entry is string => typeof entry === 'string');
  return items.length > 0 ? items : undefined;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function resolveA2aApiPlane(): A2aApiPlane {
  const raw = import.meta.env.VITE_A2A_API_PLANE;
  return raw === 'runtime' ? 'runtime' : 'app';
}

export function getA2aAgentsPath(plane = resolveA2aApiPlane()): string {
  return plane === 'runtime' ? '/api/v1/a2a/agents' : '/app/v1/a2a/agents';
}

export function getA2aAgentPath(keyId: string, plane = resolveA2aApiPlane()): string {
  return `${getA2aAgentsPath(plane)}/${keyId}`;
}

function normalizeA2aAgentEntry(entry: unknown): CanonicalA2aAgent | null {
  const row = asRecord(entry);
  if (!row) {
    return null;
  }

  const keyId =
    asString(row.key_id) || asString(row.resource_node_id) || asString(row.agent_id);
  if (!keyId) {
    return null;
  }

  return {
    key_id: keyId,
    agent_name: asString(row.agent_name) || asString(row.name) || keyId,
    description: asString(row.description),
    revoked: asBoolean(row.revoked, false),
    agent_id: asString(row.agent_id) || keyId,
    endpoint: asString(row.endpoint) || undefined,
    capabilities: asStringArray(row.capabilities),
    trust_status: asString(row.trust_status) || undefined,
  };
}

export function normalizeA2aAgentsResponse(payload: unknown): CanonicalA2aAgent[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(asRecord(payload)?.agents)
      ? ((asRecord(payload)?.agents as unknown[]) ?? [])
      : [];

  const agents: CanonicalA2aAgent[] = [];
  for (const row of rows) {
    const normalized = normalizeA2aAgentEntry(row);
    if (normalized) {
      agents.push(normalized);
    }
  }
  return agents;
}

export function normalizeA2aCreateResponse(payload: unknown): CanonicalA2aCreateResponse {
  const row = asRecord(payload) ?? {};

  const keyId =
    asString(row.key_id) || asString(row.resource_node_id) || asString(row.agent_id);
  const agentName = asString(row.agent_name) || asString(row.name) || keyId;
  const apiKey = asString(row.api_key) || asString(row.plaintext_key) || asString(row.new_api_key);

  return {
    key_id: keyId,
    agent_name: agentName,
    api_key: apiKey,
  };
}
