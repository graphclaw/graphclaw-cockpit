import { cva, type VariantProps } from 'class-variance-authority';
import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-[var(--weight-semibold)] transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]',
        active: 'bg-[var(--state-active-light)] text-[var(--state-active)]',
        progress: 'bg-[var(--state-progress-light)] text-[var(--state-progress)]',
        blocked: 'bg-[var(--state-blocked-light)] text-[var(--state-blocked)]',
        delayed: 'bg-[var(--state-delayed-light)] text-[var(--state-delayed)]',
        complete: 'bg-[var(--state-complete-light)] text-[var(--state-complete)]',
        snoozed: 'bg-[var(--state-snoozed-light)] text-[var(--text-tertiary)]',
        review: 'bg-[var(--state-review-light)] text-[var(--state-review)]',
        outline: 'border border-[var(--border-default)] text-[var(--text-secondary)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />
    );
  },
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
