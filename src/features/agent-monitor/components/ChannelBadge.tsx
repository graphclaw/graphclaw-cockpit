type ChannelKind = 'email' | 'cli' | 'api' | 'web' | 'unknown';

interface ChannelBadgeProps {
  channel: string | null | undefined;
}

interface ChannelTokens {
  bg: string;
  fg: string;
}

const TOKENS: Record<ChannelKind, ChannelTokens> = {
  email: { bg: 'var(--ch-email-bg)', fg: 'var(--ch-email-fg)' },
  cli: { bg: 'var(--ch-cli-bg)', fg: 'var(--ch-cli-fg)' },
  api: { bg: 'var(--ch-api-bg)', fg: 'var(--ch-api-fg)' },
  web: { bg: 'var(--ch-web-bg)', fg: 'var(--ch-web-fg)' },
  unknown: { bg: 'var(--ch-neutral-bg)', fg: 'var(--ch-neutral-fg)' },
};

function normalizeChannel(channel: string | null | undefined): { kind: ChannelKind; label: string } {
  const normalized = channel?.trim().toLowerCase() ?? '';

  if (normalized === 'email' || normalized === 'cli' || normalized === 'api' || normalized === 'web') {
    return { kind: normalized, label: normalized.toUpperCase() };
  }

  if (normalized.length > 0) {
    return { kind: 'unknown', label: normalized.toUpperCase() };
  }

  return { kind: 'unknown', label: 'UNKNOWN' };
}

export function ChannelBadge({ channel }: ChannelBadgeProps) {
  const { kind, label } = normalizeChannel(channel);
  const tokens = TOKENS[kind];

  return (
    <span
      className="inline-flex rounded-full border border-[var(--border-default)] px-2 py-0.5 text-[11px] font-semibold tracking-wide"
      style={{ backgroundColor: tokens.bg, color: tokens.fg }}
      data-testid={`channel-badge-${kind}`}
      title={`Channel: ${label}`}
    >
      {label}
    </span>
  );
}
