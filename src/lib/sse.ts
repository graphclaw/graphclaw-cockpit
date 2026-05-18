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
  | 'agent.status_changed'
  | 'notification.new'
  | 'onboarding_needed'
  | 'onboarding_complete';

interface SSEEvent {
  type?: EventType;
  event_type?: EventType;
  data: Record<string, unknown>;
}

export interface OnboardingStatus {
  needed: boolean;
  state?: string;
  step?: number;
  total_steps?: number;
}

type OnboardingListener = (status: OnboardingStatus) => void;
const _onboardingListeners = new Set<OnboardingListener>();
let _lastOnboardingStatus: OnboardingStatus | null = null;

export function addOnboardingListener(fn: OnboardingListener): () => void {
  _onboardingListeners.add(fn);
  // Replay last known status so late-mounting components don't miss the event
  if (_lastOnboardingStatus !== null) {
    fn(_lastOnboardingStatus);
  }
  return () => _onboardingListeners.delete(fn);
}

const INVALIDATION_MAP: Partial<Record<EventType, string[][]>> = {
  'task.state_changed': [['graph', 'tasks'], ['graph', 'goals']],
  'task.scored': [['scoring'], ['graph', 'tasks']],
  'task.created': [['graph', 'tasks'], ['graph', 'goals']],
  'approval.pending': [['approvals']],
  'briefing.ready': [['briefing']],
  'agent.status_changed': [['agent']],
  'notification.new': [['notifications']],
};

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectAttempts = 0;

function buildSseUrl(baseUrl: string): string {
  const token = localStorage.getItem('gc-access-token');
  if (!token) {
    return baseUrl;
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}access_token=${encodeURIComponent(token)}`;
}

function invalidateForEvent(eventType: EventType): void {
  const keys = INVALIDATION_MAP[eventType];
  if (!keys) {
    return;
  }

  for (const key of keys) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

function notifyOnboarding(eventType: EventType, payload: Record<string, unknown>): void {
  if (eventType !== 'onboarding_needed' && eventType !== 'onboarding_complete') {
    return;
  }

  const status: OnboardingStatus =
    eventType === 'onboarding_needed'
      ? { needed: true, ...(payload as Omit<OnboardingStatus, 'needed'>) }
      : { needed: false };

  _lastOnboardingStatus = status;
  for (const fn of _onboardingListeners) {
    fn(status);
  }

  // Refresh profile name after onboarding state changes.
  queryClient.invalidateQueries({ queryKey: ['profile'] });
}

function handleEvent(eventType: EventType, event: MessageEvent<string>): void {
  logger.debug('sse.event', { event_name: eventType });

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(event.data) as Record<string, unknown>;
  } catch {
    // Keep payload empty for non-JSON frames.
  }

  notifyOnboarding(eventType, payload);
  invalidateForEvent(eventType);
}

export function connectSSE(url: string = '/app/v1/events') {
  if (eventSource) {
    eventSource.close();
  }

  const eventUrl = buildSseUrl(url);
  eventSource = new EventSource(eventUrl);
  reconnectAttempts = 0;
  logger.info('sse.connecting', { url: eventUrl });

  eventSource.onopen = () => {
    reconnectAttempts = 0;
    logger.info('sse.connected', { url: eventUrl });
  };

  for (const eventType of Object.keys(INVALIDATION_MAP) as EventType[]) {
    eventSource.addEventListener(eventType, (event: MessageEvent<string>) => {
      handleEvent(eventType, event);
    });
  }

  eventSource.addEventListener('onboarding_needed', (event: MessageEvent<string>) => {
    handleEvent('onboarding_needed', event);
  });

  eventSource.addEventListener('onboarding_complete', (event: MessageEvent<string>) => {
    handleEvent('onboarding_complete', event);
  });

  eventSource.addEventListener('connected', (event: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(event.data) as Record<string, unknown>;
      logger.info('sse.connected_event', payload);
    } catch {
      logger.info('sse.connected_event');
    }
  });

  eventSource.addEventListener('error', (event: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(event.data) as Record<string, unknown>;
      logger.error('sse.stream_error', payload);
    } catch {
      logger.error('sse.stream_error');
    }
  });

  eventSource.onmessage = (event) => {
    try {
      const parsed: SSEEvent = JSON.parse(event.data);
      const eventType = parsed.type ?? parsed.event_type;
      if (eventType) {
        logger.debug('sse.message_event', { event_name: eventType });
        notifyOnboarding(eventType, parsed.data ?? {});
        invalidateForEvent(eventType);
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
    logger.warn('sse.reconnecting', { attempt: reconnectAttempts, delay_ms: delay, url: eventUrl });
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
