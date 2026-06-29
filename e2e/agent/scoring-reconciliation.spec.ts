// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-E-SCO-W50-001 — Scoring Reconciliation Matrix (Logs + Graph Persistence)
 *
 * Scenario: This suite creates deterministic scoring tasks, triggers live scoring
 * cycles, and reconciles expected weighted scores against persisted TaskNode scoring.
 * It also verifies structured scoring event ordering from MinIO logs and scoring
 * weight persistence behavior after settings updates.
 *
 * PRD: docs/prd/08-explainability.md, docs/prd/05-settings-panel.md, docs/prd/13-chat-interface.md
 * Build wave: W50
 * Layer: L5 E2E
 * Owner: frontend-team
 * Last reviewed: 2026-06-28
 *
 * Cases covered:
 *  - 10 baseline scenarios are created via multi-turn chat and reconciled via DB
 *  - Chat plan/confirm flow is validated before task creation execution
 *  - Existing task and new tasks reflect updated scoring weights after settings patch
 *  - 4 post-update scenarios reconcile with updated weights and MinIO weight artifact
 *  - Scoring event sequence is asserted from backend container logs and MinIO per task
 */

import type { APIRequestContext, Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { test, expect, TEST_USER_ID } from '../fixtures/test';
import type { DbClient } from '../helpers/db.js';
import { StoragePaths, type MinioClient } from '../helpers/minio.js';

type Weights = {
  W1_timeline: number;
  W2_dependencies: number;
  W3_critical_path: number;
  W4_blocker: number;
  W5_override: number;
  W6_resource_risk: number;
  W7_constraint: number;
};

type BlockerType = 'NONE' | 'SOFT' | 'HARD';

type Scenario = {
  id: string;
  deadlineDays: number;
  directDependents: number;
  onCriticalPath: boolean;
  blockerType: BlockerType;
};

type ChatHistoryMessage = {
  message_id?: string;
  role?: string;
  content?: string;
};

type ScoreBlock = {
  timeline_urgency: number;
  dependency_weight: number;
  critical_path: number;
  blocker: number;
  human_override: number;
  resource_risk: number;
  constraint_pressure: number;
  computed_priority: number;
  last_scored_at: string | null;
  W1_timeline_weight: number;
  W2_dependencies_weight: number;
  W3_critical_path_weight: number;
  W4_blocker_weight: number;
  W5_override_weight: number;
  W6_resource_risk_weight: number;
  W7_constraint_weight: number;
};

type TaskEvent = {
  timestamp: number;
  eventType: string;
  finalScore: number | null;
  source: 'minio' | 'container';
};

const DAY_MS = 86_400_000;

const DEFAULT_WEIGHTS: Weights = {
  W1_timeline: 0.25,
  W2_dependencies: 0.2,
  W3_critical_path: 0.2,
  W4_blocker: 0.15,
  W5_override: 0.1,
  W6_resource_risk: 0.05,
  W7_constraint: 0.05,
};

const UPDATED_WEIGHTS: Weights = {
  W1_timeline: 0.4,
  W2_dependencies: 0.2,
  W3_critical_path: 0.15,
  W4_blocker: 0.1,
  W5_override: 0.08,
  W6_resource_risk: 0.04,
  W7_constraint: 0.03,
};

const SCORING_SEQUENCE = [
  'scoring.topology.suppression',
  'scoring.topology.rollup',
  'factor.w1.timeline',
  'factor.w2.dependencies',
  'factor.w3.critical_path',
  'factor.w4.blocker',
  'factor.w5.override',
  'factor.w6.resource_risk',
  'factor.w7.constraint',
  'scoring.final.computed',
  'scoring.persist.success',
  'scoring.queue.rank_assigned',
];

const BACKEND_LOG_CONTAINER =
  process.env.BACKEND_LOG_CONTAINER ?? process.env.GATEWAY_CONTAINER ?? '';
const RECON_ONLY_SCENARIO = process.env.RECON_ONLY_SCENARIO?.trim() ?? '';

const BASELINE_SCENARIOS: Scenario[] = [
  { id: 'baseline-01', deadlineDays: 20, directDependents: 0, onCriticalPath: false, blockerType: 'NONE' },
  { id: 'baseline-02', deadlineDays: 10, directDependents: 0, onCriticalPath: false, blockerType: 'NONE' },
  { id: 'baseline-03', deadlineDays: 5, directDependents: 0, onCriticalPath: false, blockerType: 'NONE' },
  { id: 'baseline-04', deadlineDays: 2, directDependents: 0, onCriticalPath: false, blockerType: 'NONE' },
  { id: 'baseline-05', deadlineDays: -1, directDependents: 0, onCriticalPath: false, blockerType: 'NONE' },
  { id: 'baseline-06', deadlineDays: 20, directDependents: 1, onCriticalPath: false, blockerType: 'NONE' },
  { id: 'baseline-07', deadlineDays: 20, directDependents: 2, onCriticalPath: false, blockerType: 'NONE' },
  { id: 'baseline-08', deadlineDays: 10, directDependents: 0, onCriticalPath: true, blockerType: 'NONE' },
  { id: 'baseline-09', deadlineDays: 10, directDependents: 0, onCriticalPath: false, blockerType: 'SOFT' },
  { id: 'baseline-10', deadlineDays: 10, directDependents: 0, onCriticalPath: false, blockerType: 'HARD' },
];

const UPDATED_SCENARIOS: Scenario[] = [
  { id: 'updated-01', deadlineDays: 2, directDependents: 1, onCriticalPath: false, blockerType: 'NONE' },
  { id: 'updated-02', deadlineDays: 5, directDependents: 2, onCriticalPath: false, blockerType: 'SOFT' },
  { id: 'updated-03', deadlineDays: 10, directDependents: 0, onCriticalPath: true, blockerType: 'NONE' },
  { id: 'updated-04', deadlineDays: -1, directDependents: 1, onCriticalPath: true, blockerType: 'HARD' },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeCypherString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function normalizeWeights(weights: Weights): Weights {
  const total =
    weights.W1_timeline +
    weights.W2_dependencies +
    weights.W3_critical_path +
    weights.W4_blocker +
    weights.W5_override +
    weights.W6_resource_risk +
    weights.W7_constraint;
  if (total <= 0) {
    return DEFAULT_WEIGHTS;
  }
  return {
    W1_timeline: weights.W1_timeline / total,
    W2_dependencies: weights.W2_dependencies / total,
    W3_critical_path: weights.W3_critical_path / total,
    W4_blocker: weights.W4_blocker / total,
    W5_override: weights.W5_override / total,
    W6_resource_risk: weights.W6_resource_risk / total,
    W7_constraint: weights.W7_constraint / total,
  };
}

function shouldRunScenario(scenarioId: string): boolean {
  return !RECON_ONLY_SCENARIO || RECON_ONLY_SCENARIO === scenarioId;
}

function timelineUrgency(daysRemaining: number, estimatedEffortDays = 0): number {
  let base = 0;
  if (daysRemaining > 14) {
    base = 0.2;
  } else if (daysRemaining > 7) {
    base = 0.4;
  } else if (daysRemaining > 3) {
    base = 0.6;
  } else if (daysRemaining > 1) {
    base = 0.85;
  } else if (daysRemaining > 0) {
    base = 1.0;
  } else {
    base = 1.2;
  }

  const slack = daysRemaining - estimatedEffortDays;
  if (slack < 0) {
    base += 0.3;
  } else if (slack < 1) {
    base += 0.15;
  }

  return base;
}

function blockerRaw(kind: BlockerType): number {
  if (kind === 'HARD') return 1;
  if (kind === 'SOFT') return 0.6;
  return 0;
}

function expectedRawFactors(
  scenario: Scenario,
): Omit<
  ScoreBlock,
  | 'computed_priority'
  | 'last_scored_at'
  | 'W1_timeline_weight'
  | 'W2_dependencies_weight'
  | 'W3_critical_path_weight'
  | 'W4_blocker_weight'
  | 'W5_override_weight'
  | 'W6_resource_risk_weight'
  | 'W7_constraint_weight'
> {
  return {
    timeline_urgency: timelineUrgency(scenario.deadlineDays, 0),
    dependency_weight: scenario.directDependents + scenario.directDependents * 0.5,
    critical_path: scenario.onCriticalPath ? 1.1 : 0,
    blocker: blockerRaw(scenario.blockerType),
    human_override: 0,
    resource_risk: 0.1,
    constraint_pressure: 0,
  };
}

function expectedFinalScore(scenario: Scenario, weights: Weights): number {
  const f = expectedRawFactors(scenario);
  const w = normalizeWeights(weights);
  return (
    f.timeline_urgency * w.W1_timeline +
    f.dependency_weight * w.W2_dependencies +
    f.critical_path * w.W3_critical_path +
    f.blocker * w.W4_blocker +
    f.human_override * w.W5_override +
    f.resource_risk * w.W6_resource_risk +
    f.constraint_pressure * w.W7_constraint
  );
}

async function findTaskIdByTitle(api: APIRequestContext, title: string): Promise<string | null> {
  const res = await api.get('/app/v1/graph/tasks?limit=200');
  if (res.status() !== 200) {
    return null;
  }
  const body = (await res.json()) as { items?: Array<{ id?: string; title?: string }> };
  const match = (body.items ?? []).find((item) => item.title === title);
  return match?.id ?? null;
}

async function createTaskViaApi(
  api: APIRequestContext,
  title: string,
  deadlineDays: number,
): Promise<string> {
  const deadline = new Date(Date.now() + deadlineDays * DAY_MS).toISOString();
  const res = await api.post('/app/v1/graph/tasks', {
    data: {
      task_type: 'ATOMIC',
      title,
      description: `Scoring reconciliation task: ${title}`,
      deadline,
    },
  });
  expect(res.status()).toBe(201);
  const body = (await res.json()) as { id: string };
  expect(body.id).toBeTruthy();
  return body.id;
}

async function ensureLiveMode(page: Page): Promise<void> {
  const toggle = page.locator('[data-testid="stream-toggle"]');
  if (!(await toggle.isVisible().catch(() => false))) {
    return;
  }
  const text = await toggle.textContent();
  if (text?.includes('Batch')) {
    await toggle.click();
  }
}

async function listChatMessages(api: APIRequestContext): Promise<ChatHistoryMessage[]> {
  const res = await api.get('/app/v1/chat/messages');
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { messages?: ChatHistoryMessage[] };
  return body.messages ?? [];
}

function isAssistantRole(role: string | undefined): boolean {
  return role === 'assistant' || role === 'agent';
}

async function submitChatTurn(page: Page, prompt: string): Promise<void> {
  const input = page.locator('[data-testid="chat-input"]');
  await expect(input).toBeVisible({ timeout: 15000 });
  await input.fill(prompt);
  await Promise.all([
    page
      .waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          (response.url().includes('/chat/messages') ||
            response.url().includes('/chat/messages/stream')),
        { timeout: 30000 },
      )
      .catch(() => null),
    input.press('Enter'),
  ]);
}

async function waitForAssistantReply(
  api: APIRequestContext,
  baselineIds: Set<string>,
  timeoutMs: number,
): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const messages = await listChatMessages(api);
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      const id = msg.message_id ?? '';
      if (id && baselineIds.has(id)) {
        continue;
      }
      if (!isAssistantRole(msg.role)) {
        continue;
      }
      const content = (msg.content ?? '').trim();
      if (content) {
        return content;
      }
    }
    await sleep(1500);
  }
  throw new Error('Timed out waiting for assistant response after chat turn.');
}

