import { http, HttpResponse } from 'msw';

const mcpServers = [
  {
    server_id: 'MCP-mock-gh',
    name: 'GitHub Actions',
    transport: 'http',
    endpoint_url: 'https://api.github.com/mcp',
    command: null,
    trust_tier: 'AUTO',
    scope: ['read_issues'],
    enabled: true,
  },
  {
    server_id: 'MCP-mock-jira',
    name: 'Jira Cloud',
    transport: 'sse',
    endpoint_url: 'https://jira.example.com/mcp',
    command: null,
    trust_tier: 'GATED',
    scope: ['read_tickets'],
    enabled: true,
  },
  {
    server_id: 'MCP-mock-legacy',
    name: 'Legacy Connector',
    transport: 'http',
    endpoint_url: 'https://legacy.example.com/mcp',
    command: null,
    trust_tier: 'BLOCKED',
    scope: ['read_legacy'],
    enabled: false,
  },
];

export const handlers = [
  // Auth: dev-token
  http.post('/auth/dev-token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      expires_in: 900,
      user_id: 'USER-dev-001',
      role: 'ADMIN',
    });
  }),

  // Auth: refresh
  http.post('/auth/refresh', () => {
    return HttpResponse.json({
      access_token: 'mock-refreshed-access-token',
      refresh_token: 'mock-refreshed-refresh-token',
      token_type: 'bearer',
      expires_in: 900,
    });
  }),

  // Auth: me
  http.get('/auth/me', () => {
    return HttpResponse.json({
      user_id: 'USER-dev-001',
      token_type: 'access',
    });
  }),

  // Auth: logout
  http.post('/auth/logout', () => {
    return HttpResponse.json({ ok: true });
  }),

  // Graph: goals list
  http.get('/app/v1/graph/goals', () => {
    return HttpResponse.json({
      items: [
        { id: 'GOAL-001', title: 'Launch MVP', state: 'ACTIVE', priority: 'HIGH' },
        { id: 'GOAL-002', title: 'Scale Infrastructure', state: 'PLANNING', priority: 'MEDIUM' },
      ],
      next_cursor: null,
      total: 2,
    });
  }),

  // Graph: tasks list
  http.get('/app/v1/graph/tasks', () => {
    return HttpResponse.json({
      items: [
        { id: 'TSK-001', title: 'Set up CI/CD', state: 'IN_PROGRESS', score: 0.85, assigned_to: 'RES-001' },
        { id: 'TSK-002', title: 'Write API docs', state: 'BACKLOG', score: 0.42, assigned_to: 'RES-001' },
        { id: 'TSK-003', title: 'Train model', state: 'ACTIVE', score: 0.77, assigned_to: 'RES-002' },
      ],
      next_cursor: null,
      total: 3,
    });
  }),

  // Admin: members list
  http.get('/app/v1/admin/members', () => {
    return HttpResponse.json([
      { user_id: 'Alice Chen', email: 'alice.chen@example.com', role: 'MEMBER', member_status: 'ACTIVE', joined_at: '2026-01-01T00:00:00Z' },
      { user_id: 'Bob Kumar', email: 'bob.kumar@example.com', role: 'MEMBER', member_status: 'ACTIVE', joined_at: '2026-01-02T00:00:00Z' },
      { user_id: 'Dave Smith', email: 'dave.smith@example.com', role: 'ADMIN', member_status: 'INVITED', joined_at: '2026-01-03T00:00:00Z' },
    ]);
  }),

  // Agents: sub-agent pool
  http.get('/app/v1/agents', () => {
    return HttpResponse.json([
      { agent_id: 'agent-alpha', name: 'Agent-Alpha', state: 'IDLE', description: '', version: '1', created_at: '', updated_at: '', config: {}, tags: [] },
    ]);
  }),

  // Graph: resources list
  http.get('/app/v1/graph/resources', () => {
    return HttpResponse.json({
      items: [
        { id: 'RES-001', name: 'Alice Chen', resource_type: 'HUMAN', capacity: 8 },
        { id: 'RES-002', name: 'Agent-Alpha', resource_type: 'AI_AGENT', capacity: 5 },
      ],
      next_cursor: null,
      total: 2,
    });
  }),

  // Settings: get
  http.get('/app/v1/settings', () => {
    return HttpResponse.json({
      scoring_weights: {
        urgency: 0.2,
        importance: 0.2,
        dependencies: 0.15,
        recency: 0.1,
        effort: 0.1,
        alignment: 0.15,
        capacity: 0.1,
      },
      briefing_schedule: { hour: 9, minute: 0, timezone: 'UTC' },
    });
  }),

  // Agent: status
  http.get('/app/v1/agent/status', () => {
    return HttpResponse.json({
      agent_id: 'agent-main',
      state: 'IDLE',
      last_heartbeat: new Date().toISOString(),
      tasks_completed: 42,
      tasks_pending: 3,
    });
  }),

  // Health check
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // MCP Registry: list
  http.get('/app/v1/mcp-servers', () => {
    return HttpResponse.json(mcpServers);
  }),

  // MCP Registry: register
  http.post('/app/v1/mcp-servers', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(
      {
        server_id: `MCP-mock-${Date.now()}`,
        name: String(body.name ?? 'New MCP Server'),
        transport: String(body.transport ?? 'http'),
        endpoint_url: body.endpoint_url ?? null,
        command: body.command ?? null,
        trust_tier: String(body.trust_tier ?? 'GATED'),
        scope: Array.isArray(body.scope) ? body.scope : [],
        enabled: true,
      },
      { status: 201 },
    );
  }),

  // MCP Registry: delete
  http.delete('/app/v1/mcp-servers/:serverId', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Skills: list installed
  http.get('/app/v1/skills', () => {
    return HttpResponse.json([
      {
        skill_id: 'skill-001',
        skill_name: 'email-triage',
        version: '1.2.0',
        description: 'Triage and categorize incoming emails',
        source_type: 'github',
        tags: ['email', 'triage'],
        enabled: true,
        usage_count: 42,
        avg_quality_score: 4.2,
      },
      {
        skill_id: 'skill-002',
        skill_name: 'meeting-summarizer',
        version: '0.9.1',
        description: 'Summarize meeting transcripts',
        source_type: 'local',
        tags: ['meetings', 'summary'],
        enabled: false,
        usage_count: 8,
        avg_quality_score: 3.8,
      },
    ]);
  }),

  // Skills: toggle
  http.patch('/app/v1/skills/:skillId', ({ params }) => {
    return HttpResponse.json({
      skill_id: params.skillId,
      skill_name: 'email-triage',
      version: '1.2.0',
      enabled: true,
      source_type: 'github',
      tags: [],
      usage_count: 42,
      avg_quality_score: 4.2,
    });
  }),

  // Skills: uninstall
  http.delete('/app/v1/skills/:skillId', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Skills: search
  http.get('/app/v1/skills/search', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    return HttpResponse.json(
      q.length > 1
        ? [
            {
              skill_id: 'listing-web-researcher',
              skill_name: 'web-researcher',
              version: '1.4.2',
              description: 'Research topics using web search',
              source_type: 'github',
              source_uri: 'https://github.com/graphclaw/skills',
              tags: ['research', 'web'],
              enabled: true,
              usage_count: 0,
              avg_quality_score: 0,
            },
          ]
        : [],
    );
  }),

  // Skills: sources
  http.get('/app/v1/skills/sources', () => {
    return HttpResponse.json([
      {
        source_uri: 'https://github.com/graphclaw/official-skills',
        source_type: 'github',
        name: 'GraphClaw Official',
        last_fetched_at: new Date().toISOString(),
      },
    ]);
  }),

  // Skills: add source
  http.post('/app/v1/skills/sources', async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    return HttpResponse.json(
      { source_uri: body.uri, source_type: body.source_type, name: body.name },
      { status: 201 },
    );
  }),

  // Skills: remove source
  http.delete('/app/v1/skills/sources/:sourceUri', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Skills: install
  http.post('/app/v1/skills/install', async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    return HttpResponse.json(
      {
        skill_id: `skill-${Date.now()}`,
        skill_name: body.skill_name,
        version: '1.0.0',
        enabled: true,
        source_type: 'github',
        source_uri: body.source_uri,
        tags: [],
        usage_count: 0,
        avg_quality_score: 0,
      },
      { status: 201 },
    );
  }),

  // Authored skills: list
  http.get('/app/v1/intelligence/skills/authored', () => {
    return HttpResponse.json([
      {
        skill_id: 'authored-001',
        name: 'my-custom-skill',
        version: '0.1.0',
        description: 'My first authored skill',
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Authored skills: create
  http.post('/app/v1/intelligence/skills/authored', async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    return HttpResponse.json(
      {
        skill_id: `authored-${Date.now()}`,
        name: body.name ?? 'new-skill',
        version: body.version ?? '0.1.0',
        description: body.description ?? '',
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // Authored skills: update
  http.put('/app/v1/intelligence/skills/authored/:skillId', async ({ params, request }) => {
    const body = await request.json() as Record<string, string>;
    return HttpResponse.json({
      skill_id: params.skillId,
      name: body.name ?? 'updated-skill',
      version: body.version ?? '0.1.0',
      description: body.description ?? '',
      created_at: new Date().toISOString(),
    });
  }),

  // Authored skills: delete
  http.delete('/app/v1/intelligence/skills/authored/:skillId', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Authored skills: validate
  http.post('/app/v1/intelligence/skills/validate', () => {
    return HttpResponse.json({ valid: true, errors: [] });
  }),

  // Authored skills: fork
  http.post('/app/v1/intelligence/skills/authored/:skillId/fork', ({ params }) => {
    return HttpResponse.json({
      skill_id: `fork-${Date.now()}`,
      name: `${String(params.skillId)}-fork`,
      version: '0.1.0',
      description: 'Forked skill',
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Admin: marketplace policy
  http.get('/app/v1/admin/features/marketplace', () => {
    return HttpResponse.json({
      enabled: true,
      allow_external_sources: true,
      require_approval_for_install: false,
      approved_sources: [],
    });
  }),

  http.put('/app/v1/admin/features/marketplace', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),

  // Intelligence: list agents
  http.get('/app/v1/intelligence/agents', () => {
    return HttpResponse.json([
      { agent_id: 'agent-comm', name: 'Communications Agent', agent_type: 'system' },
    ]);
  }),

  // Intelligence: agent profile GET
  http.get('/app/v1/intelligence/agents/:agentId/profile', ({ params }) => {
    return HttpResponse.json({
      agent_id: params.agentId,
      content: `# Agent: ${String(params.agentId)}\n\nNo profile defined yet.`,
    });
  }),

  // Intelligence: agent profile PUT (handles empty agentId from test context)
  http.put('/app/v1/intelligence/agents/:agentId/profile', async ({ params, request }) => {
    const body = await request.json() as Record<string, string>;
    return HttpResponse.json({ agent_id: params.agentId, content: body.content ?? '' });
  }),

  // Intelligence: agent profile PUT with empty segment (test fallback)
  http.put('/app/v1/intelligence/agents//profile', async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    return HttpResponse.json({ agent_id: '', content: body.content ?? '' });
  }),

  // Intelligence: working memory GET
  http.get('/app/v1/intelligence/agents/:agentId/memory/working', () => {
    return HttpResponse.json({ content: '' });
  }),

  // Intelligence: working memory PUT
  http.put('/app/v1/intelligence/agents/:agentId/memory/working', async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    return HttpResponse.json({ content: body.content ?? '' });
  }),

  // Intelligence: working memory archive list
  http.get('/app/v1/intelligence/agents/:agentId/memory/working/archives', () => {
    return HttpResponse.json([]);
  }),

  // Intelligence: working memory compact
  http.post('/app/v1/intelligence/agents/:agentId/memory/working/compact', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      context_before_chars: 1000,
      context_after_chars: 100,
      reduction_pct: 90,
      summary: body.summary ?? '',
    });
  }),

  // Intelligence: semantic memory list
  http.get('/app/v1/intelligence/agents/:agentId/memory/semantic', () => {
    return HttpResponse.json({ entries: [
      { key: 'knowledge', size_chars: 200 },
      { key: 'task-scoring', size_chars: 150 },
    ]});
  }),

  // Intelligence: semantic topic GET
  http.get('/app/v1/intelligence/agents/:agentId/memory/semantic/:topic', ({ params }) => {
    return HttpResponse.json({ topic: params.topic, content: `# ${String(params.topic)}\n\n` });
  }),

  // Intelligence: semantic topic PUT
  http.put('/app/v1/intelligence/agents/:agentId/memory/semantic/:topic', async ({ params, request }) => {
    const body = await request.json() as Record<string, string>;
    return HttpResponse.json({ topic: params.topic, content: body.content ?? '' });
  }),

  // Intelligence: semantic topic DELETE
  http.delete('/app/v1/intelligence/agents/:agentId/memory/semantic/:topic', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Intelligence: episodic memory list
  http.get('/app/v1/intelligence/agents/:agentId/memory/episodic', () => {
    return HttpResponse.json([
      { name: 'sprint-12-planning.md', status: 'active', content: '# Sprint 12 planning\n\nSession notes.' },
      { name: 'bug-triage.md', status: 'active', content: '# Bug triage\n\nNotes.' },
    ]);
  }),

  // Intelligence: episodic entry archive
  http.post('/app/v1/intelligence/agents/:agentId/memory/episodic/:entryName/archive', ({ params }) => {
    return HttpResponse.json({ name: params.entryName, status: 'archived' });
  }),
];
