// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-U-TSK-W09-002 — SSE event parsing and invalidation behavior
 *
 * Scenario: The SSE client should append auth token query params, invalidate
 * mapped TanStack Query keys for named and fallback events, and notify
 * onboarding listeners when onboarding events arrive.
 *
 * PRD: docs/prd/09-notifications.md
 * Build wave: W09
 * Layer: L1 Unit
 * Owner: frontend-team
 * Last reviewed: 2026-05-17
 *
 * Cases covered:
 *  - connectSSE appends access_token and invalidates queries for named events
 *  - onmessage fallback uses event_type/type payloads and notifies onboarding listeners
 *  - disconnectSSE closes the active EventSource
 *
 * Notes:
 *  - EventSource is mocked to avoid network usage in unit tests.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const invalidateQueries = vi.fn();
const logger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.mock('./query-client', () => ({
  queryClient: {
    invalidateQueries,
  },
}));

vi.mock('./logger', () => ({
  logger,
}));

class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly url: string;
  closed = false;
  onopen: ((this: EventSource, ev: Event) => unknown) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent<string>) => unknown) | null = null;
  onerror: ((this: EventSource, ev: Event) => unknown) | null = null;

  private readonly listeners = new Map<string, ((ev: MessageEvent<string>) => unknown)[]>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    if (typeof listener === 'function') {
      this.listeners.get(type)?.push(listener as (ev: MessageEvent<string>) => unknown);
      return;
    }

    this.listeners.get(type)?.push((event: MessageEvent<string>) => listener.handleEvent(event));
  }

  close(): void {
    this.closed = true;
  }

  emit(type: string, payload: Record<string, unknown>): void {
    const event = { data: JSON.stringify(payload) } as MessageEvent<string>;
    const handlers = this.listeners.get(type) ?? [];
    for (const handler of handlers) {
      handler(event);
    }
  }
}

describe('sse client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    MockEventSource.instances = [];
    globalThis.EventSource = MockEventSource as unknown as typeof EventSource;
  });

  it('connectSSE appends access_token and invalidates queries for named events', async () => {
    localStorage.setItem('gc-access-token', 'abc 123');
    const { connectSSE } = await import('./sse');

    connectSSE('/app/v1/events');

    const [instance] = MockEventSource.instances;
    expect(instance).toBeDefined();
    expect(instance.url).toContain('/app/v1/events?access_token=abc%20123');

    instance.emit('notification.new', { unread_count: 2 });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notifications'] });
  });

  it('onmessage fallback uses event_type payloads and notifies onboarding listeners', async () => {
    const { addOnboardingListener, connectSSE } = await import('./sse');
    const listener = vi.fn();
    const unsubscribe = addOnboardingListener(listener);

    connectSSE('/app/v1/events');
    const [instance] = MockEventSource.instances;

    instance.onmessage?.call(instance as unknown as EventSource, {
      data: JSON.stringify({
        event_type: 'task.scored',
        data: { task_id: 'TSK-1' },
      }),
    } as MessageEvent<string>);

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['scoring'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['graph', 'tasks'] });

    instance.onmessage?.call(instance as unknown as EventSource, {
      data: JSON.stringify({
        type: 'onboarding_needed',
        data: { state: 'PENDING', step: 1, total_steps: 3 },
      }),
    } as MessageEvent<string>);

    expect(listener).toHaveBeenCalledWith({
      needed: true,
      state: 'PENDING',
      step: 1,
      total_steps: 3,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile'] });

    unsubscribe();
  });

  it('disconnectSSE closes the active EventSource', async () => {
    const { connectSSE, disconnectSSE } = await import('./sse');

    connectSSE('/app/v1/events');
    const [instance] = MockEventSource.instances;

    disconnectSSE();

    expect(instance.closed).toBe(true);
  });
});
