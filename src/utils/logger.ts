/**
 * Logger estruturado com Winston.
 * Suporta níveis: error, warn, info, debug
 * Log no console com cores + arquivo rotativo opcional.
 */

import winston from "winston";
import path from "path";

// ==============================================================
// Formatadores personalizados
// ==============================================================

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, module, ...rest }) => {
    const tag = module ? `[${module}]` : "[App]";
    const extras = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
    return `${timestamp} ${level} ${tag} ${message}${extras}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.json()
);

// ==============================================================
// Criação do Logger
// ==============================================================

const logDir = path.resolve(__dirname, "../../logs");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    // Console com cores
    new winston.transports.Console({ format: consoleFormat }),

    // Arquivo de erro (sempre)
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 3,
      format: fileFormat,
    }),

    // Arquivo combinado (todos os níveis)
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      format: fileFormat,
    }),
  ],
});

// ==============================================================
// Logger contextualizado por módulo
// ==============================================================

export function createModuleLogger(moduleName: string) {
  return {
    error: (message: string, meta?: Record<string, unknown>) =>
      logger.error(message, { module: moduleName, ...meta }),
    warn: (message: string, meta?: Record<string, unknown>) =>
      logger.warn(message, { module: moduleName, ...meta }),
    info: (message: string, meta?: Record<string, unknown>) =>
      logger.info(message, { module: moduleName, ...meta }),
    debug: (message: string, meta?: Record<string, unknown>) =>
      logger.debug(message, { module: moduleName, ...meta }),
  };
}

export default logger;
