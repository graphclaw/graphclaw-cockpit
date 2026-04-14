import { ThemePicker } from '@/components/common/ThemePicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';

export function DashboardPage() {
  const theme = useThemeStore((s) => s.theme);
  const { userId, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-3xl p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
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
                {userId ? `Signed in as ${userId}` : 'Wave 2 — Auth + API'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemePicker />
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Theme info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Active Theme</CardTitle>
            <CardDescription>
              Current theme:{' '}
              <code className="font-[var(--font-mono)] text-[var(--text-brand)]">{theme}</code>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* State badges */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>State Badges</CardTitle>
            <CardDescription>
              Task state semantic colors from the design token system.
            </CardDescription>
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
        <Card>
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
      </div>
    </div>
  );
}
