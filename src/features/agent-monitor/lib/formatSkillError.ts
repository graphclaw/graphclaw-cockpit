function trimTo80(value: string): string {
  const normalized = value.trim();
  if (normalized.length <= 80) {
    return normalized;
  }

  return `${normalized.slice(0, 77)}...`;
}

function readFirstString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
}

function readTimeoutSeconds(error: unknown, text: string): string | null {
  if (error && typeof error === 'object') {
    const fromObject = readFirstString(
      (error as Record<string, unknown>).timeout_seconds,
      (error as Record<string, unknown>).timeoutSeconds,
      (error as Record<string, unknown>).duration_seconds,
      (error as Record<string, unknown>).durationSeconds,
    );

    if (fromObject) {
      return fromObject;
    }
  }

  const match = text.match(/(?:after|in)\s*(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)\b/i)
    ?? text.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)\b/i);

  return match?.[1] ?? null;
}

function normalizeErrorText(error: unknown): string {
  if (typeof error === 'string') {
    return error.trim();
  }

  if (!error || typeof error !== 'object') {
    return '';
  }

  const record = error as Record<string, unknown>;
  const name = readFirstString(record.name, record.error_type, record.type, record.code);
  const message = readFirstString(record.message, record.error, record.detail, record.reason, record.cause);

  if (name && message) {
    return `${name}: ${message}`;
  }

  return name ?? message ?? '';
}

export function formatSkillError(error: unknown): string {
  const text = normalizeErrorText(error);
  if (!text) {
    return 'failed';
  }

  const lowered = text.toLowerCase();

  if (lowered.includes('timeouterror') || lowered.includes('timed out') || lowered.includes('timeout')) {
    const seconds = readTimeoutSeconds(error, text);
    return seconds ? `timed out after ${seconds}s` : 'timed out';
  }

  if (lowered.includes('toolnotfound') || lowered.includes('tool not found')) {
    return 'skill setup is missing - check Settings';
  }

  if (lowered.includes('validationerror') || lowered.includes('validation error')) {
    return 'input validation failed';
  }

  return trimTo80(text);
}