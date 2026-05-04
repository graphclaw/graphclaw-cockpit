import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTickerEvent, type SupportedTickerEventType } from '@/features/agent-monitor/lib/formatEvent';
import {
  useAgentSessions,
  useInfiniteAgentActivity,
  type AgentActivityItem,
  type AgentActivityType,
} from '@/lib/api-hooks';

export type ActivityTimeRange = 'last-hour' | 'today' | 'last-7-days';

interface ActivityBounds {
  from: string;
  to: string;
}

const LIVE_EVENT_TYPES: SupportedTickerEventType[] = [
  'task.scored',
  'skill.completed',
  'briefing.ready',
  'task.state_changed',
  'approval.pending',
];

const LIVE_BUFFER_LIMIT = 100;

function getBounds(range: ActivityTimeRange, now = new Date()): ActivityBounds {
  const to = now;

  if (range === 'last-hour') {
    return {
      from: new Date(to.getTime() - 60 * 60 * 1000).toISOString(),
      to: to.toISOString(),
    };
  }

  if (range === 'last-7-days') {
    return {
      from: new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: to.toISOString(),
    };
  }

  const startOfTodayUtc = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  return {
    from: startOfTodayUtc.toISOString(),
    to: to.toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function itemKey(item: AgentActivityItem): string {
  return [item.timestamp, item.event_type, item.task_id ?? '', item.session_id ?? '', item.message].join('|');
}

function mergeUniqueItems(items: AgentActivityItem[]): AgentActivityItem[] {
  const unique: AgentActivityItem[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const key = itemKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

function liveStatus(eventType: SupportedTickerEventType, payload: Record<string, unknown>): string {
  if (eventType === 'task.state_changed') {
    return 'running';
  }

  if (eventType === 'briefing.ready') {
    return 'trigger';
  }

  if (eventType === 'skill.completed') {
    const status = readString(payload.status)?.toUpperCase();
    if (status === 'FAILED' || status === 'ERROR' || status === 'TIMEOUT') {
      return 'failed';
    }
  }

  return 'done';
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toLiveItem(
  eventType: SupportedTickerEventType,
  payload: Record<string, unknown>,
): AgentActivityItem | null {
  const formatted = formatTickerEvent(eventType, payload);
  if (!formatted) {
    return null;
  }

  return {
    timestamp: formatted.timestamp,
    event_type: formatted.eventType,
    message: formatted.message,
    task_id: formatted.taskId ?? null,
    status: liveStatus(eventType, payload),
    session_id: readString(payload.session_id) ?? readString(payload.sessionId),
    raw: payload,
  };
}

export interface UseActivityFeedResult {
  items: AgentActivityItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  sessionViewAvailable: boolean;
  sessionMetaById: Record<string, ActivitySessionMeta>;
  hasNextPage: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export interface ActivitySessionMeta {
  sessionId: string;
  triggerType: string;
}

function toSessionMeta(raw: Record<string, unknown>): ActivitySessionMeta | null {
  const sessionId = readString(raw.session_id) ?? readString(raw.sessionId);
  if (!sessionId) {
    return null;
  }

  const triggerType =
    readString(raw.trigger_type) ??
    readString(raw.triggerType) ??
    readString(raw.status) ??
    'Agent run';

  return {
    sessionId,
    triggerType,
  };
}

export function useActivityFeed(
  timeRange: ActivityTimeRange,
  activityType: AgentActivityType,
  limit = 25,
): UseActivityFeedResult {
  const bounds = useMemo(() => getBounds(timeRange), [timeRange]);
  const sessionsQuery = useAgentSessions(50);

  const query = useInfiniteAgentActivity(
    {
      from: bounds.from,
      to: bounds.to,
      type: activityType,
      limit,
    },
    true,
  );

  const [liveItems, setLiveItems] = useState<AgentActivityItem[]>([]);
  const pendingItemsRef = useRef<AgentActivityItem[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pagedItems = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items),
    [query.data?.pages],
  );

  useEffect(() => {
    if (timeRange !== 'today') {
      setLiveItems([]);
      pendingItemsRef.current = [];
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    }
  }, [timeRange]);

  useEffect(() => {
    if (timeRange !== 'today' || typeof EventSource === 'undefined') {
      return;
    }

    const source = new EventSource('/app/v1/events');
    const handlers: Array<[SupportedTickerEventType, (event: MessageEvent<string>) => void]> = [];

    const scheduleFlush = () => {
      if (flushTimerRef.current) {
        return;
      }

      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        if (pendingItemsRef.current.length === 0) {
          return;
        }

        const nextItems = pendingItemsRef.current;
        pendingItemsRef.current = [];

        setLiveItems((previous) =>
          mergeUniqueItems([...nextItems, ...previous]).slice(0, LIVE_BUFFER_LIMIT),
        );
      }, 1000);
    };

    LIVE_EVENT_TYPES.forEach((eventType) => {
      const handler = (event: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(event.data) as unknown;
          if (!isRecord(payload)) {
            return;
          }

          const liveItem = toLiveItem(eventType, payload);
          if (!liveItem) {
            return;
          }

          pendingItemsRef.current = [liveItem, ...pendingItemsRef.current];
          scheduleFlush();
        } catch {
          // Ignore malformed SSE payloads.
        }
      };

      handlers.push([eventType, handler]);
      source.addEventListener(eventType, handler as EventListener);
    });

    return () => {
      handlers.forEach(([eventType, handler]) => {
        source.removeEventListener(eventType, handler as EventListener);
      });
      source.close();
      pendingItemsRef.current = [];
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [timeRange]);

  const items = useMemo(() => {
    if (timeRange !== 'today' || liveItems.length === 0) {
      return pagedItems;
    }
    return mergeUniqueItems([...liveItems, ...pagedItems]);
  }, [liveItems, pagedItems, timeRange]);

  const sessionMetaById = useMemo<Record<string, ActivitySessionMeta>>(() => {
    const rawItems = sessionsQuery.data?.items;
    if (!rawItems) {
      return {};
    }

    return rawItems.reduce<Record<string, ActivitySessionMeta>>((acc, item) => {
      const meta = toSessionMeta(item as Record<string, unknown>);
      if (!meta) {
        return acc;
      }
      acc[meta.sessionId] = meta;
      return acc;
    }, {});
  }, [sessionsQuery.data?.items]);

  const sessionViewAvailable = Object.keys(sessionMetaById).length > 0;

  return {
    items,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    error: (query.error as Error | null) ?? null,
    sessionViewAvailable,
    sessionMetaById,
    hasNextPage: Boolean(query.hasNextPage),
    loadMore: async () => {
      if (!query.hasNextPage || query.isFetchingNextPage) {
        return;
      }
      await query.fetchNextPage();
    },
    refetch: async () => {
      await query.refetch();
    },
  };
}
