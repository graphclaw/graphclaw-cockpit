// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0

import { createServer } from 'node:http';
import { URL } from 'node:url';

interface HarnessEvent {
  received_at: string;
  path: string;
  body: unknown;
}

const PORT = Number(process.env.A2A_HARNESS_PORT ?? '8787');
const GRAPHCLAW_BASE_URL = process.env.GRAPHCLAW_BASE_URL ?? 'http://localhost:8000';
const GRAPHCLAW_A2A_KEY = process.env.GRAPHCLAW_A2A_KEY;

const events: HarnessEvent[] = [];

function sendJson(res: import('node:http').ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function readBody(req: import('node:http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(raw);
      }
    });
    req.on('error', reject);
  });
}

async function forwardTaskUpdate(payload: unknown) {
  if (!GRAPHCLAW_A2A_KEY) {
    return {
      ok: false,
      reason: 'Missing GRAPHCLAW_A2A_KEY',
      status: 0,
    };
  }

  const response = await fetch(`${GRAPHCLAW_BASE_URL}/api/v1/task-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Api-Key': GRAPHCLAW_A2A_KEY,
    },
    body: JSON.stringify(payload ?? {}),
  });

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = await response.text();
  }

  return {
    ok: response.ok,
    status: response.status,
    body: responseBody,
  };
}

const server = createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', service: 'external-a2a-harness' });
    return;
  }

  if (method === 'POST' && url.pathname === '/callback') {
    const body = await readBody(req);
    events.push({
      received_at: new Date().toISOString(),
      path: url.pathname,
      body,
    });
    sendJson(res, 202, { accepted: true, events: events.length });
    return;
  }

  if (method === 'GET' && url.pathname === '/events') {
    sendJson(res, 200, { count: events.length, events });
    return;
  }

  if (method === 'DELETE' && url.pathname === '/events') {
    events.length = 0;
    sendJson(res, 200, { cleared: true });
    return;
  }

  if (method === 'POST' && url.pathname === '/replay/task-update') {
    const body = await readBody(req);
    const forwarded = await forwardTaskUpdate(body);
    sendJson(res, forwarded.ok ? 202 : 400, forwarded);
    return;
  }

  sendJson(res, 404, { error: `Unknown route: ${method} ${url.pathname}` });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`external-a2a-harness listening on http://localhost:${PORT}`);
});
