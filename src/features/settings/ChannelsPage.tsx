import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChannels, useActivateChannel } from '@/lib/api-hooks';

const CHANNEL_META: Record<string, { name: string; icon: string }> = {
  whatsapp: { name: 'WhatsApp', icon: '📱' },
  telegram: { name: 'Telegram', icon: '✈️' },
  email: { name: 'Email (IMAP)', icon: '📧' },
  slack: { name: 'Slack', icon: '💬' },
  teams: { name: 'Teams', icon: '🟦' },
};

export function ChannelsPage() {
  const { data: channels = [], isLoading } = useChannels();
  const activate = useActivateChannel();

  // Merge API channels with known meta; also show fallback channels if API is empty
  const displayed =
    channels.length > 0
      ? channels
      : [
          { channel: 'whatsapp', active: false },
          { channel: 'telegram', active: false },
          { channel: 'email', active: false },
          { channel: 'slack', active: false },
        ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Channels</h2>
        <p className="text-sm text-[var(--text-tertiary)]">Configure inbound message channels.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="channels-grid">
          {displayed.map((ch) => {
            const meta = CHANNEL_META[ch.channel] ?? { name: ch.channel, icon: '🔌' };
            return (
              <Card key={ch.channel}>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span>{meta.icon}</span>
                    {meta.name}
                  </CardTitle>
                  <Badge variant={ch.active ? 'active' : 'outline'}>
                    {ch.active ? 'active' : 'inactive'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={ch.active ? 'outline' : 'default'}
                      disabled={activate.isPending}
                      onClick={() => {
                        if (!ch.active) activate.mutate({ ch: ch.channel });
                      }}
                    >
                      {ch.active ? 'Configure' : 'Activate'}
                    </Button>
                    {ch.active && (
                      <Button size="sm" variant="ghost">
                        Test
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
