import { ThemePicker } from '@/components/common/ThemePicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useThemeStore } from '@/stores/theme';

export function App() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-3xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="GraphClaw"
              className="h-10 w-10 rounded-[var(--radius-lg)]"
            />
            <div>
              <h1 className="text-[var(--text-display)] font-[var(--weight-bold)] tracking-[var(--tracking-tight)]">
                GraphClaw Cockpit
              </h1>
              <p className="text-[var(--text-body-sm)] text-[var(--text-secondary)]">
                Wave 1 — Design System
              </p>
            </div>
          </div>
          <ThemePicker />
        </div>

        {/* Theme info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Active Theme</CardTitle>
            <CardDescription>
              Current theme: <code className="font-[var(--font-mono)] text-[var(--text-brand)]">{theme}</code>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* State badges */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>State Badges</CardTitle>
            <CardDescription>Task state semantic colors from the design token system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="active">Active</Badge>
              <Badge variant="progress">In Progress</Badge>
              <Badge variant="blocked">Blocked</Badge>
              <Badge variant="delayed">Delayed</Badge>
              <Badge variant="complete">Complete</Badge>
              <Badge variant="snoozed">Snoozed</Badge>
              <Badge variant="review">Review</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Button variants using design tokens.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </CardContent>
        </Card>

        {/* Color palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Semantic colors dynamically respond to theme changes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Brand', color: 'var(--brand-primary)' },
                { label: 'Active', color: 'var(--state-active)' },
                { label: 'Progress', color: 'var(--state-progress)' },
                { label: 'Blocked', color: 'var(--state-blocked)' },
                { label: 'Delayed', color: 'var(--state-delayed)' },
                { label: 'Review', color: 'var(--state-review)' },
                { label: 'Surface', color: 'var(--bg-surface)' },
                { label: 'Inset', color: 'var(--bg-inset)' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <div
                    className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border-default)]"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[var(--text-caption)] text-[var(--text-tertiary)]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
