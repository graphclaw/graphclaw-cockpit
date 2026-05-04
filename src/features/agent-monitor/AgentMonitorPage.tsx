import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Activity, Bot, CalendarClock, MessageSquare, Radar, Sigma } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AttentionStrip } from './components/AttentionStrip';
import { ActivityFeed } from './components/ActivityFeed';
import { CommsSummaryBanner } from './components/CommsSummaryBanner';
import { EmptyPanel } from './components/EmptyPanel';
import { GlanceStrip } from './components/GlanceStrip';
import { InboundCommsTable } from './components/InboundCommsTable';
import { LiveTicker } from './components/LiveTicker';
import { OutboundCommsTable } from './components/OutboundCommsTable';
import { OverviewKpiStrip } from './components/OverviewKpiStrip';

type Section = 'overview' | 'activity' | 'comms' | 'scheduling' | 'skills' | 'scoring' | 'agents';
type MonitorGroup = 'Monitor' | 'Advanced';
type CommsTab = 'inbound' | 'outbound';

interface SectionConfig {
  key: Section;
  group: MonitorGroup;
  label: string;
  subtitle: string;
}

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

const SECTION_CONFIG: SectionConfig[] = [
  {
    key: 'overview',
    group: 'Monitor',
    label: 'Overview',
    subtitle: 'Quick status, highlights, and recent activity at a glance.',
  },
  {
    key: 'activity',
    group: 'Monitor',
    label: 'Activity',
    subtitle: 'Chronological timeline of what the agent did and when.',
  },
  {
    key: 'comms',
    group: 'Monitor',
    label: 'Comms',
    subtitle: 'Inbound and outbound communication audit for your tasks.',
  },
  {
    key: 'scheduling',
    group: 'Monitor',
    label: 'Scheduling',
    subtitle: 'Upcoming triggers, next run windows, and manual run controls.',
  },
  {
    key: 'skills',
    group: 'Monitor',
    label: 'Skills',
    subtitle: 'Worker pool health, recent jobs, and failure visibility.',
  },
  {
    key: 'scoring',
    group: 'Advanced',
    label: 'Scoring',
    subtitle: 'Task ranking details and factor-by-factor explainability.',
  },
  {
    key: 'agents',
    group: 'Advanced',
    label: 'Agents',
    subtitle: 'Sub-agent pool state, dispatch tiers, and heartbeat timeline.',
  },
];

const SECTION_KEYS = new Set<Section>(SECTION_CONFIG.map((item) => item.key));

const EMPTY_STATE_BY_SECTION: Record<Section, EmptyStateConfig> = {
  overview: {
    icon: Radar,
    title: 'Overview data is not available yet.',
    subtitle: 'KPI cards and daily highlights will populate as panel integrations land.',
  },
  activity: {
    icon: Activity,
    title: 'No activity yet today.',
    subtitle: 'Agent runs will appear here in real time.',
  },
  comms: {
    icon: MessageSquare,
    title: 'No inbound messages yet.',
    subtitle: 'Incoming emails and replies will land here.',
  },
  scheduling: {
    icon: CalendarClock,
    title: 'No active triggers.',
    subtitle: 'Set one up in Settings > Triggers.',
  },
  skills: {
    icon: Bot,
    title: 'No recent skill runs.',
    subtitle: 'Worker activity and job outcomes will be listed here.',
  },
  scoring: {
    icon: Sigma,
    title: 'Action queue is empty.',
    subtitle: 'Agent has no recommendations right now.',
  },
  agents: {
    icon: Bot,
    title: 'No sub-agents are running right now.',
    subtitle: 'Delegations and heartbeat bars will appear when the pool is active.',
  },
};

function isCommsTab(value: string | undefined): value is CommsTab {
  return value === 'inbound' || value === 'outbound';
}

function getSectionFromRoute(sectionParam: string | undefined, pathname: string): Section {
  if (pathname.startsWith('/agent-monitor/comms/')) {
    return 'comms';
  }

  if (sectionParam && SECTION_KEYS.has(sectionParam as Section)) {
    return sectionParam as Section;
  }

  return 'overview';
}

function getSectionHref(section: Section): string {
  if (section === 'comms') {
    return '/agent-monitor/comms/inbound';
  }

  return `/agent-monitor/${section}`;
}

function getSectionConfig(section: Section): SectionConfig {
  const sectionConfig = SECTION_CONFIG.find((item) => item.key === section);
  if (sectionConfig) {
    return sectionConfig;
  }

  return {
    key: 'overview',
    group: 'Monitor',
    label: 'Overview',
    subtitle: 'Quick status, highlights, and recent activity at a glance.',
  };
}

