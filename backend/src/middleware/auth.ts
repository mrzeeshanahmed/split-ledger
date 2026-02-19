import type { Request, RequestHandler, Response } from 'express';
import { AuthService } from '../services/auth.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';
import { TokenPayload } from '../types/user.js';
import { getAccessTokenFromRequest } from '../utils/cookies.js';
import logger from '../utils/logger.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
        role: string;
        tenantId: string;
      };
    }
  }
}

/**
 * Require authentication middleware
 * Validates access token and attaches user info to request
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  try {
    // Get tenant from request
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new UnauthorizedError('Tenant context required');
    }

    // Extract access token
    const token = getAccessTokenFromRequest(req);
    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    // Verify token
    const payload = AuthService.verifyAccessToken(token, tenantId);

    // Attach user info to request
    req.userId = payload.userId;
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      throw new UnauthorizedError(error.message);
    }
    next(error);
  }
};

/**
 * Require specific role middleware factory
 * Returns middleware that checks if user has required role
 */
export const requireRole =
  (...allowedRoles: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn({
        message: 'Access denied: insufficient role',
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token
 */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return next();
    }

    const token = getAccessTokenFromRequest(req);
    if (!token) {
      return next();
    }

    const payload = AuthService.verifyAccessToken(token, tenantId);

    req.userId = payload.userId;
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };
  } catch (error) {
    // Silently ignore auth errors for optional auth
    logger.debug({
      message: 'Optional auth failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  next();
};
