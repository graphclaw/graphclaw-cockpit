// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
export type TickerDotColor = 'green' | 'blue' | 'amber' | 'red' | 'grey' | 'purple';

export type SupportedTickerEventType =
  | 'task.scored'
  | 'skill.completed'
  | 'briefing.ready'
  | 'task.state_changed'
  | 'approval.pending';

export interface TickerEventRecord {
  eventType: SupportedTickerEventType;
  timestamp: string;
  time: string;
  dotColor: TickerDotColor;
  message: string;
  taskId?: string;
}

function readString(payload: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return undefined;
}

function readNumber(payload: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function formatTime(timestamp: string): string {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return '--:--';
  }

  return new Date(parsed).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getTaskId(payload: Record<string, unknown>): string | undefined {
  return readString(payload, ['task_id', 'taskId', 'node_id', 'nodeId']);
}

export function formatTickerEvent(
  eventType: string,
  payload: Record<string, unknown>,
): TickerEventRecord | null {
  if (
    eventType !== 'task.scored' &&
    eventType !== 'skill.completed' &&
    eventType !== 'briefing.ready' &&
    eventType !== 'task.state_changed' &&
    eventType !== 'approval.pending'
  ) {
    return null;
  }

  const timestamp =
    readString(payload, ['timestamp', 'occurred_at', 'created_at', 'completed_at']) ??
    new Date().toISOString();
  const taskId = getTaskId(payload);
  const explicitMessage = readString(payload, ['message', 'summary']);

  if (eventType === 'task.scored') {
    const scoredCount = readNumber(payload, ['tasks_scored', 'tasksScored', 'count']);
    const topTask = readString(payload, ['top_task_title', 'topTaskTitle', 'title']);

    return {
      eventType,
      timestamp,
      time: formatTime(timestamp),
      dotColor: 'green',
      message:
        explicitMessage ??
        (scoredCount !== undefined
          ? `Scored ${scoredCount} tasks${topTask ? ` - top priority: ${topTask}` : ''}`
          : 'Task scoring cycle completed.'),
      taskId,
    };
  }

  if (eventType === 'skill.completed') {
    const skillName = readString(payload, ['skill_name', 'skillName']) ?? 'Skill';
    const status = readString(payload, ['status'])?.toUpperCase();
    const failed = status === 'FAILED' || status === 'ERROR' || status === 'TIMEOUT';

    return {
      eventType,
      timestamp,
      time: formatTime(timestamp),
      dotColor: failed ? 'red' : 'purple',
      message: explicitMessage ?? `${skillName} ${failed ? 'failed' : 'completed'}.`,
      taskId,
    };
  }

  if (eventType === 'briefing.ready') {
    return {
      eventType,
      timestamp,
      time: formatTime(timestamp),
      dotColor: 'blue',
      message: explicitMessage ?? 'Daily briefing is ready.',
      taskId,
    };
  }

  if (eventType === 'task.state_changed') {
    const nextState = readString(payload, ['to_state', 'toState', 'new_state', 'newState']);

    return {
      eventType,
      timestamp,
      time: formatTime(timestamp),
      dotColor: 'amber',
      message: explicitMessage ?? `Task state changed${nextState ? ` to ${nextState}` : ''}.`,
      taskId,
    };
  }

  return {
    eventType,
    timestamp,
    time: formatTime(timestamp),
    dotColor: 'red',
    message: explicitMessage ?? 'Approval is pending human review.',
    taskId,
  };
}
