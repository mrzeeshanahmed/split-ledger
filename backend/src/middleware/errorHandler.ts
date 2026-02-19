import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/index.js';
import logger from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestLogger = logger.child({
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    requestLogger.warn({
      message: err.message,
      code: err.code,
      status: err.status,
      details: err.details,
    });

    res.status(err.status).json(err.toJSON());
    return;
  }

  requestLogger.error({
    message: err.message,
    stack: err.stack,
  });

  const isDevelopment = env.NODE_ENV === 'development';

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? err.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};
