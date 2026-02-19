import type { Request, RequestHandler, Response } from 'express';
import { checkRateLimit } from '../db/redis.js';
import { TooManyRequestsError } from '../errors/index.js';
import { ApiKeyService } from '../services/apiKey.js';
import logger from '../utils/logger.js';

/**
 * Calculate reset time for sliding window
 * Returns the timestamp when the window will reset
 */
function calculateResetTime(windowSeconds: number): number {
  return Date.now() + windowSeconds * 1000;
}

/**
 * Format reset time for Retry-After header (seconds until reset)
 */
function calculateRetryAfter(resetTime: number): number {
  return Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
}

/**
 * API Key rate limiter middleware
 * Uses sliding window algorithm with Redis for per-key rate limiting
 * Enforces both per-minute and per-day limits
 */
export const apiKeyRateLimiter: RequestHandler = async (req, res, next) => {
  // Skip if no API key is attached
  if (!req.apiKey) {
    return next();
  }

  try {
    const apiKeyId = req.apiKey.id;

    // Check per-minute limit
    const minuteKey = `rl:apikey:${apiKeyId}:min`;
    const minuteResult = await checkRateLimit(minuteKey, 60, req.apiKey.rateLimitPerMinute);

    // Check per-day limit
    const dayKey = `rl:apikey:${apiKeyId}:day`;
    const dayResult = await checkRateLimit(dayKey, 86400, req.apiKey.rateLimitPerDay);

    // Set rate limit headers
    const remainingMinute = Math.max(0, req.apiKey.rateLimitPerMinute - minuteResult.count);
    const remainingDay = Math.max(0, req.apiKey.rateLimitPerDay - dayResult.count);

    res.setHeader('X-RateLimit-Limit-Minute', req.apiKey.rateLimitPerMinute);
    res.setHeader('X-RateLimit-Remaining-Minute', remainingMinute);
    res.setHeader('X-RateLimit-Reset-Minute', minuteResult.resetAt);

    res.setHeader('X-RateLimit-Limit-Day', req.apiKey.rateLimitPerDay);
    res.setHeader('X-RateLimit-Remaining-Day', remainingDay);
    res.setHeader('X-RateLimit-Reset-Day', dayResult.resetAt);

    // Also set standard headers for compatibility
    res.setHeader('X-RateLimit-Limit', req.apiKey.rateLimitPerMinute);
    res.setHeader('X-RateLimit-Remaining', remainingMinute);
    res.setHeader('X-RateLimit-Reset', minuteResult.resetAt);

    // Check if limits are exceeded
    if (minuteResult.exceeded) {
      const retryAfter = calculateRetryAfter(minuteResult.resetAt);
      res.setHeader('Retry-After', retryAfter);

      logger.warn({
        message: 'API key rate limit exceeded (minute)',
        apiKeyId,
        count: minuteResult.count,
        limit: req.apiKey.rateLimitPerMinute,
        retryAfter,
      });

      throw new TooManyRequestsError(
        `Rate limit exceeded. Maximum ${req.apiKey.rateLimitPerMinute} requests per minute.`
      );
    }

    if (dayResult.exceeded) {
      const retryAfter = calculateRetryAfter(dayResult.resetAt);
      res.setHeader('Retry-After', retryAfter);

      logger.warn({
        message: 'API key rate limit exceeded (day)',
        apiKeyId,
        count: dayResult.count,
        limit: req.apiKey.rateLimitPerDay,
        retryAfter,
      });

      throw new TooManyRequestsError(
        `Rate limit exceeded. Maximum ${req.apiKey.rateLimitPerDay} requests per day.`
      );
    }

    logger.debug({
      message: 'API key rate limit check passed',
      apiKeyId,
      minuteRemaining: remainingMinute,
      dayRemaining: remainingDay,
    });

    next();
  } catch (error) {
    if (error instanceof TooManyRequestsError) {
      throw error;
    }

    // On Redis errors, log but allow the request to proceed (fail open)
    // This ensures the API remains functional even if Redis is down
    logger.error({
      message: 'API key rate limiter error, allowing request',
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyId: req.apiKey?.id,
    });

    next();
  }
};

/**
 * API key rate limiter that tracks usage in the database
 * This middleware should be used after the response is sent
 * It records usage statistics for analytics
 */
export const apiKeyUsageTracker: RequestHandler = async (req, res, next) => {
  if (!req.apiKey) {
    return next();
  }

  // Capture the original end function
  const originalEnd = res.end;

  // Override end to capture response data
  res.end = function (...args: any[]) {
    // Call original end
    originalEnd.apply(this, args);

    // Record usage asynchronously (fire and forget)
    const startTime = res.locals.startTime || Date.now();
    const responseTime = Date.now() - startTime;

    ApiKeyService.createUsageRecord(
      {
        api_key_id: req.apiKey!.id,
        endpoint: req.path,
        method: req.method,
        status_code: res.statusCode,
        response_time_ms: responseTime,
        ip_address: req.ip || null,
        user_agent: req.headers['user-agent'] || null,
      },
      req.apiKey!.tenantId
    ).catch((error) => {
      logger.error({
        message: 'Failed to record API key usage',
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeyId: req.apiKey!.id,
      });
    });
  };

  // Store start time for response time calculation
  res.locals.startTime = Date.now();

  next();
};
