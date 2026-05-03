import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { AttentionStrip } from './components/AttentionStrip';

type Section = 'overview' | 'activity' | 'comms' | 'scheduling' | 'skills' | 'scoring' | 'agents';
type MonitorGroup = 'Monitor' | 'Advanced';
type CommsTab = 'inbound' | 'outbound';

interface SectionConfig {
  key: Section;
  group: MonitorGroup;
  label: string;
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

  useEffect(() => {
    if (location.pathname.startsWith('/agent-monitor/comms/') && !isCommsTab(params.tab)) {
      navigate('/agent-monitor/comms/inbound', { replace: true });
      return;
    }

    if (params.section && !SECTION_KEYS.has(params.section as Section)) {
      navigate('/agent-monitor/overview', { replace: true });
    }
  }, [location.pathname, navigate, params.section, params.tab]);

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
      <div className="flex min-h-[calc(100vh-11rem)]">
        <aside className="w-[196px] shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-surface)] p-2">
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
            {activeSection === 'overview' && <AttentionStrip />}

            <div
              className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
              data-testid={`agent-monitor-panel-${activeSection}`}
            >
              <p className="text-sm text-[var(--text-secondary)]">
                {sectionConfig.label} panel scaffold is ready for Wave M implementation.
              </p>

              {activeSection === 'comms' && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--bg-inset)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                  <span>Comms tab:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{commsTab}</span>
                </div>
              )}
            </div>

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
