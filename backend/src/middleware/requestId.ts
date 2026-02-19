import type { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const requestId = req.headers['x-request-id'] as string | undefined;
  req.requestId = requestId || uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};
