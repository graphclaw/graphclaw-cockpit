// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
export const mockAgents = [
  {
    agent_id: 'agent-alpha',
    name: 'Agent-Alpha',
    state: 'IDLE',
    description: 'General-purpose task agent',
    version: '1',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    config: {},
    tags: ['general'],
  },
  {
    agent_id: 'agent-beta',
    name: 'Agent-Beta',
    state: 'BUSY',
    description: 'Email triage specialist',
    version: '2',
    created_at: '2026-03-15T00:00:00Z',
    updated_at: '2026-04-10T12:00:00Z',
    config: { skill: 'email-triage' },
    tags: ['email', 'triage'],
  },
] as const;

export const mockAgentStatus = {
  agent_id: 'agent-main',
  state: 'IDLE',
  last_heartbeat: '2026-05-06T12:00:00Z',
  tasks_completed: 42,
  tasks_pending: 3,
};
