import { useMemo } from 'react';
import {
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
  hasNextPage: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useActivityFeed(
  timeRange: ActivityTimeRange,
  activityType: AgentActivityType,
  limit = 25,
): UseActivityFeedResult {
  const bounds = useMemo(() => getBounds(timeRange), [timeRange]);

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

  return {
    items,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    error: (query.error as Error | null) ?? null,
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
