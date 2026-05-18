// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChannels, useActivateChannel, useDeactivateChannel } from '@/lib/api-hooks';

interface ChannelMeta {
  name: string;
  icon: string;
  identityLabel: string;
  identityPlaceholder: string;
  identityKey: string;
}

const CHANNEL_META: Record<string, ChannelMeta> = {
  email: {
    name: 'Email (IMAP)',
    icon: '📧',
    identityLabel: 'Your email address',
    identityPlaceholder: 'you@example.com',
    identityKey: 'user_email',
  },
  telegram: {
    name: 'Telegram',
    icon: '✈️',
    identityLabel: 'Your Telegram handle',
    identityPlaceholder: '@username or numeric ID',
    identityKey: 'telegram_username',
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: '📱',
    identityLabel: 'Your phone number',
    identityPlaceholder: '+1 555 000 0000',
    identityKey: 'whatsapp_phone',
  },
  slack: {
    name: 'Slack',
    icon: '💬',
    identityLabel: 'Your Slack username',
    identityPlaceholder: '@username',
    identityKey: 'slack_user_id',
  },
  teams: {
    name: 'Teams',
    icon: '🟦',
    identityLabel: 'Your Teams email',
    identityPlaceholder: 'you@tenant.onmicrosoft.com',
    identityKey: 'teams_email',
  },
};

function getIdentityValue(config: Record<string, string> | undefined, key: string): string {
  return config?.[key] ?? '';
}

export function ChannelsPage() {
  const { data: channels = [], isLoading } = useChannels();
  const activate = useActivateChannel();
  const deactivate = useDeactivateChannel();

  // Local draft state: channel key → identity input value
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const displayed =
    channels.length > 0
      ? channels
      : [
          { channel: 'email', active: false, config: {} },
          { channel: 'telegram', active: false, config: {} },
          { channel: 'whatsapp', active: false, config: {} },
          { channel: 'slack', active: false, config: {} },
        ];

  function handleSave(ch: string, meta: ChannelMeta) {
    const identity = drafts[ch] ?? '';
    activate.mutate({
      ch,
      config: identity ? { [meta.identityKey]: identity } : {},
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Channels</h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          Link your identities on each channel so the agent can route messages to you.
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--state-info)] bg-[var(--state-info)]/10 px-4 py-3 text-xs text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)]">Admin-configured:</strong> Channel credentials
        (IMAP, bot tokens) are set by the system administrator and require a server restart to change.
        Your identity on each channel is what you configure here.
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="channels-grid">
          {displayed.map((ch) => {
            const meta = CHANNEL_META[ch.channel] ?? {
              name: ch.channel,
              icon: '🔌',
              identityLabel: 'Identity',
              identityPlaceholder: '',
              identityKey: 'value',
            };
            const savedIdentity = getIdentityValue(ch.config as Record<string, string>, meta.identityKey);
            const draftValue = drafts[ch.channel] ?? savedIdentity;
            const isPending = activate.isPending || deactivate.isPending;

            return (
              <Card key={ch.channel} data-testid={`channel-card-${ch.channel}`}>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span>{meta.icon}</span>
                    {meta.name}
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] text-[var(--text-tertiary)]">
                      Admin Configured
                    </Badge>
                    <Badge
                      variant={ch.active ? 'active' : 'outline'}
                      data-testid={`channel-status-${ch.channel}`}
                    >
                      {ch.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Identity input */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`identity-${ch.channel}`}
                      className="text-xs text-[var(--text-secondary)]"
                    >
                      {meta.identityLabel}
                    </Label>
                    <Input
                      id={`identity-${ch.channel}`}
                      data-testid={`identity-input-${ch.channel}`}
                      placeholder={meta.identityPlaceholder}
                      value={draftValue}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [ch.channel]: e.target.value }))
                      }
                      className="h-8 text-sm"
                    />
                    {savedIdentity && (
                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        Linked: {savedIdentity}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={isPending || !draftValue.trim()}
                      onClick={() => handleSave(ch.channel, meta)}
                      data-testid={`activate-btn-${ch.channel}`}
                    >
                      {ch.active ? 'Update' : 'Activate'}
                    </Button>
                    {ch.active && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => deactivate.mutate(ch.channel)}
                        data-testid={`deactivate-btn-${ch.channel}`}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
