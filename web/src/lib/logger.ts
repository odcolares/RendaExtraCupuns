/**
 * Simple logger for Next.js (web) - console only
 */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogMeta {
  module?: string;
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
  const timestamp = new Date().toISOString();
  const moduleTag = meta?.module ? `[${meta.module}]` : "[App]";
  const extras = meta && Object.keys(meta).length > 1 
    ? ` ${JSON.stringify({ ...meta, module: undefined })}` 
    : "";
  return `${timestamp} ${level.toUpperCase()} ${moduleTag} ${message}${extras}`;
}

function createLogger(moduleName: string) {
  const baseMeta = { module: moduleName };
  
  return {
    error: (message: string, meta?: Record<string, unknown>) => 
      console.error(formatMessage("error", message, { ...baseMeta, ...meta })),
    warn: (message: string, meta?: Record<string, unknown>) => 
      console.warn(formatMessage("warn", message, { ...baseMeta, ...meta })),
    info: (message: string, meta?: Record<string, unknown>) => 
      console.log(formatMessage("info", message, { ...baseMeta, ...meta })),
    debug: (message: string, meta?: Record<string, unknown>) => 
      console.debug(formatMessage("debug", message, { ...baseMeta, ...meta })),
  };
}

export function createModuleLogger(moduleName: string) {
  return createLogger(moduleName);
}

export default {
  error: (message: string, meta?: Record<string, unknown>) => 
    console.error(formatMessage("error", message, meta)),
  warn: (message: string, meta?: Record<string, unknown>) => 
    console.warn(formatMessage("warn", message, meta)),
  info: (message: string, meta?: Record<string, unknown>) => 
    console.log(formatMessage("info", message, meta)),
  debug: (message: string, meta?: Record<string, unknown>) => 
    console.debug(formatMessage("debug", message, meta)),
};