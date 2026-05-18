// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { CheckCircle2, Circle } from 'lucide-react';

const STEPS = [
  { key: 'WELCOME', label: 'Welcome' },
  { key: 'PERSONA', label: 'Your Profile' },
  { key: 'CHANNELS', label: 'Channels' },
  { key: 'WORKING_HOURS', label: 'Working Hours' },
  { key: 'PREFERENCES', label: 'Preferences' },
  { key: 'POLICIES', label: 'Policies' },
];

interface OnboardingBannerProps {
  currentState: string;
  step: number;
  totalSteps: number;
}

export function OnboardingBanner({ currentState, step, totalSteps }: OnboardingBannerProps) {
  const progressPct = Math.round(((step - 1) / totalSteps) * 100);

  return (
    <div
      className="border-b border-[var(--brand-primary)] bg-[var(--bg-surface)] px-4 py-3"
      data-testid="onboarding-banner"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--brand-primary)] uppercase tracking-wide">
          Getting Started
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">
          Step {step} of {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1 w-full rounded-full bg-[var(--bg-inset)]" data-testid="onboarding-progress">
        <div
          className="h-1 rounded-full bg-[var(--brand-primary)] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5" role="list" aria-label="Onboarding steps">
        {STEPS.map((s, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < step;
          const isCurrent = s.key === currentState;
          return (
            <div
              key={s.key}
              role="listitem"
              data-testid={`onboarding-step-${s.key.toLowerCase()}`}
              className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                isCurrent
                  ? 'bg-[var(--brand-primary)] text-white font-medium'
                  : isDone
                    ? 'text-[var(--state-active)]'
                    : 'text-[var(--text-tertiary)]'
              }`}
            >
              {isDone ? (
                <CheckCircle2 size={11} />
              ) : (
                <Circle size={11} className={isCurrent ? 'text-white' : undefined} />
              )}
              {s.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
