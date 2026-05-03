import { useEffect, useMemo, useState } from 'react';
import { formatTickerEvent, type SupportedTickerEventType, type TickerEventRecord } from '../lib/formatEvent';

const STORAGE_KEY = 'gc:ticker:today';
const MAX_EVENTS = 20;

const SUBSCRIBED_EVENTS: SupportedTickerEventType[] = [
  'task.scored',
  'skill.completed',
  'briefing.ready',
  'task.state_changed',
  'approval.pending',
];

type ConnectionState = 'connecting' | 'connected' | 'disconnected';

interface StoredTickerPayload {
  date: string;
  events: PersistedTickerEvent[];
}

export interface PersistedTickerEvent extends TickerEventRecord {
  id: string;
}

function utcDateKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function readStoredEvents(today: string): PersistedTickerEvent[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredTickerPayload;
    if (!parsed || parsed.date !== today || !Array.isArray(parsed.events)) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    return parsed.events.slice(0, MAX_EVENTS);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function writeStoredEvents(today: string, events: PersistedTickerEvent[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      date: today,
      events: events.slice(0, MAX_EVENTS),
    } satisfies StoredTickerPayload),
  );
}

function getMidnightResetDelayMs(now = new Date()): number {
  const nextMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1000, nextMidnight - now.getTime());
}

export function useLiveTickerEvents(maxVisible = 6) {
  const [todayKey, setTodayKey] = useState(() => utcDateKey());
  const [events, setEvents] = useState<PersistedTickerEvent[]>(() => readStoredEvents(utcDateKey()));
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  useEffect(() => {
    writeStoredEvents(todayKey, events);
  }, [events, todayKey]);

  useEffect(() => {
    const resetTimer = setTimeout(() => {
      const nextDay = utcDateKey();
      setTodayKey(nextDay);
      setEvents([]);
      localStorage.removeItem(STORAGE_KEY);
    }, getMidnightResetDelayMs());

    return () => clearTimeout(resetTimer);
  }, [todayKey]);

  useEffect(() => {
    if (typeof EventSource === 'undefined') {
      setConnectionState('disconnected');
      return;
    }

    const source = new EventSource('/app/v1/events');
    setConnectionState('connecting');

    const handlers: Array<[SupportedTickerEventType, (event: MessageEvent<string>) => void]> = [];

    const appendEvent = (event: PersistedTickerEvent) => {
      setEvents((previous) => [event, ...previous].slice(0, MAX_EVENTS));
    };

    source.onopen = () => {
      setConnectionState('connected');
    };

    source.onerror = () => {
      setConnectionState('disconnected');
    };

    SUBSCRIBED_EVENTS.forEach((eventType) => {
      const handler = (event: MessageEvent<string>) => {
        try {
          const raw = JSON.parse(event.data) as unknown;
          if (!isRecord(raw)) {
            return;
          }

          const formatted = formatTickerEvent(eventType, raw);
          if (!formatted) {
            return;
          }

          appendEvent({
            ...formatted,
            id: `${eventType}:${formatted.timestamp}:${Date.now()}`,
          });
        } catch {
          // ignore malformed SSE frames
        }
      };

      handlers.push([eventType, handler]);
      source.addEventListener(eventType, handler as EventListener);
    });

    return () => {
      handlers.forEach(([eventType, handler]) => {
        source.removeEventListener(eventType, handler as EventListener);
      });
      source.close();
    };
  }, []);

  const visibleEvents = useMemo(() => events.slice(0, maxVisible), [events, maxVisible]);

  return {
    events: visibleEvents,
    isLive: connectionState === 'connected',
    connectionState,
  };
}
