// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
// Structured browser console logger with VITE_LOG_LEVEL filtering.
// Outputs JSON lines matching the backend's JsonFormatter shape.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const configured = (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined) ??
  (import.meta.env.DEV ? 'debug' : 'info');
const activeLevel = LEVELS[configured] ?? LEVELS.info;

function emit(level: LogLevel, event_type: string, fields?: Record<string, unknown>): void {
  if (LEVELS[level] < activeLevel) return;
  const record = JSON.stringify({ level, ts: new Date().toISOString(), event_type, ...fields });
  console[level](record);
}

export const logger = {
  debug: (event_type: string, fields?: Record<string, unknown>) =>
    emit('debug', event_type, fields),
  info: (event_type: string, fields?: Record<string, unknown>) =>
    emit('info', event_type, fields),
  warn: (event_type: string, fields?: Record<string, unknown>) =>
    emit('warn', event_type, fields),
  error: (event_type: string, fields?: Record<string, unknown>) =>
    emit('error', event_type, fields),
};
