import rateLimit, { Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../db/redis.js';
import { TooManyRequestsError } from '../errors/index.js';
import type { Request, Response, NextFunction } from 'express';

/**
 * Get rate limit key that includes IP and tenant
 */
const getRateLimitKey = (req: Request): string => {
  const ip = req.ip || 'unknown';
  const tenantId = req.tenantId || 'unknown';
  return `${ip}:${tenantId}`;
};

const isDev = process.env.NODE_ENV === 'development';

/**
 * Helper to create a lazy rate limiter that initializes its store on first use.
 * In development/test mode, uses in-memory store with relaxed limits.
 */
const createLazyLimiter = (options: Partial<Options>, devOptions?: { devMax?: number }) => {
  let limiter: any;

  return (req: Request, res: Response, next: NextFunction) => {
    if (!limiter) {
      const skipRedis = isDev || process.env.NODE_ENV === 'test';
      limiter = rateLimit({
        ...options,
        // Use relaxed limits in dev if provided
        max: (isDev && devOptions?.devMax) ? devOptions.devMax : options.max,
        store: skipRedis
          ? undefined
          : new RedisStore({
            sendCommand: async (...args: string[]) => {
              const redis = getRedisClient();
              return redis.sendCommand(args) as any;
            },
          }),
      });
    }
    return limiter(req, res, next);
  };
};

/**
 * Rate limiter for authentication endpoints
 * 10 requests per 15 minutes per IP per tenant
 */
export const authRateLimiter = createLazyLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRateLimitKey(req),
  handler: (_req, _res) => {
    throw new TooManyRequestsError(
      'Too many authentication attempts. Please try again later.'
    );
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === '/health' || req.path === '/ready') {
      return true;
    }
    return false;
  },
}, { devMax: 100 });

/**
 * Strict rate limiter for password reset endpoints
 * 3 requests per hour per IP per tenant
 */
export const passwordResetLimiter = createLazyLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRateLimitKey(req),
  handler: (_req, _res) => {
    throw new TooManyRequestsError(
      'Too many password reset attempts. Please try again later.'
    );
  },
}, { devMax: 50 });

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP per tenant
 */
export const apiRateLimiter = createLazyLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRateLimitKey(req),
  handler: (_req, _res) => {
    throw new TooManyRequestsError(
      'Too many requests. Please try again later.'
    );
  },
});

/**
 * User-specific rate limiter
 * 200 requests per 15 minutes per user
 */
export const userRateLimiter = createLazyLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.userId || req.user?.id || 'anonymous';
    const tenantId = req.tenantId || 'unknown';
    return `${tenantId}:${userId}`;
  },
  handler: (_req, _res) => {
    throw new TooManyRequestsError(
      'Too many requests. Please try again later.'
    );
  },
  skip: (req) => {
    // Only apply to authenticated users
    return !req.user;
  },
});
