// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { formatTickerEvent } from '@/features/agent-monitor/lib/formatEvent';

describe('formatTickerEvent', () => {
  it('formats task.scored payload with count and title', () => {
    const result = formatTickerEvent('task.scored', {
      timestamp: '2026-05-03T14:32:00Z',
      tasks_scored: 14,
      top_task_title: 'Competitive analysis',
      task_id: 'TK-4821',
    });

    expect(result).not.toBeNull();
    expect(result?.dotColor).toBe('green');
    expect(result?.message).toContain('Scored 14 tasks');
    expect(result?.taskId).toBe('TK-4821');
  });

  it('formats failed skill.completed payload as red status', () => {
    const result = formatTickerEvent('skill.completed', {
      timestamp: '2026-05-03T14:28:00Z',
      skill_name: 'Research',
      status: 'FAILED',
      task_id: 'TK-4821',
    });

    expect(result).not.toBeNull();
    expect(result?.dotColor).toBe('red');
    expect(result?.message).toBe('Research failed.');
  });

  it('returns null for unsupported events', () => {
    const result = formatTickerEvent('agent.heartbeat', {
      timestamp: '2026-05-03T14:28:00Z',
    });

    expect(result).toBeNull();
  });
});
