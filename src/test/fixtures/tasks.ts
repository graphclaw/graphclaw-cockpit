// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
export const mockTasks = [
  {
    id: 'TSK-001',
    title: 'Set up CI/CD',
    state: 'IN_PROGRESS',
    score: 0.85,
    assigned_to: 'RES-001',
    goal_id: 'GOAL-001',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-10T14:30:00Z',
  },
  {
    id: 'TSK-002',
    title: 'Write API docs',
    state: 'BACKLOG',
    score: 0.42,
    assigned_to: 'RES-001',
    goal_id: 'GOAL-001',
    created_at: '2026-04-02T09:00:00Z',
    updated_at: '2026-04-02T09:00:00Z',
  },
  {
    id: 'TSK-003',
    title: 'Train model',
    state: 'ACTIVE',
    score: 0.77,
    assigned_to: 'RES-002',
    goal_id: 'GOAL-002',
    created_at: '2026-04-03T11:00:00Z',
    updated_at: '2026-04-05T16:00:00Z',
  },
] as const;

export const mockTasksResponse = {
  items: mockTasks,
  next_cursor: null,
  total: mockTasks.length,
};
