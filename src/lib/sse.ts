// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { queryClient } from './query-client';
import { logger } from './logger';

type EventType =
  | 'task.state_changed'
  | 'task.scored'
  | 'task.created'
  | 'approval.pending'
  | 'briefing.ready'
  | 'agent.status_changed';

interface SSEEvent {
  type: EventType;
  data: Record<string, unknown>;
}

const INVALIDATION_MAP: Record<EventType, string[][]> = {
  'task.state_changed': [['graph', 'tasks'], ['graph', 'goals']],
  'task.scored': [['scoring'], ['graph', 'tasks']],
  'task.created': [['graph', 'tasks'], ['graph', 'goals']],
  'approval.pending': [['approvals']],
  'briefing.ready': [['briefing']],
  'agent.status_changed': [['agent']],
};

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectAttempts = 0;

export function connectSSE(url: string = '/app/v1/events') {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource(url);
  reconnectAttempts = 0;
  logger.info('sse.connecting', { url });

  eventSource.onopen = () => {
    reconnectAttempts = 0;
    logger.info('sse.connected', { url });
  };

  eventSource.onmessage = (event) => {
    try {
      const parsed: SSEEvent = JSON.parse(event.data);
      logger.debug('sse.event', { event_name: parsed.type });
      const keys = INVALIDATION_MAP[parsed.type];
      if (keys) {
        for (const key of keys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
    } catch {
      // Ignore non-JSON messages (heartbeats, etc.)
    }
  };

  eventSource.onerror = () => {
    eventSource?.close();
    eventSource = null;

    // Exponential backoff reconnect
    const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
    reconnectAttempts++;
    logger.warn('sse.reconnecting', { attempt: reconnectAttempts, delay_ms: delay, url });
    reconnectTimer = setTimeout(() => connectSSE(url), delay);
  };
}

export function disconnectSSE() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    logger.info('sse.disconnected');
  }
  reconnectAttempts = 0;
}
