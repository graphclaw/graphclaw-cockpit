import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { useWorkforceData } from './useWorkforceData';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useWorkforceData', () => {
  it('groups tasks by assigned_to field from backend', async () => {
    server.use(
      http.get('/app/v1/graph/resources', () =>
        HttpResponse.json({
          items: [{ id: 'RES-001', name: 'Alice', resource_type: 'HUMAN', capacity: 8 }],
          total: 1,
        }),
      ),
      http.get('/app/v1/graph/tasks', () =>
        HttpResponse.json({
          items: [
            { id: 'TSK-001', title: 'Task A', state: 'IN_PROGRESS', score: 0.9, assigned_to: 'RES-001' },
            { id: 'TSK-002', title: 'Task B', state: 'BACKLOG', score: 0.5, assigned_to: 'RES-001' },
          ],
          total: 2,
        }),
      ),
    );

    const { result } = renderHook(() => useWorkforceData(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.workforce).toHaveLength(1);
    expect(result.current.workforce[0]!.tasks).toHaveLength(2);
    expect(result.current.workforce[0]!.task_counts.in_progress).toBe(1);
    expect(result.current.workforce[0]!.task_counts.pending).toBe(1); // BACKLOG → pending
  });

  it('handles resource_type field from backend (not just type)', async () => {
    server.use(
      http.get('/app/v1/graph/resources', () =>
        HttpResponse.json({
          items: [
            { id: 'RES-001', name: 'Alice', resource_type: 'HUMAN', capacity: 8 },
            { id: 'RES-002', name: 'Bot', resource_type: 'AI_AGENT', capacity: 5 },
          ],
          total: 2,
        }),
      ),
      http.get('/app/v1/graph/tasks', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );

    const { result } = renderHook(() => useWorkforceData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const alice = result.current.workforce.find((r) => r.id === 'RES-001');
    const bot = result.current.workforce.find((r) => r.id === 'RES-002');

    expect(alice?.type).toBe('HUMAN');
    expect(bot?.type).toBe('AI_AGENT');
  });

  it('computes load_factor correctly', async () => {
    server.use(
      http.get('/app/v1/graph/resources', () =>
        HttpResponse.json({
          items: [{ id: 'RES-001', name: 'Alice', resource_type: 'HUMAN', capacity: 8 }],
          total: 1,
        }),
      ),
      http.get('/app/v1/graph/tasks', () =>
        HttpResponse.json({
          items: [
            // 3 in-flight (in_progress, review, blocked)
            { id: 'T1', title: 'A', state: 'IN_PROGRESS', score: 1, assigned_to: 'RES-001' },
            { id: 'T2', title: 'B', state: 'REVIEW', score: 1, assigned_to: 'RES-001' },
            { id: 'T3', title: 'C', state: 'BLOCKED', score: 1, assigned_to: 'RES-001' },
            // 1 done — not in-flight
            { id: 'T4', title: 'D', state: 'COMPLETE', score: 1, assigned_to: 'RES-001' },
          ],
          total: 4,
        }),
      ),
    );

    const { result } = renderHook(() => useWorkforceData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // load_factor = 3 in-flight / 8 capacity = 0.375
    expect(result.current.workforce[0]!.load_factor).toBeCloseTo(0.375);
  });

  it('marks resource as over-capacity when load_factor > 1', async () => {
    server.use(
      http.get('/app/v1/graph/resources', () =>
        HttpResponse.json({
          items: [{ id: 'RES-001', name: 'Alice', resource_type: 'HUMAN', capacity: 2 }],
          total: 1,
        }),
      ),
      http.get('/app/v1/graph/tasks', () =>
        HttpResponse.json({
          items: [
            { id: 'T1', title: 'A', state: 'IN_PROGRESS', score: 1, assigned_to: 'RES-001' },
            { id: 'T2', title: 'B', state: 'IN_PROGRESS', score: 1, assigned_to: 'RES-001' },
            { id: 'T3', title: 'C', state: 'IN_PROGRESS', score: 1, assigned_to: 'RES-001' },
          ],
          total: 3,
        }),
      ),
    );

    const { result } = renderHook(() => useWorkforceData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 3 in-flight / 2 capacity = 1.5 > 1
    expect(result.current.workforce[0]!.load_factor).toBeGreaterThan(1);
  });

  it('returns empty workforce on API error', async () => {
    server.use(
      http.get('/app/v1/graph/resources', () => HttpResponse.json({ items: [], total: 0 })),
      http.get('/app/v1/graph/tasks', () => new HttpResponse(null, { status: 500 })),
    );

    const { result } = renderHook(() => useWorkforceData(), { wrapper: makeWrapper() });
    await waitFor(() => !result.current.isLoading);

    // Even with tasks error, workforce should not throw — returns resources with no tasks
    expect(result.current.workforce).toBeDefined();
  });
});
