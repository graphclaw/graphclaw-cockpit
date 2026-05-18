// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface NotificationItem {
  id: string;
  event_type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
  next_cursor: string | null;
}

function authHeaders(): Headers {
  const h = new Headers({ 'Content-Type': 'application/json' });
  const token = localStorage.getItem('gc-access-token');
  if (token) h.set('Authorization', `Bearer ${token}`);
  return h;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function apiMutate<T>(path: string, method: string): Promise<T> {
  const res = await fetch(path, { method, headers: authHeaders() });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const NOTIFICATIONS_KEY = ['notifications'] as const;

export function useNotifications(limit = 30) {
  return useQuery<NotificationListResponse>({
    queryKey: [...NOTIFICATIONS_KEY, { limit }],
    queryFn: () =>
      apiFetch<NotificationListResponse>(`/app/v1/notifications?limit=${limit}`),
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiMutate<{ id: string; ok: boolean }>(`/app/v1/notifications/${id}/read`, 'PATCH'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiMutate<{ updated: number; ok: boolean }>('/app/v1/notifications/read-all', 'POST'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useDismissNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiMutate<{ id: string; ok: boolean }>(`/app/v1/notifications/${id}`, 'DELETE'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
