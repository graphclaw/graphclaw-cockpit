/**
 * chat-stream.ts — Fetch-based SSE streaming for the chat transparency API.
 *
 * Uses `fetch` + `ReadableStream` instead of `EventSource` so that we can
 * send both the `Authorization` header and a POST request body.  Native
 * `EventSource` does not support either of those.
 *
 * The backend streams `text/event-stream` frames where each frame is:
 *
 *   event: <event_type>\n
 *   data: <JSON>\n
 *   \n
 *
 * Usage:
 *
 *   const controller = new AbortController();
 *   startChatStream(
 *     'What are my top tasks?',
 *     (event) => console.log(event),
 *     controller.signal,
 *   );
 *   // later: controller.abort();
 */

import { logger } from './logger';

// ---------------------------------------------------------------------------
// Event types (mirrors RunEventType on the backend)
// ---------------------------------------------------------------------------

export type RunEventType =
  | 'run.started'
  | 'run.completed'
  | 'run.failed'
  | 'plan.proposed'
  | 'assistant.delta'
  | 'assistant.final'
  | 'tool.started'
  | 'tool.completed'
  | 'tool.failed'
  | 'skill.started'
  | 'skill.progress'
  | 'skill.completed'
  | 'skill.failed'
  | 'delegate.started'
  | 'delegate.progress'
  | 'delegate.completed'
  | 'delegate.blocked'
  | 'mcp.started'
  | 'mcp.completed'
  | 'mcp.failed';

export const TERMINAL_EVENTS: ReadonlySet<RunEventType> = new Set([
  'run.completed',
  'run.failed',
]);

// ---------------------------------------------------------------------------
// Payload shapes (partial — enough for the UI to render)
// ---------------------------------------------------------------------------

export interface RunStartedPayload {
  message_preview?: string;
}

export interface RunCompletedPayload {
  input_tokens: number;
  output_tokens: number;
  tool_call_count: number;
  duration_ms: number;
}

export interface RunFailedPayload {
  error_class: string;
  error_message: string;
  duration_ms: number;
}

export interface AssistantDeltaPayload {
  delta: string;
}

export interface AssistantFinalPayload {
  content_length: number;
  input_tokens: number;
  output_tokens: number;
}

export interface ToolStartedPayload {
  tool_name: string;
  args_summary: string;
}

export interface ToolCompletedPayload {
  tool_name: string;
  latency_ms: number;
  result_summary: string;
}

export interface ToolFailedPayload {
  tool_name: string;
  error_class: string;
  error_message: string;
}

// Generic payload for event types we don't specifically handle
export type AnyPayload = Record<string, unknown>;

// ---------------------------------------------------------------------------
// ChatStreamEvent — discriminated union
// ---------------------------------------------------------------------------

export interface ChatStreamEvent {
  run_id: string;
  session_id: string;
  user_id: string;
  event_seq: number;
  timestamp: string;
  event_type: RunEventType;
  payload: AnyPayload;
}

// ---------------------------------------------------------------------------
// Parser helpers
// ---------------------------------------------------------------------------

/**
 * Parse a raw SSE text buffer into an array of `{event, data}` objects.
 * Handles partial frames at the end of a buffer by returning leftover text.
 */
export function parseSseBuffer(
  buffer: string,
): { parsed: { event: string; data: string }[]; remainder: string } {
  const parsed: { event: string; data: string }[] = [];
  // SSE frames are separated by double newlines
  const frames = buffer.split('\n\n');
  // The last element is the incomplete frame (may be empty)
  const remainder = frames.pop() ?? '';

  for (const frame of frames) {
    if (!frame.trim()) continue;
    let event = 'message';
    let data = '';
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data = line.slice(5).trim();
      }
    }
    if (data) {
      parsed.push({ event, data });
    }
  }
  return { parsed, remainder };
}

// ---------------------------------------------------------------------------
// Main streaming function
// ---------------------------------------------------------------------------

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('gc-access-token');
  return {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Open a streaming chat request and call `onEvent` for every parsed event.
 *
 * Returns a Promise that resolves when the stream ends (terminal event or
 * server disconnect) or rejects on network error.
 *
 * @param content  - User message text
 * @param onEvent  - Callback for each parsed ChatStreamEvent
 * @param signal   - AbortSignal to cancel mid-stream
 */
export async function startChatStream(
  content: string,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  logger.info('chat.stream.start', { content_length: content.length });

  const res = await fetch('/app/v1/chat/messages/stream', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
    signal,
  });

  if (!res.ok) {
    logger.error('chat.stream.request_failed', { status: res.status });
    throw new Error(`Chat stream request failed: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { parsed, remainder } = parseSseBuffer(buffer);
      buffer = remainder;

      for (const { event, data } of parsed) {
        try {
          const payload = JSON.parse(data) as ChatStreamEvent;
          logger.debug('chat.stream.event', { event_name: event, run_id: payload.run_id });
          // The backend wraps the whole AgentRunEvent as the data payload
          onEvent(payload);
          if (TERMINAL_EVENTS.has(event as RunEventType)) {
            logger.info('chat.stream.complete', { event_name: event, run_id: payload.run_id });
            return;
          }
        } catch {
          // Malformed JSON — skip this frame
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      logger.error('chat.stream.error', { detail: err.message });
    }
    throw err;
  } finally {
    reader.releaseLock();
  }
}
