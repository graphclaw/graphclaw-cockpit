import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/utils';
import { AgentMonitorPage } from '@/features/agent-monitor/AgentMonitorPage';
import { useAttentionItems } from '@/features/agent-monitor/hooks/useAttentionItems';

vi.mock('@/features/agent-monitor/hooks/useAttentionItems', () => ({
  useAttentionItems: vi.fn(() => ({
    count: 0,
    items: [],
    failedSkillCount: 0,
    staleRunnerCount: 0,
    isLoading: false,
  })),
}));

vi.mock('@/features/agent-monitor/components/OverviewKpiStrip', () => ({
  OverviewKpiStrip: () => <div data-testid="agent-monitor-kpi-strip" />,
}));

vi.mock('@/features/agent-monitor/components/GlanceStrip', () => ({
  GlanceStrip: () => <div data-testid="agent-monitor-glance-strip" />,
}));

vi.mock('@/features/agent-monitor/components/LiveTicker', () => ({
  LiveTicker: () => <div data-testid="agent-monitor-live-ticker" />,
}));

vi.mock('@/features/agent-monitor/components/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="agent-monitor-activity-feed" />,
}));

vi.mock('@/features/agent-monitor/components/CommsSummaryBanner', () => ({
  CommsSummaryBanner: () => <div data-testid="agent-monitor-comms-summary" />,
}));

vi.mock('@/features/agent-monitor/components/InboundCommsTable', () => ({
  InboundCommsTable: () => <div data-testid="agent-monitor-inbound-log" />,
}));

vi.mock('@/features/agent-monitor/components/OutboundCommsTable', () => ({
  OutboundCommsTable: () => <div data-testid="agent-monitor-outbound-log" />,
}));

vi.mock('@/features/agent-monitor/components/SchedulingNextRunCard', () => ({
  SchedulingNextRunCard: () => <div data-testid="agent-monitor-scheduling-card" />,
}));

const mockUseAttentionItems = vi.mocked(useAttentionItems);

describe('AgentMonitorPage', () => {
  beforeEach(() => {
    mockUseAttentionItems.mockReturnValue({
      count: 0,
      items: [],
      failedSkillCount: 0,
      staleRunnerCount: 0,
      isLoading: false,
    });
  });

  function renderAt(path: string) {
    return renderWithProviders(
      <Routes>
        <Route path="/agent-monitor/:section" element={<AgentMonitorPage />} />
        <Route path="/agent-monitor/comms/:tab" element={<AgentMonitorPage />} />
      </Routes>,
      { initialRoute: path },
    );
  }

  it('renders all 7 nav items', async () => {
    renderAt('/agent-monitor/overview');

    await waitFor(() => {
      expect(screen.getByText('Agent Monitor')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-nav-overview')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-nav-activity')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-nav-comms')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-nav-scheduling')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-nav-skills')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-nav-scoring')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-nav-agents')).toBeInTheDocument();
    });
  });

  it('renders panel based on section route', async () => {
    renderAt('/agent-monitor/activity');

    await waitFor(() => {
      expect(screen.getByTestId('agent-monitor-panel-activity')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-nav-activity')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-activity-feed')).toBeInTheDocument();
    });
  });

  it('maps comms tab routes to comms section', async () => {
    renderAt('/agent-monitor/comms/outbound');

    await waitFor(() => {
      expect(screen.getByTestId('agent-monitor-panel-comms')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-comms-summary')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-outbound-log')).toBeInTheDocument();
      expect(screen.getByText('Comms tab:')).toBeInTheDocument();
      expect(screen.getByText('outbound')).toBeInTheDocument();
    });
  });

  it('renders inbound comms table on inbound route', async () => {
    renderAt('/agent-monitor/comms/inbound');

    await waitFor(() => {
      expect(screen.getByTestId('agent-monitor-panel-comms')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-comms-summary')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-inbound-log')).toBeInTheDocument();
      expect(screen.getByText('inbound')).toBeInTheDocument();
    });
  });

  it('renders responsive helper banner and KPI placeholders on overview', async () => {
    renderAt('/agent-monitor/overview');

    await waitFor(() => {
      expect(screen.getByTestId('agent-monitor-mobile-banner')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-kpi-strip')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-glance-strip')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-live-ticker')).toBeInTheDocument();
    });
  });

  it('renders scoring split-layout container', async () => {
    renderAt('/agent-monitor/scoring');

    await waitFor(() => {
      expect(screen.getByTestId('agent-monitor-scoring-layout')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-panel-scoring')).toBeInTheDocument();
    });
  });

  it('renders scheduling panel card on scheduling route', async () => {
    renderAt('/agent-monitor/scheduling');

    await waitFor(() => {
      expect(screen.getByTestId('agent-monitor-panel-scheduling')).toBeInTheDocument();
      expect(screen.getByTestId('agent-monitor-scheduling-card')).toBeInTheDocument();
    });
  });
});
