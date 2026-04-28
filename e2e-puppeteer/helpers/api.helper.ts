import { API_BASE } from './auth.helper';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  ok: boolean;
}

// ── ApiClient ─────────────────────────────────────────────────────────────────
/**
 * Thin fetch wrapper that hits the REAL FastAPI backend at /app/v1/.
 * No mocks, no stubs — every call goes to the live service.
 *
 * Usage:
 *   const api = new ApiClient(token);
 *   const { body } = await api.post<Task>('/graph/tasks', { task_type: 'ATOMIC', title: 'x' });
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

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const url = `${this.base}/app/v1${path}`;
    const init: RequestInit = {
      method,
      headers: this.headers,
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    const res = await fetch(url, init);
    let parsed: T;
    const text = await res.text();
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
