// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function TriggersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Triggers</h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          Configure follow-up timing and interrupt thresholds.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Follow-up Configuration</h3>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-tertiary)]">
              Follow-up Interval (days)
            </label>
            <Input type="number" defaultValue={3} min={1} max={30} className="max-w-[150px]" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-tertiary)]">
              Interrupt Score Threshold
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                defaultValue={80}
                className="flex-1 max-w-[300px] accent-[var(--brand-primary)]"
              />
              <span className="font-mono text-sm text-[var(--text-secondary)]">0.80</span>
            </div>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Tasks scoring above this threshold will trigger an interrupt notification.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-tertiary)]">
              Max Follow-ups per Task
            </label>
            <Input type="number" defaultValue={5} min={1} max={20} className="max-w-[150px]" />
          </div>

          <Button size="sm">Save Triggers</Button>
        </CardContent>
      </Card>
    </div>
  );
}
