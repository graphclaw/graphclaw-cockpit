// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { useState, useEffect } from 'react';
import { ChatView } from './ChatView';
import { PendingPlansPanel } from './PendingPlansPanel';
import { OnboardingBanner } from './OnboardingBanner';
import { addOnboardingListener, type OnboardingStatus } from '@/lib/sse';

export function ChatPage() {
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);

  useEffect(() => {
    return addOnboardingListener((status) => {
      setOnboarding(status.needed ? status : null);
    });
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0">
        {onboarding?.needed && (
          <OnboardingBanner
            currentState={onboarding.state ?? 'WELCOME'}
            step={onboarding.step ?? 1}
            totalSteps={onboarding.total_steps ?? 6}
          />
        )}
        <ChatView fullpage />
      </div>
      <PendingPlansPanel />
    </div>
  );
}

