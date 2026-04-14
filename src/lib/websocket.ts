type MessageHandler = (data: unknown) => void;

interface WebSocketManagerOptions {
  url: string;
  onMessage?: MessageHandler;
  onOpen?: () => void;
  onClose?: () => void;
  heartbeatInterval?: number;
}

let ws: WebSocket | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectAttempts = 0;
let options: WebSocketManagerOptions | null = null;

export function connectWebSocket(opts: WebSocketManagerOptions) {
  options = opts;

  if (ws) {
    ws.close();
  }

  ws = new WebSocket(opts.url);
  reconnectAttempts = 0;

  ws.onopen = () => {
    reconnectAttempts = 0;
    opts.onOpen?.();

    // Start heartbeat
    const interval = opts.heartbeatInterval ?? 30000;
    heartbeatTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, interval);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'pong') return;
      opts.onMessage?.(data);
    } catch {
      // Ignore non-JSON messages
    }
  };

  ws.onclose = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = undefined;
    }

    opts.onClose?.();

    // Exponential backoff reconnect
    const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
    reconnectAttempts++;
    reconnectTimer = setTimeout(() => {
      if (options) connectWebSocket(options);
    }, delay);
  };

  ws.onerror = () => {
    ws?.close();
  };
}

export function sendMessage(data: unknown) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  reconnectAttempts = 0;
  options = null;
}
