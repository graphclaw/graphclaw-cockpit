import { Badge } from '@/components/ui/badge';
import { useAdminLlmProviders, useAdminLlmBudget } from '@/lib/api-hooks';

export function LlmConfigPage() {
  const { data: providersData, isLoading } = useAdminLlmProviders();
  const { data: budget } = useAdminLlmBudget();
  const providers = providersData?.providers ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">LLM Configuration</h2>

      {budget && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Daily Limit', val: `$${budget.daily_limit_usd}` },
            { label: 'Daily Used', val: `$${budget.current_day_usd.toFixed(2)}` },
            { label: 'Monthly Limit', val: `$${budget.monthly_limit_usd}` },
            { label: 'Monthly Used', val: `$${budget.current_month_usd.toFixed(2)}` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-center"
            >
              <div className="text-sm font-semibold text-[var(--text-primary)]">{item.val}</div>
              <div className="text-xs text-[var(--text-tertiary)]">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {providers.map((provider) => (
            <div
              key={provider.provider}
              className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text-primary)]">{provider.provider}</span>
                <Badge variant={provider.enabled ? 'default' : 'outline'}>
                  {provider.enabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[var(--text-secondary)] font-mono">
                  {provider.model}
                </div>
              </div>
            </div>
          ))}
          {providers.length === 0 && (
            <p className="col-span-3 text-center text-sm text-[var(--text-tertiary)] py-6">
              No LLM providers configured.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
