export interface ApiError {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export function parseApiError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'status' in error) {
    const e = error as Record<string, unknown>;
    return {
      type: typeof e.type === 'string' ? e.type : undefined,
      title: typeof e.title === 'string' ? e.title : 'An error occurred',
      status: typeof e.status === 'number' ? e.status : 500,
      detail: typeof e.detail === 'string' ? e.detail : undefined,
      instance: typeof e.instance === 'string' ? e.instance : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      title: error.message,
      status: 500,
    };
  }

  return {
    title: 'An unexpected error occurred',
    status: 500,
  };
}

export function getErrorMessage(error: unknown): string {
  const parsed = parseApiError(error);
  return parsed.detail ?? parsed.title;
}
