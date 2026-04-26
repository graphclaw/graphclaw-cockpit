import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, ExternalLink, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useChatMessages, useSendChatMessage } from '@/lib/api-hooks';
import { startChatStream } from '@/lib/chat-stream';
import type { ChatStreamEvent } from '@/lib/chat-stream';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  cards?: InlineCard[];
}

interface InlineCard {
  type: 'task' | 'score' | 'approval' | 'briefing' | 'error';
  title: string;
  detail: string;
}

const SUGGESTIONS = [
  'Show my tasks for today',
  'Run the daily briefing',
  'What changed since yesterday?',
];

function InlineCardView({ card }: { card: InlineCard }) {
  const colorMap: Record<string, string> = {
    task: 'var(--brand-primary)',
    score: 'var(--state-active)',
    approval: 'var(--state-warning)',
    briefing: 'var(--state-info)',
    error: 'var(--state-error)',
  };

  return (
    <div
      className="mt-1 rounded-[var(--radius-md)] border-l-2 bg-[var(--bg-surface)] px-3 py-2"
      style={{ borderLeftColor: colorMap[card.type] || 'var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-primary)]">{card.title}</span>
        <ExternalLink size={12} className="text-[var(--text-tertiary)]" />
      </div>
      <span className="text-xs text-[var(--text-tertiary)]">{card.detail}</span>
    </div>
  );
}

interface ChatViewProps {
  fullpage?: boolean;
}

// ---------------------------------------------------------------------------
// Execution timeline item
// ---------------------------------------------------------------------------

interface TimelineItem {
  id: number;
  event_type: string;
  label: string;
  detail?: string;
  status: 'pending' | 'ok' | 'error';
}

function TimelinePanel({ items }: { items: TimelineItem[] }) {
  const [collapsed, setCollapsed] = useState(false);
  if (items.length === 0) return null;
  return (
    <div
      className="border-t border-[var(--border-default)] bg-[var(--bg-inset)] text-xs"
      data-testid="timeline-panel"
    >
      <button
        className="flex w-full items-center justify-between px-4 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="font-medium">Execution trace ({items.length})</span>
        {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>
      {!collapsed && (
        <div className="max-h-40 overflow-y-auto px-4 pb-2 space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <span
                className={`shrink-0 mt-0.5 ${
                  item.status === 'ok'
                    ? 'text-[var(--state-active)]'
                    : item.status === 'error'
                      ? 'text-[var(--state-error)]'
                      : 'text-[var(--text-tertiary)]'
                }`}
              >
                {item.status === 'ok' ? '✓' : item.status === 'error' ? '✗' : '·'}
              </span>
              <div>
                <span className="text-[var(--text-primary)]">{item.label}</span>
                {item.detail && (
                  <span className="ml-1 text-[var(--text-tertiary)] truncate max-w-xs inline-block align-bottom">
                    {item.detail}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatView
// ---------------------------------------------------------------------------

export function ChatView({ fullpage = false }: ChatViewProps) {
  const { data: remoteMessages = [] } = useChatMessages();
  const sendMessage = useSendChatMessage();
  const messages: ChatMessage[] = remoteMessages.map((m) => ({
    id: m.message_id,
    role: (m.role === 'agent' ? 'assistant' : m.role) as 'user' | 'assistant',
    content: m.content,
    timestamp: m.timestamp,
  }));
  const [input, setInput] = useState('');
  const [streamMode, setStreamMode] = useState(true);

  // Streaming state
  const [streamingDelta, setStreamingDelta] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const timelineIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const isTyping = sendMessage.isPending || isStreaming;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isTyping, streamingDelta]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleStreamEvent = useCallback((event: ChatStreamEvent) => {
    const et = event.event_type;
    const p = event.payload as Record<string, unknown>;

    if (et === 'assistant.delta') {
      const delta = (p.delta as string) ?? '';
      setStreamingDelta((prev) => prev + delta);
      return;
    }

    const id = ++timelineIdRef.current;

    if (et === 'tool.started') {
      setTimeline((prev) => [
        ...prev,
        {
          id,
          event_type: et,
          label: `⚙ ${String(p.tool_name ?? '?')}`,
          detail: String(p.args_summary ?? ''),
          status: 'pending',
        },
      ]);
    } else if (et === 'tool.completed') {
      setTimeline((prev) =>
        prev.map((item) =>
          item.event_type === 'tool.started' &&
          item.label === `⚙ ${String(p.tool_name ?? '?')}` &&
          item.status === 'pending'
            ? {
                ...item,
                label: `${String(p.tool_name ?? '?')}`,
                detail: `${String(p.latency_ms ?? 0)}ms  ${String(p.result_summary ?? '').slice(0, 60)}`,
                status: 'ok',
              }
            : item,
        ),
      );
    } else if (et === 'tool.failed') {
      setTimeline((prev) => [
        ...prev,
        {
          id,
          event_type: et,
          label: `${String(p.tool_name ?? '?')}`,
          detail: String(p.error_message ?? ''),
          status: 'error',
        },
      ]);
    } else if (et === 'run.started') {
      setTimeline([]);
      setStreamingDelta('');
    } else if (et === 'run.completed') {
      setTimeline((prev) => [
        ...prev,
        {
          id,
          event_type: et,
          label: 'Run completed',
          detail: `${String(p.tool_call_count ?? 0)} tool calls · ${String(p.duration_ms ?? 0)}ms`,
          status: 'ok',
        },
      ]);
    } else if (et === 'run.failed') {
      setTimeline((prev) => [
        ...prev,
        {
          id,
          event_type: et,
          label: 'Run failed',
          detail: String(p.error_message ?? ''),
          status: 'error',
        },
      ]);
    }
  }, []);

  function handleSend() {
    if (!input.trim() || isTyping) return;
    const text = input.trim();
    setInput('');

    if (!streamMode) {
      sendMessage.mutate(text);
      return;
    }

    // Streaming mode
    setIsStreaming(true);
    setStreamingDelta('');
    setTimeline([]);
    const controller = new AbortController();
    abortRef.current = controller;

    startChatStream(text, handleStreamEvent, controller.signal)
      .catch((err: unknown) => {
        if ((err as Error)?.name !== 'AbortError') {
          setTimeline((prev) => [
            ...prev,
            {
              id: ++timelineIdRef.current,
              event_type: 'run.failed',
              label: 'Stream error',
              detail: (err as Error)?.message ?? String(err),
              status: 'error',
            },
          ]);
        }
      })
      .finally(() => {
        setIsStreaming(false);
        abortRef.current = null;
        // History will have been refreshed by the backend; let polling pick it up
        setStreamingDelta('');
      });
  }

  return (
    <div
      className={`flex flex-col ${fullpage ? 'h-full' : 'h-full max-h-[calc(100vh-8rem)]'}`}
      data-testid="chat-view"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-[var(--brand-primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">GraphClaw Chat</span>
          <Badge variant="outline">Online</Badge>
        </div>
        <button
          onClick={() => setStreamMode((m) => !m)}
          title={streamMode ? 'Streaming mode (click to disable)' : 'Classic mode (click to enable streaming)'}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
            streamMode
              ? 'bg-[var(--brand-primary)] text-white'
              : 'border border-[var(--border-default)] text-[var(--text-tertiary)]'
          }`}
          data-testid="stream-toggle"
        >
          <Zap size={10} />
          {streamMode ? 'Live' : 'Batch'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white">
                <Bot size={14} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-[var(--radius-lg)] px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)]'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-table:text-xs prose-pre:bg-[var(--bg-inset)] prose-code:text-[var(--brand-primary)]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              {msg.cards?.map((card, i) => <InlineCardView key={i} card={card} />)}
              <span
                className={`mt-1 block text-[10px] ${
                  msg.role === 'user' ? 'text-white/60' : 'text-[var(--text-tertiary)]'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {msg.role === 'user' && (
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-inset)]">
                <User size={14} className="text-[var(--text-secondary)]" />
              </div>
            )}
          </div>
        ))}

        {/* Live streaming delta bubble */}
        {isStreaming && streamingDelta && (
          <div className="flex gap-2 justify-start" data-testid="streaming-delta">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white">
              <Bot size={14} />
            </div>
            <div className="max-w-[80%] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-table:text-xs prose-pre:bg-[var(--bg-inset)] prose-code:text-[var(--brand-primary)]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingDelta}</ReactMarkdown>
              </div>
              <span className="inline-block h-3 w-0.5 animate-pulse bg-[var(--brand-primary)] align-text-bottom ml-0.5" />
            </div>
          </div>
        )}

        {isTyping && !streamingDelta && (
          <div className="flex gap-2" data-testid="typing-indicator">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white">
              <Bot size={14} />
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-tertiary)]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Execution timeline */}
      {streamMode && <TimelinePanel items={timeline} />}

      {/* Suggestions */}
      <div className="flex gap-2 px-4 py-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border-default)] px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
            data-testid="chat-input"
          />
          <Button size="sm" onClick={handleSend} disabled={!input.trim()}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
