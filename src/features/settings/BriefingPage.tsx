// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function BriefingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Briefing Schedule</h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          Configure daily briefing delivery timing, channel, and style.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-tertiary)]">
              Delivery Time (UTC)
            </label>
            <Input type="time" defaultValue="09:00" className="max-w-[200px]" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-tertiary)]">
              Channel
            </label>
            <select className="h-9 w-full max-w-[300px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 text-sm text-[var(--text-primary)]">
              <option>Email</option>
              <option>Slack</option>
              <option>WhatsApp</option>
              <option>Telegram</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-tertiary)]">
              Style
            </label>
            <select className="h-9 w-full max-w-[300px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 text-sm text-[var(--text-primary)]">
              <option>Executive Summary</option>
              <option>Detailed Report</option>
              <option>Bullet Points</option>
            </select>
          </div>

          <Button size="sm">Save Configuration</Button>
        </CardContent>
      </Card>
    </div>
  );
}
