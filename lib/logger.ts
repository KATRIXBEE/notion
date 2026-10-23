export type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  [key: string]: unknown;
}

export function log(level: LogLevel, payload: LogPayload) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    ...payload,
  };
  // Structured JSON to stdout for CloudWatch
  console.log(JSON.stringify(entry));
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    log("info", { message, ...meta }),
  warn: (message: string, meta?: Record<string, unknown>) =>
    log("warn", { message, ...meta }),
  error: (message: string, meta?: Record<string, unknown>) =>
    log("error", { message, ...meta }),
  debug: (message: string, meta?: Record<string, unknown>) =>
    log("debug", { message, ...meta }),
};