async function createTaskViaChatPlanConfirm(
  page: Page,
  api: APIRequestContext,
  title: string,
  deadlineDays: number,
): Promise<string> {
  const deadlineIso = new Date(Date.now() + deadlineDays * DAY_MS).toISOString();

  await page.goto('/chat');
  await expect(page.locator('[data-testid="chat-view"]')).toBeVisible({ timeout: 15000 });
  await ensureLiveMode(page);
  await api.delete('/app/v1/chat/messages').catch(() => {});

  const planPrompt = [
    'Planning turn only. Do not create anything yet.',
    'Return exactly two numbered steps prefixed with PLAN_OK.',
    `Task title must be exactly "${title}".`,
    `Task deadline must be exactly "${deadlineIso}".`,
  ].join(' ');
  const beforePlan = await listChatMessages(api);
  await submitChatTurn(page, planPrompt);
  const planReply = await waitForAssistantReply(
    api,
    new Set(beforePlan.map((m) => m.message_id ?? '').filter(Boolean)),
    90_000,
  );
  const planLower = planReply.toLowerCase();
  if (planLower.includes('not yet connected') || planLower.includes('fully initialised')) {
    throw new Error(
      `Agent did not produce a planning response (agent unavailable). Reply: ${planReply}`,
    );
  }
  expect(planReply.trim().length).toBeGreaterThan(0);

  const confirmPrompt = [
    'Plan accepted. Execute now.',
    'Create exactly one ATOMIC task and no other tasks.',
    `Use title "${title}" and deadline "${deadlineIso}" exactly.`,
    'Reply with CREATED_OK when done.',
  ].join(' ');
  const beforeConfirm = await listChatMessages(api);
  await submitChatTurn(page, confirmPrompt);
  const confirmReply = await waitForAssistantReply(
    api,
    new Set(beforeConfirm.map((m) => m.message_id ?? '').filter(Boolean)),
    120_000,
  );
  const confirmLower = confirmReply.toLowerCase();
  if (confirmLower.includes('not yet connected') || confirmLower.includes('fully initialised')) {
    throw new Error(
      `Agent did not execute the confirmed plan (agent unavailable). Reply: ${confirmReply}`,
    );
  }
  expect(confirmReply.trim().length).toBeGreaterThan(0);

  for (let i = 0; i < 30; i += 1) {
    const taskId = await findTaskIdByTitle(api, title);
    if (taskId) {
      return taskId;
    }
    await sleep(2000);
  }

  throw new Error(`Chat confirmed task creation but task id was not found for title ${title}.`);
}

