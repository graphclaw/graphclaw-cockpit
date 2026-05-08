// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * Graph Explorer — CRUD mutation hooks.
 *
 * All mutations call the real backend and invalidate ['graph-explorer'] on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

// ── Auth helper ───────────────────────────────────────────────────────────────

function authHeaders(): Headers {
  const headers = new Headers();
  const token = localStorage.getItem('gc-access-token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  return headers;
}

async function apiRequest<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Task mutations ────────────────────────────────────────────────────────────

export interface CreateTaskPayload {
  task_type: string;
  title: string;
  description?: string;
  priority?: string;
  deadline?: string;
  tags?: string[];
  goal_id?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  state?: string;
  priority?: string;
  description?: string;
  deadline?: string | null;
  tags?: string[];
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      apiRequest<{ id: string; title: string; state: string }>(
        '/app/v1/graph/tasks',
        'POST',
        payload,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['graph-explorer'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTaskPayload & { id: string }) =>
      apiRequest<Record<string, unknown>>(`/app/v1/graph/tasks/${id}`, 'PATCH', payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['graph-explorer'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<undefined>(`/app/v1/graph/tasks/${id}`, 'DELETE'),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['graph-explorer'] });
    },
  });
}

// ── Edge mutations ────────────────────────────────────────────────────────────

export interface CreateEdgePayload {
  source_id: string;
  target_id: string;
  edge_type: string;
  metadata?: {
    gate_type?: string;
    strength?: string;
    sequence_order?: number;
    note?: string;
  };
}

export function useCreateEdge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEdgePayload) =>
      apiRequest<{ edge_id: string; source_id: string; target_id: string; edge_type: string }>(
        '/app/v1/graph/edges',
        'POST',
        payload,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['graph-explorer'] });
    },
  });
}

export function useDeleteEdge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (edgeId: string) =>
      apiRequest<undefined>(`/app/v1/graph/edges/${edgeId}`, 'DELETE'),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['graph-explorer'] });
    },
  });
}
