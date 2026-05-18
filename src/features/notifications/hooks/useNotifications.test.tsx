// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-U-TSK-W09-001 — Notification hooks query and invalidation
 *
 * Scenario: The notifications hooks should load inbox data and invalidate the
 * shared notifications query after read, read-all, and dismiss mutations.
 *
 * PRD: docs/prd/09-notifications.md
 * Build wave: W09
 * Layer: L1 Unit
 * Owner: frontend-team
 * Last reviewed: 2026-05-15
 *
 * Cases covered:
 *  - fetches notifications on mount
 *  - useMarkNotificationRead invalidates and refetches notifications
 *  - useMarkAllNotificationsRead invalidates and refetches notifications
 *  - useDismissNotification invalidates and refetches notifications
 *
 * Notes:
 *  - MSW handlers override /app/v1/notifications* per test.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/server';
import {
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from './useNotifications';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { queryClient, wrapper: Wrapper };
}

describe('useNotifications hooks', () => {
  it('fetches notifications on mount', async () => {
    server.use(
      http.get('/app/v1/notifications', () =>
        HttpResponse.json({
          items: [
            {
              id: 'notif-001',
              event_type: 'task.needs_attention',
              title: 'Task needs attention: Deploy',
              body: 'Transitioned to BLOCKED',
              metadata: {},
              is_read: false,
              read_at: null,
              created_at: new Date().toISOString(),
            },
          ],
          unread_count: 1,
          next_cursor: null,
        }),
      ),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.unread_count).toBe(1);
  });

  it('useMarkNotificationRead invalidates and refetches notifications', async () => {
    let unread = 1;

    server.use(
      http.get('/app/v1/notifications', () =>
        HttpResponse.json({
          items: unread
            ? [
                {
                  id: 'notif-001',
                  event_type: 'task.needs_attention',
                  title: 'Task blocked',
                  body: '',
                  metadata: {},
                  is_read: false,
                  read_at: null,
                  created_at: new Date().toISOString(),
                },
              ]
            : [],
          unread_count: unread,
          next_cursor: null,
        }),
      ),
      http.patch('/app/v1/notifications/:id/read', () => {
        unread = 0;
        return HttpResponse.json({ id: 'notif-001', ok: true });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => ({
        query: useNotifications(),
        mutation: useMarkNotificationRead(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.query.data?.unread_count).toBe(1));
    await result.current.mutation.mutateAsync('notif-001');
    await waitFor(() => expect(result.current.query.data?.unread_count).toBe(0));
  });

  it('useMarkAllNotificationsRead invalidates and refetches notifications', async () => {
    let unread = 2;

    server.use(
      http.get('/app/v1/notifications', () =>
        HttpResponse.json({
          items: unread
            ? [
                {
                  id: 'notif-001',
                  event_type: 'task.needs_attention',
                  title: 'Task blocked',
                  body: '',
                  metadata: {},
                  is_read: false,
                  read_at: null,
                  created_at: new Date().toISOString(),
                },
              ]
            : [],
          unread_count: unread,
          next_cursor: null,
        }),
      ),
      http.post('/app/v1/notifications/read-all', () => {
        unread = 0;
        return HttpResponse.json({ updated: 2, ok: true });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => ({
        query: useNotifications(),
        mutation: useMarkAllNotificationsRead(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.query.data?.unread_count).toBe(2));
    await result.current.mutation.mutateAsync();
    await waitFor(() => expect(result.current.query.data?.unread_count).toBe(0));
  });

  it('useDismissNotification invalidates and refetches notifications', async () => {
    let dismissed = false;

    server.use(
      http.get('/app/v1/notifications', () =>
        HttpResponse.json({
          items: dismissed
            ? []
            : [
                {
                  id: 'notif-001',
                  event_type: 'task.needs_attention',
                  title: 'Task blocked',
                  body: '',
                  metadata: {},
                  is_read: false,
                  read_at: null,
                  created_at: new Date().toISOString(),
                },
              ],
          unread_count: dismissed ? 0 : 1,
          next_cursor: null,
        }),
      ),
      http.delete('/app/v1/notifications/:id', () => {
        dismissed = true;
        return HttpResponse.json({ id: 'notif-001', ok: true });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => ({
        query: useNotifications(),
        mutation: useDismissNotification(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.query.data?.items).toHaveLength(1));
    await result.current.mutation.mutateAsync('notif-001');
    await waitFor(() => expect(result.current.query.data?.items).toHaveLength(0));
  });
});