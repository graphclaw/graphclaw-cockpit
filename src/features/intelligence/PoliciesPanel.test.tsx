import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { PoliciesPanel } from '@/features/intelligence/PoliciesPanel';
import { AgentIdContext } from '@/features/intelligence/IntelligenceLayout';

function renderPolicies() {
  return renderWithProviders(
    <AgentIdContext.Provider value="test-agent-001">
      <PoliciesPanel />
    </AgentIdContext.Provider>,
  );
}

describe('PoliciesPanel', () => {
  it('renders all 4 policy cards', () => {
    renderPolicies();
    expect(screen.getByTestId('policy-card-delegation')).toBeInTheDocument();
    expect(screen.getByTestId('policy-card-escalation')).toBeInTheDocument();
    expect(screen.getByTestId('policy-card-counterparty_etiquette')).toBeInTheDocument();
    expect(screen.getByTestId('policy-card-reply_tone')).toBeInTheDocument();
  });

  it('shows labels for all policies', () => {
    renderPolicies();
    expect(screen.getByText('Delegation')).toBeInTheDocument();
    expect(screen.getByText('Escalation')).toBeInTheDocument();
    expect(screen.getByText('Counterparty Etiquette')).toBeInTheDocument();
    expect(screen.getByText('Reply Tone')).toBeInTheDocument();
  });

  it('navigates into the editor when a card is clicked', async () => {
    const user = userEvent.setup();
    renderPolicies();
    await user.click(screen.getByTestId('policy-card-delegation'));
    // After clicking, the PolicyEditor mounts (network call, we just check it loaded)
    expect(screen.getByTestId('policy-editor')).toBeInTheDocument();
  });

  it('navigates back to list when back button is clicked', async () => {
    const user = userEvent.setup();
    renderPolicies();
    await user.click(screen.getByTestId('policy-card-escalation'));
    await user.click(screen.getByTestId('policy-back-btn'));
    // Back to list
    expect(screen.getByTestId('policies-list')).toBeInTheDocument();
  });
});
