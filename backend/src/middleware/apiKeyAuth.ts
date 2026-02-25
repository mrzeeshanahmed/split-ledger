import type { Request, RequestHandler, Response } from 'express';
import { ApiKeyService } from '../services/apiKey.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';
import { ApiKeyScope, ApiKeyRateLimitStatus } from '../types/apiKey.js';
import logger from '../utils/logger.js';

declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        scopes: ApiKeyScope[];
        tenantId: string;
        rateLimitPerMinute: number;
        rateLimitPerDay: number;
        createdBy: string;
      };
    }
  }
}

/**
 * Extract API key from Authorization header
 * Expects format: "Bearer sk_live_..." or "Bearer sk_test_..."
 */
function extractApiKey(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  // Check if it's a Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const token = parts[1];

  // Check if token starts with correct prefix
  if (!token.startsWith('sk_live_') && !token.startsWith('sk_test_')) {
    return null;
  }

  return token;
}

/**
 * Require API key authentication middleware
 * Validates API key and attaches key info to request
 */
export const requireApiKey: RequestHandler = async (req, _res, next) => {
  try {
    // Get tenant from request
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new UnauthorizedError('Tenant context required');
    }

    // Extract API key
    const rawKey = extractApiKey(req);
    if (!rawKey) {
      throw new UnauthorizedError('API key required. Use Authorization: Bearer sk_live_...');
    }

    // Verify API key
    const verification = await ApiKeyService.verifyApiKey(rawKey, tenantId);
    if (!verification) {
      throw new UnauthorizedError('Invalid or expired API key');
    }

    const { apiKey } = verification;

    // Attach API key info to request
    req.apiKey = {
      id: apiKey.id,
      scopes: apiKey.scopes,
      tenantId,
      rateLimitPerMinute: apiKey.rate_limit_per_minute,
      rateLimitPerDay: apiKey.rate_limit_per_day,
      createdBy: apiKey.created_by,
    };

    // Update last_used_at timestamp asynchronously (fire and forget)
    ApiKeyService.updateLastUsed(apiKey.id, tenantId).catch((error) => {
      logger.error({
        message: 'Failed to update API key last_used_at',
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeyId: apiKey.id,
      });
    });

    logger.debug({
      message: 'API key authenticated',
      apiKeyId: apiKey.id,
      tenantId,
      scopes: apiKey.scopes,
    });

    next();
  } catch (error) {
    if (error instanceof Error) {
      return next(new UnauthorizedError(error.message));
    }
    return next(error);
  }
};

/**
 * Require specific scope middleware factory
 * Returns middleware that checks if API key has required scope
 */
export const requireScope =
  (...requiredScopes: ApiKeyScope[]): RequestHandler =>
    (req, _res, next) => {
      if (!req.apiKey) {
        throw new UnauthorizedError('API key authentication required');
      }

      // Check if API key has at least one of the required scopes
      const hasScope = requiredScopes.some((scope) => req.apiKey!.scopes.includes(scope));

      if (!hasScope) {
        logger.warn({
          message: 'Access denied: insufficient API key scope',
          apiKeyId: req.apiKey.id,
          requiredScopes,
          availableScopes: req.apiKey.scopes,
        });
        throw new ForbiddenError(
          `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`
        );
      }

      next();
    };

/**
 * Optional API key authentication middleware
 * Attempts to authenticate with API key but doesn't fail if no key
 */
export const optionalApiKeyAuth: RequestHandler = async (req, _res, next) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return next();
    }

    const rawKey = extractApiKey(req);
    if (!rawKey) {
      return next();
    }

    const verification = await ApiKeyService.verifyApiKey(rawKey, tenantId);
    if (!verification) {
      return next();
    }

    const { apiKey } = verification;

    req.apiKey = {
      id: apiKey.id,
      scopes: apiKey.scopes,
      tenantId,
      rateLimitPerMinute: apiKey.rate_limit_per_minute,
      rateLimitPerDay: apiKey.rate_limit_per_day,
      createdBy: apiKey.created_by,
    };

    ApiKeyService.updateLastUsed(apiKey.id, tenantId).catch(() => {
      // Silently ignore errors
    });
  } catch (error) {
    // Silently ignore auth errors for optional auth
    logger.debug({
      message: 'Optional API key auth failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  next();
};

/**
 * Get rate limit status for the current API key
 * This can be used to set response headers
 */
export function getApiKeyRateLimitStatus(
  req: Request
): ApiKeyRateLimitStatus | null {
  if (!req.apiKey) {
    return null;
  }

  // This is a placeholder - actual status is calculated in rate limiter middleware
  // The rate limiter middleware will set these headers on the response
  return {
    remainingMinute: req.apiKey.rateLimitPerMinute,
    limitMinute: req.apiKey.rateLimitPerMinute,
    resetMinute: Math.ceil(Date.now() / 60000) * 60000,
    remainingDay: req.apiKey.rateLimitPerDay,
    limitDay: req.apiKey.rateLimitPerDay,
    resetDay: Math.ceil(Date.now() / 86400000) * 86400000,
  };
}
