import { http, HttpResponse } from 'msw';

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
        { id: 'TSK-001', title: 'Set up CI/CD', state: 'IN_PROGRESS', score: 0.85 },
        { id: 'TSK-002', title: 'Write API docs', state: 'BACKLOG', score: 0.42 },
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
];
