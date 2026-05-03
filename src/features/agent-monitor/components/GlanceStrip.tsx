import type { ReactNode } from 'react';
import { Bot, Inbox, PlayCircle, Reply, Sigma } from 'lucide-react';
import { useGlanceMetrics } from '@/features/agent-monitor/hooks/useGlanceMetrics';

interface GlanceItemProps {
  icon: ReactNode;
  value: string;
  label: string;
  colorClass: string;
  valueTestId: string;
}

function GlanceItem({ icon, value, label, colorClass, valueTestId }: GlanceItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${colorClass}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-[var(--text-primary)]" data-testid={valueTestId}>
          {value}
        </div>
        <div className="text-[11px] text-[var(--text-secondary)]">{label}</div>
      </div>
    </div>
  );
}

function formatMetric(value: number | null, isLoading: boolean): string {
  if (isLoading) {
    return '...';
  }

  if (value === null) {
    return '-';
  }

  return String(value);
}

export function GlanceStrip() {
  const { messagesReceived, repliesSent, skillsRun, tasksScored, runsToday, isLoading } = useGlanceMetrics();

  const items = [
    {
      key: 'messages-received',
      icon: <Inbox size={14} className="text-[var(--state-active)]" />,
      value: formatMetric(messagesReceived, isLoading),
      label: 'Messages received',
      colorClass: 'bg-[var(--state-active-light)]',
      valueTestId: 'glance-messages-received',
    },
    {
      key: 'replies-sent',
      icon: <Reply size={14} className="text-[var(--state-progress)]" />,
      value: formatMetric(repliesSent, isLoading),
      label: 'Replies sent',
      colorClass: 'bg-[var(--state-progress-light)]',
      valueTestId: 'glance-replies-sent',
    },
    {
      key: 'skills-run',
      icon: <Bot size={14} className="text-[var(--state-delayed)]" />,
      value: `${skillsRun.ok}/${skillsRun.failed}`,
      label: 'Skills run (ok/failed)',
      colorClass: 'bg-[var(--state-delayed-light)]',
      valueTestId: 'glance-skills-run',
    },
    {
      key: 'tasks-scored',
      icon: <Sigma size={14} className="text-[var(--state-review)]" />,
      value: formatMetric(tasksScored, isLoading),
      label: 'Tasks scored',
      colorClass: 'bg-[var(--state-review-light)]',
      valueTestId: 'glance-tasks-scored',
    },
    {
      key: 'runs-today',
      icon: <PlayCircle size={14} className="text-[var(--state-active)]" />,
      value: formatMetric(runsToday, isLoading),
      label: 'Runs today',
      colorClass: 'bg-[var(--state-active-light)]',
      valueTestId: 'glance-runs-today',
    },
  ];

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 shadow-sm"
      data-testid="agent-monitor-glance-strip"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {items.map((item, index) => (
          <div key={item.key} className="flex items-center gap-4">
            <GlanceItem
              icon={item.icon}
              value={item.value}
              label={item.label}
              colorClass={item.colorClass}
              valueTestId={item.valueTestId}
            />
            {index < items.length - 1 && <div className="hidden h-8 w-px bg-[var(--border-default)] md:block" />}
          </div>
        ))}
      </div>
    </div>
  );
}
