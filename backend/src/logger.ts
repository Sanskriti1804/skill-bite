import type { AppConfig } from "./config.js";

const rank = { debug: 10, info: 20, warn: 30, error: 40 } as const;

export type Logger = {
  debug: (message: string, fields?: Record<string, unknown>) => void;
  info: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
  error: (message: string, fields?: Record<string, unknown>) => void;
};

export function createLogger(config: AppConfig): Logger {
  const write = (level: keyof typeof rank, message: string, fields?: Record<string, unknown>) => {
    if (rank[level] < rank[config.LOG_LEVEL]) {
      return;
    }
    const line = JSON.stringify({
      time: new Date().toISOString(),
      level,
      message,
      ...fields,
    });
    if (level === "error" || level === "warn") {
      console.error(line);
      return;
    }
    console.log(line);
  };

  return {
    debug: (message, fields) => write("debug", message, fields),
    info: (message, fields) => write("info", message, fields),
    warn: (message, fields) => write("warn", message, fields),
    error: (message, fields) => write("error", message, fields),
  };
}