async function createDependencyEdges(
  api: APIRequestContext,
  scenarioTaskId: string,
  scenarioId: string,
  count: number,
): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    const depId = await createTaskViaApi(api, `${scenarioId}-dep-${i + 1}-${Date.now()}`, 30);
    const edgeRes = await api.post('/app/v1/graph/edges', {
      data: {
        source_id: depId,
        target_id: scenarioTaskId,
        edge_type: 'DEPENDS_ON',
        metadata: {},
      },
    });
    expect(edgeRes.status()).toBe(201);
  }
}

async function createBlockerEdge(
  api: APIRequestContext,
  scenarioTaskId: string,
  scenarioId: string,
  blockerType: Exclude<BlockerType, 'NONE'>,
): Promise<void> {
  const blockedId = await createTaskViaApi(api, `${scenarioId}-blocked-${Date.now()}`, 30);
  const edgeRes = await api.post('/app/v1/graph/edges', {
    data: {
      source_id: scenarioTaskId,
      target_id: blockedId,
      edge_type: 'BLOCKS',
      metadata: { strength: blockerType },
    },
  });
  expect(edgeRes.status()).toBe(201);
}

async function setCriticalPath(db: DbClient, taskId: string): Promise<void> {
  const escaped = escapeCypherString(taskId);
  await db.runCypher(
    `MATCH (t {id: '${escaped}'}) SET t.on_critical_path = true RETURN t.id AS id`,
    ['id agtype'],
  );
}

