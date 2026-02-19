import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

const isDevelopment = env.NODE_ENV === 'development';

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  }),
);

const prodFormat = combine(
  timestamp(),
  json(),
  errors({ stack: true }),
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: {
    service: 'split-ledger-backend',
    environment: env.NODE_ENV,
  },
  format: isDevelopment ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});

export interface LogContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  [key: string]: unknown;
}

export const createLoggerWithContext = (context: LogContext) => {
  return logger.child(context);
};

export default logger;
