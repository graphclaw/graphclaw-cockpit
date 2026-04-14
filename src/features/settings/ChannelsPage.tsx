import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CHANNELS = [
  { id: 'whatsapp', name: 'WhatsApp', status: 'active', icon: '📱' },
  { id: 'telegram', name: 'Telegram', status: 'inactive', icon: '✈️' },
  { id: 'email', name: 'Email (IMAP)', status: 'active', icon: '📧' },
  { id: 'slack', name: 'Slack', status: 'inactive', icon: '💬' },
] as const;

type ChannelStatus = 'active' | 'inactive';

const STATUS_VARIANT: Record<ChannelStatus, 'active' | 'outline'> = {
  active: 'active',
  inactive: 'outline',
};

export function ChannelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Channels</h2>
        <p className="text-sm text-[var(--text-tertiary)]">Configure inbound message channels.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((ch) => (
          <Card key={ch.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span>{ch.icon}</span>
                {ch.name}
              </CardTitle>
              <Badge variant={STATUS_VARIANT[ch.status]}>{ch.status}</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button size="sm" variant={ch.status === 'active' ? 'outline' : 'default'}>
                  {ch.status === 'active' ? 'Configure' : 'Activate'}
                </Button>
                {ch.status === 'active' && (
                  <Button size="sm" variant="ghost">
                    Test
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
