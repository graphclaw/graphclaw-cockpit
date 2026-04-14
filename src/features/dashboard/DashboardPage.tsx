import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useThemeStore } from '@/stores/theme';

export function DashboardPage() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <div className="mx-auto max-w-3xl">
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
  );
}
