import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-[var(--text-body-sm)] text-[var(--text-primary)] shadow-[var(--shadow-inset)] transition-colors placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] focus-visible:border-[var(--border-brand)] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
