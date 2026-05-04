import { useMemo } from 'react';
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

function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items),
    [query.data?.pages],
  );

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
