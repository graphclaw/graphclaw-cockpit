import { act, renderHook } from '@testing-library/react';
import {
  useAgentSessions,
  useInfiniteAgentActivity,
  type AgentActivityItem,
} from '@/lib/api-hooks';
import { useActivityFeed } from './useActivityFeed';

vi.mock('@/lib/api-hooks', () => ({
  useAgentSessions: vi.fn(),
  useInfiniteAgentActivity: vi.fn(),
}));

type EventHandler = (event: MessageEvent<string>) => void;

class FakeEventSource {
  static lastInstance: FakeEventSource | null = null;

  private readonly handlers = new Map<string, Set<EventHandler>>();

  constructor(public readonly url: string) {
    FakeEventSource.lastInstance = this;
  }

  addEventListener(type: string, handler: EventListener) {
    const cast = handler as EventHandler;
    const group = this.handlers.get(type) ?? new Set<EventHandler>();
    group.add(cast);
    this.handlers.set(type, group);
  }

  removeEventListener(type: string, handler: EventListener) {
    const cast = handler as EventHandler;
    const group = this.handlers.get(type);
    if (!group) {
      return;
    }
    group.delete(cast);
  }

  emit(type: string, payload: Record<string, unknown>) {
    const group = this.handlers.get(type);
    if (!group) {
      return;
    }

    const event = new MessageEvent<string>(type, {
      data: JSON.stringify(payload),
    });

    for (const handler of group) {
      handler(event);
    }
  }

  close() {
    this.handlers.clear();
  }
}

const mockUseAgentSessions = vi.mocked(useAgentSessions);
const mockUseInfiniteAgentActivity = vi.mocked(useInfiniteAgentActivity);

function makeQueryItems(items: AgentActivityItem[]) {
  return {
    data: {
      pages: [{ items, next_cursor: null }],
    },
    isLoading: false,
    isFetchingNextPage: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn().mockResolvedValue(undefined),
    refetch: vi.fn().mockResolvedValue(undefined),
  };
}

describe('useActivityFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    (globalThis as { EventSource?: typeof EventSource }).EventSource = FakeEventSource as unknown as typeof EventSource;

    mockUseAgentSessions.mockReturnValue({ data: null } as never);
    mockUseInfiniteAgentActivity.mockReturnValue(
      makeQueryItems([
        {
          timestamp: '2026-05-03T09:00:00Z',
          event_type: 'briefing.ready',
          message: 'Daily briefing is ready.',
          task_id: null,
          status: 'trigger',
          session_id: null,
          raw: { event_type: 'briefing.ready' },
        },
      ]) as never,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
    delete (globalThis as { EventSource?: typeof EventSource }).EventSource;
    FakeEventSource.lastInstance = null;
  });

  it('appends today SSE activity events after 1s debounce', () => {
    const { result } = renderHook(() => useActivityFeed('today', 'all', 25));

    const source = FakeEventSource.lastInstance;
    expect(source).not.toBeNull();

    act(() => {
      source?.emit('task.scored', {
        timestamp: '2026-05-03T10:00:00Z',
        tasks_scored: 3,
        task_id: 'TK-2001',
      });
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.items[0]?.event_type).toBe('task.scored');
    expect(result.current.items[0]?.message).toBe('Scored 3 tasks');
  });

  it('keeps non-today ranges in poll-only mode without SSE connection', () => {
    renderHook(() => useActivityFeed('last-hour', 'all', 25));

    expect(FakeEventSource.lastInstance).toBeNull();
  });
});
