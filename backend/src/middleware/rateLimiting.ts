import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../db/redis.js';
import { TooManyRequestsError } from '../errors/index.js';
import type { Request } from 'express';

/**
 * Get rate limit key that includes IP and tenant
 */
const getRateLimitKey = (req: Request): string => {
  const ip = req.ip || 'unknown';
  const tenantId = req.tenantId || 'unknown';
  return `${ip}:${tenantId}`;
};

/**
 * Rate limiter for authentication endpoints
 * 10 requests per 15 minutes per IP per tenant
 */
export const authRateLimiter = rateLimit({
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
  store: process.env.NODE_ENV === 'test'
    ? undefined // Use memory store in tests
    : new RedisStore({
        sendCommand: async (...args: string[]) => {
          const redis = getRedisClient();
          return redis.sendCommand(args) as any;
        },
      }),
  skip: (req) => {
    // Skip rate limiting for health checks and development if needed
    if (req.path === '/health' || req.path === '/ready') {
      return true;
    }
    return false;
  },
});

/**
 * Strict rate limiter for password reset endpoints
 * 3 requests per hour per IP per tenant
 */
export const passwordResetLimiter = rateLimit({
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
  store: process.env.NODE_ENV === 'test'
    ? undefined
    : new RedisStore({
        sendCommand: async (...args: string[]) => {
          const redis = getRedisClient();
          return redis.sendCommand(args) as any;
        },
      }),
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP per tenant
 */
export const apiRateLimiter = rateLimit({
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
  store: process.env.NODE_ENV === 'test'
    ? undefined
    : new RedisStore({
        sendCommand: async (...args: string[]) => {
          const redis = getRedisClient();
          return redis.sendCommand(args) as any;
        },
      }),
  skip: (req) => {
    // Skip for authenticated users (use user-specific limiters instead)
    return !!req.user;
  },
});

/**
 * User-specific rate limiter
 * 200 requests per 15 minutes per user
 */
export const userRateLimiter = rateLimit({
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
  store: process.env.NODE_ENV === 'test'
    ? undefined
    : new RedisStore({
        sendCommand: async (...args: string[]) => {
          const redis = getRedisClient();
          return redis.sendCommand(args) as any;
        },
      }),
  skip: (req) => {
    // Only apply to authenticated users
    return !req.user;
  },
});