async function triggerScoringCycle(api: APIRequestContext): Promise<void> {
  const res = await api.get('/app/v1/agent/action-queue');
  expect(res.status()).toBe(200);
}

function parseScoreBlock(raw: unknown): ScoreBlock | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ScoreBlock;
    } catch {
      return null;
    }
  }
  return raw as ScoreBlock;
}

async function loadTaskScoreFromDb(db: DbClient, taskId: string): Promise<ScoreBlock | null> {
  const node = await db.getNodeById(taskId);
  if (!node) {
    return null;
  }
  const parsed = parseScoreBlock(node.scoring);
  if (!parsed) {
    return null;
  }
  if (!parsed.last_scored_at && typeof node.last_scored_at === 'string') {
    return {
      ...parsed,
      last_scored_at: node.last_scored_at,
    };
  }
  return parsed;
}

async function waitForTaskScoreInDb(
  db: DbClient,
  taskId: string,
  minTimestampMs: number,
): Promise<ScoreBlock> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const score = await loadTaskScoreFromDb(db, taskId);
    if (score?.last_scored_at) {
      const scoredAt = Date.parse(score.last_scored_at);
      if (!Number.isNaN(scoredAt) && scoredAt >= minTimestampMs - 5000) {
        return score;
      }
    }
    await sleep(1500);
  }
  throw new Error(`Timed out waiting for DB scoring persistence for task ${taskId}`);
}

