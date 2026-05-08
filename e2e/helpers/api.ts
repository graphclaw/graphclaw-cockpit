// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
export const TEST_USER_ID = 'USER-dev-001';
export const API_BASE = process.env.API_URL ?? 'http://localhost:8000';
export const APP_BASE = process.env.BASE_URL ?? 'http://localhost:3000';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  ok: boolean;
}

// ── ApiClient ─────────────────────────────────────────────────────────────────
/**
 * Thin fetch wrapper that hits the REAL FastAPI backend at /app/v1/.
 * No mocks — every call goes to the live service.
 */
export class ApiClient {
  private readonly headers: Record<string, string>;
  private readonly base: string;

  constructor(token: string, base: string = API_BASE) {
    this.base = base;
    this.headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = `${this.base}/app/v1${path}`;
    const init: RequestInit = { method, headers: this.headers };
    if (body !== undefined) init.body = JSON.stringify(body);
    const res = await fetch(url, init);
    const text = await res.text();
    let parsed: T;
    try {
      parsed = text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      parsed = text as unknown as T;
    }
    return { status: res.status, body: parsed, ok: res.ok };
  }

  get<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path);
  }

  post<T = unknown>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data);
  }

  patch<T = unknown>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data);
  }

  put<T = unknown>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data);
  }

  delete(path: string): Promise<ApiResponse<undefined>> {
    return this.request<undefined>('DELETE', path);
  }
}

// ── Dev token helper ──────────────────────────────────────────────────────────
export async function getDevToken(): Promise<{ access_token: string; refresh_token: string }> {
  await new Promise<void>((r) => setTimeout(r, 1000));
  const res = await fetch(`${API_BASE}/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: TEST_USER_ID }),
  });
  if (!res.ok) throw new Error(`getDevToken failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; refresh_token: string }>;
}
