// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import * as React from 'react';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium text-[var(--text-primary)] leading-none', className)}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