function parseFinalScore(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

async function loadTaskEventsFromMinio(
  minio: MinioClient,
  taskId: string,
  minTimestampMs: number,
): Promise<TaskEvent[]> {
  const keys = [
    ...(await minio.listObjects(`${TEST_USER_ID}/logs/platform/`)),
    ...(await minio.listObjects(`${TEST_USER_ID}/logs/gateway/`)),
  ].sort();

  const events: TaskEvent[] = [];

  for (const key of keys) {
    let content = '';
    try {
      content = await minio.readObject(key);
    } catch {
      continue;
    }
    for (const line of content.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(line) as Record<string, unknown>;
      } catch {
        continue;
      }
      if (parsed.task_id !== taskId) continue;
      const eventType = parsed.event_type;
      const timestamp = parsed.timestamp;
      if (typeof eventType !== 'string' || typeof timestamp !== 'string') continue;
      const tsMs = Date.parse(timestamp);
      if (Number.isNaN(tsMs) || tsMs < minTimestampMs - 5000) continue;
      events.push({
        timestamp: tsMs,
        eventType,
        finalScore: parseFinalScore(parsed.final_score),
        source: 'minio',
      });
    }
  }

  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
}

function resolveBackendContainerName(): string {
  if (BACKEND_LOG_CONTAINER.trim()) {
    return BACKEND_LOG_CONTAINER.trim();
  }
  const ps = spawnSync('docker', ['ps', '--format', '{{.Names}}'], {
    encoding: 'utf8',
  });
  if (ps.status !== 0) {
    throw new Error(`Unable to list docker containers: ${ps.stderr || ps.stdout}`);
  }
  const names = (ps.stdout ?? '')
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
  const match = names.find((name) => name.includes('gateway'));
  if (!match) {
    throw new Error(
      'Could not resolve gateway container. Set BACKEND_LOG_CONTAINER env var for this suite.',
    );
  }
  return match;
}

