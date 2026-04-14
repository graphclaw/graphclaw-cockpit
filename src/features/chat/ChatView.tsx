import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, ExternalLink } from 'lucide-react';

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

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'What are the top priority tasks right now?',
    timestamp: '2026-04-14T10:30:00Z',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Here are the top 3 tasks by priority score:',
    timestamp: '2026-04-14T10:30:05Z',
    cards: [
      { type: 'task', title: 'Deploy API v2.1', detail: 'Score: 0.92 · IN_PROGRESS' },
      { type: 'task', title: 'Fix auth token refresh', detail: 'Score: 0.87 · BLOCKED' },
      { type: 'task', title: 'Update scoring weights', detail: 'Score: 0.81 · OPEN' },
    ],
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'Why is the auth token refresh task blocked?',
    timestamp: '2026-04-14T10:31:00Z',
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content: 'The **auth token refresh** task is blocked because it depends on "Upgrade Redis to v7" which is still in progress. The dependency chain is:\n\n1. Upgrade Redis to v7 (IN_PROGRESS)\n2. Fix auth token refresh (BLOCKED)\n3. Deploy API v2.1 (waiting)',
    timestamp: '2026-04-14T10:31:03Z',
  },
];

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

export function ChatView({ fullpage = false }: ChatViewProps) {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function handleSend() {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate assistant response
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I understand your request about "${userMsg.content}". Let me look into that for you.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
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
              <p className="whitespace-pre-wrap">{msg.content}</p>
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

        {isTyping && (
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
