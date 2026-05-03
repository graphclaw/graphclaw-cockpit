const ATTENTION_DISMISS_STORAGE_KEY = 'gc:attention:dismissed';
export const DEFAULT_ATTENTION_DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

type AttentionDismissStore = Record<string, number>;

function hasWindowStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readAttentionDismissStore(): AttentionDismissStore {
  if (!hasWindowStorage()) {
    return {};
  }

  const rawValue = window.localStorage.getItem(ATTENTION_DISMISS_STORAGE_KEY);
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const output: AttentionDismissStore = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        output[key] = value;
      }
    }

    return output;
  } catch {
    return {};
  }
}

function writeAttentionDismissStore(store: AttentionDismissStore): void {
  if (!hasWindowStorage()) {
    return;
  }

  window.localStorage.setItem(ATTENTION_DISMISS_STORAGE_KEY, JSON.stringify(store));
}

export function pruneDismissedAttentionItems(now = Date.now()): AttentionDismissStore {
  const store = readAttentionDismissStore();
  const pruned: AttentionDismissStore = {};

  for (const [id, expiresAt] of Object.entries(store)) {
    if (expiresAt > now) {
      pruned[id] = expiresAt;
    }
  }

  writeAttentionDismissStore(pruned);
  return pruned;
}

export function isAttentionItemDismissed(id: string, now = Date.now()): boolean {
  const store = pruneDismissedAttentionItems(now);
  const expiresAt = store[id];
  return typeof expiresAt === 'number' && expiresAt > now;
}

export function dismissAttentionItem(
  id: string,
  ttlMs = DEFAULT_ATTENTION_DISMISS_TTL_MS,
  now = Date.now(),
): void {
  const store = pruneDismissedAttentionItems(now);
  store[id] = now + ttlMs;
  writeAttentionDismissStore(store);
}