async function loadTaskEventsFromContainer(
  taskId: string,
  minTimestampMs: number,
): Promise<TaskEvent[]> {
  const container = resolveBackendContainerName();
  const sinceIso = new Date(minTimestampMs - 5000).toISOString();
  const logs = spawnSync('docker', ['logs', '--since', sinceIso, container], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (logs.status !== 0) {
    throw new Error(
      `Failed to read backend container logs (${container}): ${logs.stderr || logs.stdout}`,
    );
  }

  const events: TaskEvent[] = [];
  const merged = `${logs.stdout || ''}\n${logs.stderr || ''}`;
  for (const line of merged.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }
    if (parsed.task_id !== taskId) continue;
    const eventType = parsed.event_type;
    const timestamp = parsed.timestamp;
    if (typeof eventType !== 'string' || typeof timestamp !== 'string') continue;
    const tsMs = Date.parse(timestamp);
    if (Number.isNaN(tsMs) || tsMs < minTimestampMs - 5000) continue;
    events.push({
      timestamp: tsMs,
      eventType,
      finalScore: parseFinalScore(parsed.final_score),
      source: 'container',
    });
  }

  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
}

function hasOrderedSequence(events: string[], expected: string[]): boolean {
  let idx = 0;
  for (const eventType of events) {
    if (eventType === expected[idx]) {
      idx += 1;
      if (idx === expected.length) {
        return true;
      }
    }
  }
  return false;
}

function latestFinalScore(events: TaskEvent[]): number | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.eventType === 'scoring.final.computed' && event.finalScore !== null) {
      return event.finalScore;
    }
  }
  return null;
}

async function waitForMinioEventSequence(
  minio: MinioClient,
  taskId: string,
  minTimestampMs: number,
): Promise<TaskEvent[]> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const events = await loadTaskEventsFromMinio(minio, taskId, minTimestampMs);
    const names = events.map((event) => event.eventType);
    if (hasOrderedSequence(names, SCORING_SEQUENCE)) {
      return events;
    }
    await sleep(2000);
  }
  const finalEvents = await loadTaskEventsFromMinio(minio, taskId, minTimestampMs);
  throw new Error(
    `Missing MinIO scoring sequence for task ${taskId}. Seen events: ${Array.from(new Set(finalEvents.map((event) => event.eventType))).join(', ')}`,
  );
}

async function waitForContainerEventSequence(
  taskId: string,
  minTimestampMs: number,
): Promise<TaskEvent[]> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const events = await loadTaskEventsFromContainer(taskId, minTimestampMs);
    const names = events.map((event) => event.eventType);
    if (hasOrderedSequence(names, SCORING_SEQUENCE)) {
      return events;
    }
    await sleep(2000);
  }
  const finalEvents = await loadTaskEventsFromContainer(taskId, minTimestampMs);
  throw new Error(
    `Missing container scoring sequence for task ${taskId}. Seen events: ${Array.from(new Set(finalEvents.map((event) => event.eventType))).join(', ')}`,
  );
}

