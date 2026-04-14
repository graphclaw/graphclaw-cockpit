---
name: cockpit-api-integration
description: openapi-fetch + TanStack Query patterns for GraphClaw Cockpit API integration. Use when creating API hooks or debugging API calls.
---

# Cockpit API Integration

## API Client Setup
```typescript
import createClient from 'openapi-fetch';
import type { paths } from './api-types';

export const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL || '',
});
```

## Query Hook Pattern
```typescript
export function useGoals(cursor?: string) {
  return useQuery({
    queryKey: ['graph', 'goals', { cursor }],
    queryFn: async () => {
      const { data, error } = await client.GET('/app/v1/graph/goals', {
        params: { query: { cursor, limit: 50 } },
      });
      if (error) throw error;
      return data;
    },
  });
}
```

## Pagination Pattern
- Backend uses cursor-based: `{ items, next_cursor, total? }`
- Use TanStack Query `useInfiniteQuery` for infinite scroll
- Pass `next_cursor` as `pageParam`

## Error Handling
- Backend returns RFC 7807: `{ type, title, status, detail, instance }`
- Parse with `parseApiError()` from `src/lib/utils.ts`
- Display via toast notification

## SSE Cache Invalidation
- SSE events map to TanStack Query key invalidation
- `task.state_changed` → invalidate `['graph', 'tasks']`
- `task.scored` → invalidate `['scoring']`
- `approval.pending` → invalidate `['approvals']`
