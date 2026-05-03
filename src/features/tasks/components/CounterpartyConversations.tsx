import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronRight, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import {
  useConversations,
  useConversationThreads,
  useConversationMessages,
} from '@/lib/api-hooks';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTs(ts: string | null): string {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

// ---------------------------------------------------------------------------
// Thread message list
// ---------------------------------------------------------------------------

interface ThreadMessagesProps {
  counterpartyId: string;
  channel: string;
  threadId: string;
}

function ThreadMessages({ counterpartyId, channel, threadId }: ThreadMessagesProps) {
  const { data: messages = [], isLoading } = useConversationMessages(
    counterpartyId,
    channel,
    threadId,
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 py-2 text-xs text-[var(--text-tertiary)]">
        <Loader2 size={11} className="animate-spin" />
        Loading messages…
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="py-2 text-xs italic text-[var(--text-tertiary)]">No messages in this thread.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5 pb-1" data-testid={`messages-${threadId}`}>
      {messages.map((msg, i) => (
        <li
          key={`${threadId}-${i}`}
          className={`flex gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 ${
            msg.direction === 'out'
              ? 'bg-[var(--brand-primary)]/5'
              : 'bg-[var(--bg-inset)]'
          }`}
        >
          <span className="mt-0.5 shrink-0 text-[var(--text-tertiary)]">
            {msg.direction === 'out' ? (
              <ArrowUpRight size={11} />
            ) : (
              <ArrowDownLeft size={11} />
            )}
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="text-xs leading-snug text-[var(--text-secondary)]">{msg.content}</p>
            {msg.timestamp && (
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {formatTs(msg.timestamp)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Thread accordion row
// ---------------------------------------------------------------------------

interface ThreadRowProps {
  counterpartyId: string;
  channel: string;
  threadId: string;
}

function ThreadRow({ counterpartyId, channel, threadId }: ThreadRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 py-1 text-left text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        data-testid={`thread-${threadId}`}
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <span className="font-medium">{channel}</span>
        <span className="text-[var(--text-tertiary)]">/{threadId}</span>
      </button>
      {open && (
        <div className="ml-4">
          <ThreadMessages
            counterpartyId={counterpartyId}
            channel={channel}
            threadId={threadId}
          />
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Counterparty accordion row
// ---------------------------------------------------------------------------

interface CounterpartyRowProps {
  counterpartyId: string;
  channels: string[];
}

function CounterpartyRow({ counterpartyId, channels }: CounterpartyRowProps) {
  const [open, setOpen] = useState(false);
  const { data: threads = [], isLoading } = useConversationThreads(
    open ? counterpartyId : '',
  );

  return (
    <li
      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      data-testid={`counterparty-${counterpartyId}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {open ? (
          <ChevronDown size={13} className="shrink-0 text-[var(--text-tertiary)]" />
        ) : (
          <ChevronRight size={13} className="shrink-0 text-[var(--text-tertiary)]" />
        )}
        <span className="flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
          {counterpartyId}
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">
          {channels.join(', ')}
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--border-default)] px-3 py-2">
          {isLoading ? (
            <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
              <Loader2 size={11} className="animate-spin" />
              Loading threads…
            </div>
          ) : threads.length === 0 ? (
            <p className="text-xs italic text-[var(--text-tertiary)]">No threads found.</p>
          ) : (
            <ul className="flex flex-col">
              {threads.map((thread) => (
                <ThreadRow
                  key={`${thread.channel}/${thread.thread_id}`}
                  counterpartyId={counterpartyId}
                  channel={thread.channel}
                  threadId={thread.thread_id}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CounterpartyConversations() {
  const { data: counterparties = [], isLoading } = useConversations();

  return (
    <section data-testid="counterparty-conversations">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        <MessageSquare size={13} />
        Counterparty Conversations
      </h4>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <Loader2 size={14} className="animate-spin" />
          Loading conversations…
        </div>
      ) : counterparties.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-4 text-center text-xs text-[var(--text-tertiary)]">
          No counterparty conversations yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {counterparties.map((cp) => (
            <CounterpartyRow
              key={cp.counterparty_id}
              counterpartyId={cp.counterparty_id}
              channels={cp.channels}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