async function runScenarioAndReconcile(
  args: {
    api: APIRequestContext;
    page: Page;
    db: DbClient;
    minio: MinioClient;
    scenario: Scenario;
    weights: Weights;
    titlePrefix: string;
  },
): Promise<{ taskId: string; score: ScoreBlock }> {
  const { api, page, db, minio, scenario, weights, titlePrefix } = args;
  const title = `${titlePrefix}-${scenario.id}-${Date.now()}`;
  const cycleStart = Date.now();

  const taskId = await createTaskViaChatPlanConfirm(page, api, title, scenario.deadlineDays);

  if (scenario.directDependents > 0) {
    await createDependencyEdges(api, taskId, scenario.id, scenario.directDependents);
  }
  if (scenario.onCriticalPath) {
    await setCriticalPath(db, taskId);
  }
  if (scenario.blockerType !== 'NONE') {
    await createBlockerEdge(api, taskId, scenario.id, scenario.blockerType);
  }

  await triggerScoringCycle(api);

  const score = await waitForTaskScoreInDb(db, taskId, cycleStart);
  const minioEvents = await waitForMinioEventSequence(minio, taskId, cycleStart);
  const containerEvents = await waitForContainerEventSequence(taskId, cycleStart);

  const expectedRaw = expectedRawFactors(scenario);
  const expectedScore = expectedFinalScore(scenario, weights);
  const normalized = normalizeWeights(weights);
  const minioFinal = latestFinalScore(minioEvents);
  const containerFinal = latestFinalScore(containerEvents);

  expect(score.timeline_urgency).toBeCloseTo(expectedRaw.timeline_urgency, 2);
  expect(score.dependency_weight).toBeCloseTo(expectedRaw.dependency_weight, 2);
  expect(score.critical_path).toBeCloseTo(expectedRaw.critical_path, 2);
  expect(score.blocker).toBeCloseTo(expectedRaw.blocker, 2);
  expect(score.human_override).toBeCloseTo(expectedRaw.human_override, 2);
  expect(score.resource_risk).toBeCloseTo(expectedRaw.resource_risk, 2);
  expect(score.constraint_pressure).toBeCloseTo(expectedRaw.constraint_pressure, 2);
  expect(score.computed_priority).toBeCloseTo(expectedScore, 2);
  expect(minioFinal).not.toBeNull();
  expect(containerFinal).not.toBeNull();
  expect(minioFinal!).toBeCloseTo(expectedScore, 2);
  expect(containerFinal!).toBeCloseTo(expectedScore, 2);
  expect(score.computed_priority).toBeCloseTo(minioFinal!, 2);
  expect(score.computed_priority).toBeCloseTo(containerFinal!, 2);

  expect(score.W1_timeline_weight).toBeCloseTo(normalized.W1_timeline, 6);
  expect(score.W2_dependencies_weight).toBeCloseTo(normalized.W2_dependencies, 6);
  expect(score.W3_critical_path_weight).toBeCloseTo(normalized.W3_critical_path, 6);
  expect(score.W4_blocker_weight).toBeCloseTo(normalized.W4_blocker, 6);
  expect(score.W5_override_weight).toBeCloseTo(normalized.W5_override, 6);
  expect(score.W6_resource_risk_weight).toBeCloseTo(normalized.W6_resource_risk, 6);
  expect(score.W7_constraint_weight).toBeCloseTo(normalized.W7_constraint, 6);

  return { taskId, score };
}

async function readWeightsObject(minio: MinioClient): Promise<Weights | null> {
  const key = StoragePaths.scoringWeights(TEST_USER_ID);
  const exists = await minio.objectExists(key);
  if (!exists) {
    return null;
  }
  const content = await minio.readObject(key);
  return JSON.parse(content) as Weights;
}

async function applyWeights(api: APIRequestContext, weights: Weights): Promise<void> {
  const patchRes = await api.patch('/app/v1/settings/scoring-weights', {
    data: weights,
  });
  expect(patchRes.status()).toBe(200);

  const settingsRes = await api.get('/app/v1/settings/scoring-weights');
  expect(settingsRes.status()).toBe(200);
  const settingsBody = (await settingsRes.json()) as Weights;
  expect(settingsBody.W1_timeline).toBeCloseTo(weights.W1_timeline, 6);
  expect(settingsBody.W7_constraint).toBeCloseTo(weights.W7_constraint, 6);
}