export function AgentMonitorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ section?: string; tab?: string }>();

  const activeSection = getSectionFromRoute(params.section, location.pathname);
  const sectionConfig = getSectionConfig(activeSection);
  const commsTab: CommsTab = isCommsTab(params.tab) ? params.tab : 'inbound';
  const isOverviewSection = activeSection === 'overview';
  const isActivitySection = activeSection === 'activity';
  const isScoringSection = activeSection === 'scoring';
  const isAgentsSection = activeSection === 'agents';
  const panelEmptyState =
    activeSection === 'comms'
      ? {
          icon: MessageSquare,
          title: commsTab === 'inbound' ? 'No inbound messages yet.' : 'No outbound messages yet.',
          subtitle:
            commsTab === 'inbound'
              ? 'Incoming emails and replies will land here.'
              : 'When the agent sends a follow-up it will appear here.',
        }
      : EMPTY_STATE_BY_SECTION[activeSection];

  useEffect(() => {
    if (location.pathname.startsWith('/agent-monitor/comms/') && !isCommsTab(params.tab)) {
      navigate('/agent-monitor/comms/inbound', { replace: true });
      return;
    }

    if (params.section && !SECTION_KEYS.has(params.section as Section)) {
      navigate('/agent-monitor/overview', { replace: true });
    }
  }, [location.pathname, navigate, params.section, params.tab]);

  function renderHeartbeatSegments() {
    return Array.from({ length: 30 }).map((_, index) => (
      <span
        key={`heartbeat-placeholder-${index}`}
        className={`h-1.5 w-2 rounded-sm bg-[var(--bg-inset)] ${index >= 15 ? 'hidden md:inline-block' : 'inline-block'}`}
        data-testid="agent-monitor-heartbeat-segment"
      />
    ));
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
      <div className="flex min-h-[calc(100vh-11rem)] flex-col md:flex-row">
        <aside className="w-full border-b border-[var(--border-default)] bg-[var(--bg-surface)] p-2 md:w-[196px] md:shrink-0 md:border-b-0 md:border-r">
          {(['Monitor', 'Advanced'] as MonitorGroup[]).map((group, index) => {
            const entries = SECTION_CONFIG.filter((item) => item.group === group);

            return (
              <div key={group}>
                <span className="block px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  {group}
                </span>
                <nav className="space-y-1">
                  {entries.map((item) => {
                    const isActive = item.key === activeSection;

                    return (
                      <Link
                        key={item.key}
                        to={getSectionHref(item.key)}
                        data-testid={`agent-monitor-nav-${item.key}`}
                        className={`block rounded-[var(--radius-md)] px-2 py-1.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                {index === 0 && <div className="mx-1 my-2 border-b border-[var(--border-default)]" />}
              </div>
            );
          })}
        </aside>

        <section className="min-w-0 flex-1 bg-[var(--bg-page)]">
          <header className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-5">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Agent Monitor</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{sectionConfig.label}</p>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">{sectionConfig.subtitle}</p>
          </header>

          <div className="space-y-4 p-6">
            <div
              className="rounded-[var(--radius-md)] border border-[var(--state-delayed)] bg-[var(--state-delayed-light)] px-3 py-2 text-xs text-[var(--text-secondary)] md:hidden"
              data-testid="agent-monitor-mobile-banner"
            >
              Agent Monitor is best on a wider screen - open on desktop.
            </div>

            {activeSection === 'overview' && <AttentionStrip />}

            {isScoringSection ? (
              <div
                className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]"
                data-testid="agent-monitor-scoring-layout"
              >
                <div
                  className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
                  data-testid="agent-monitor-panel-scoring"
                >
                  <EmptyPanel
                    icon={panelEmptyState.icon}
                    title={panelEmptyState.title}
                    subtitle={panelEmptyState.subtitle}
                  />
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
                  <EmptyPanel
                    icon={Sigma}
                    title="No factor breakdown selected."
                    subtitle="Choose a task from the score table to inspect factor details."
                  />
                </div>
              </div>
            ) : (
              <div
                className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
                data-testid={`agent-monitor-panel-${activeSection}`}
              >
                {isOverviewSection && (
                  <div className="mb-4 space-y-3">
                    <OverviewKpiStrip />
                    <GlanceStrip />
                    <LiveTicker />
                  </div>
                )}

                {isActivitySection ? (
                  <ActivityFeed />
                ) : activeSection === 'comms' ? (
                  <div className="space-y-3">
                    <CommsSummaryBanner />
                    {commsTab === 'inbound' ? (
                      <InboundCommsTable />
                    ) : (
                      <OutboundCommsTable />
                    )}
                  </div>
                ) : !isOverviewSection && (
                  <EmptyPanel
                    icon={panelEmptyState.icon}
                    title={panelEmptyState.title}
                    subtitle={panelEmptyState.subtitle}
                  />
                )}

                {activeSection === 'comms' && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--bg-inset)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                    <span>Comms tab:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{commsTab}</span>
                  </div>
                )}

                {isAgentsSection && (
                  <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Heartbeat placeholder
                    </p>
                    <div className="flex flex-wrap gap-1" data-testid="agent-monitor-heartbeat-placeholder">
                      {renderHeartbeatSegments()}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <p className="text-sm text-[var(--text-tertiary)]">
                Next steps in this wave will populate this panel with production data and interactions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