test.describe('Scoring reconciliation', () => {
  test.describe.configure({ timeout: 25 * 60 * 1000 });

  test('reconciles 10 baseline scenarios (expected vs persisted) with log sequence checks', async ({
    api,
    page,
    db,
    minio,
  }) => {
    const scenarios = BASELINE_SCENARIOS.filter((scenario) => shouldRunScenario(scenario.id));
    test.skip(
      Boolean(RECON_ONLY_SCENARIO) && scenarios.length === 0,
      `Scenario filter ${RECON_ONLY_SCENARIO} does not target baseline cases.`,
    );

    await applyWeights(api, DEFAULT_WEIGHTS);

    for (const scenario of scenarios) {
      await runScenarioAndReconcile({
        api,
        page,
        db,
        minio,
        scenario,
        weights: DEFAULT_WEIGHTS,
        titlePrefix: 'recon-baseline',
      });
    }
  });

  test('executes chat submit path and reconciles persisted score', async ({ api, page, db, minio }) => {
    test.skip(
      Boolean(RECON_ONLY_SCENARIO) && RECON_ONLY_SCENARIO !== 'chat-submit',
      `Scenario filter ${RECON_ONLY_SCENARIO} excludes chat-submit.`,
    );

    await applyWeights(api, DEFAULT_WEIGHTS);

    const scenario: Scenario = {
      id: 'chat-submit',
      deadlineDays: 5,
      directDependents: 1,
      onCriticalPath: false,
      blockerType: 'NONE',
    };

    await runScenarioAndReconcile({
      api,
      page,
      db,
      minio,
      scenario,
      weights: DEFAULT_WEIGHTS,
      titlePrefix: 'recon-chat',
    });
  });

  test('reconciles weight update behavior (existing task, new tasks, MinIO persistence)', async ({
    api,
    page,
    db,
    minio,
  }) => {
    const wantsExisting = shouldRunScenario('existing-before-update');
    const updatedTargets = UPDATED_SCENARIOS.filter((scenario) => shouldRunScenario(scenario.id));
    test.skip(
      Boolean(RECON_ONLY_SCENARIO) && !wantsExisting && updatedTargets.length === 0,
      `Scenario filter ${RECON_ONLY_SCENARIO} excludes weight-update cases.`,
    );

    const existingScenario: Scenario = {
      id: 'existing-before-update',
      deadlineDays: 2,
      directDependents: 2,
      onCriticalPath: true,
      blockerType: 'SOFT',
    };

    await applyWeights(api, DEFAULT_WEIGHTS);
    const existing = wantsExisting
      ? await runScenarioAndReconcile({
          api,
          page,
          db,
          minio,
          scenario: existingScenario,
          weights: DEFAULT_WEIGHTS,
          titlePrefix: 'recon-existing',
        })
      : null;

    const beforeWeights = await readWeightsObject(minio);

    await applyWeights(api, UPDATED_WEIGHTS);

    if (existing) {
      const rescoreStart = Date.now();
      await triggerScoringCycle(api);

      const rescored = await waitForTaskScoreInDb(db, existing.taskId, rescoreStart);
      const minioRescoredEvents = await waitForMinioEventSequence(minio, existing.taskId, rescoreStart);
      const containerRescoredEvents = await waitForContainerEventSequence(existing.taskId, rescoreStart);
      const minioRescoreFinal = latestFinalScore(minioRescoredEvents);
      const containerRescoreFinal = latestFinalScore(containerRescoredEvents);
      const expectedRescored = expectedFinalScore(existingScenario, UPDATED_WEIGHTS);
      expect(rescored.computed_priority).toBeCloseTo(expectedRescored, 2);
      expect(rescored.computed_priority).not.toBeCloseTo(existing.score.computed_priority, 3);
      expect(minioRescoreFinal).not.toBeNull();
      expect(containerRescoreFinal).not.toBeNull();
      expect(minioRescoreFinal!).toBeCloseTo(expectedRescored, 2);
      expect(containerRescoreFinal!).toBeCloseTo(expectedRescored, 2);
    }

    const afterWeights = await readWeightsObject(minio);
    expect(afterWeights).not.toBeNull();
    expect(afterWeights?.W1_timeline).toBeCloseTo(UPDATED_WEIGHTS.W1_timeline, 6);
    expect(afterWeights?.W6_resource_risk).toBeCloseTo(UPDATED_WEIGHTS.W6_resource_risk, 6);
    if (beforeWeights) {
      expect(afterWeights?.W1_timeline).not.toBeCloseTo(beforeWeights.W1_timeline, 6);
    }

    for (const scenario of updatedTargets) {
      await runScenarioAndReconcile({
        api,
        page,
        db,
        minio,
        scenario,
        weights: UPDATED_WEIGHTS,
        titlePrefix: 'recon-updated',
      });
    }

    const scoreObjects = await minio.listObjects(`${TEST_USER_ID}/scores/`);
    expect(scoreObjects.length).toBe(0);
  });
});
