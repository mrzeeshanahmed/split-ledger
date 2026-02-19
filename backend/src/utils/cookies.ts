import type { Response } from 'express';
import { env } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  domain: env.COOKIE_DOMAIN,
  path: '/',
};

/**
 * Set access token cookie
 */
export const setAccessTokenCookie = (res: Response, token: string): void => {
  res.cookie('access_token', token, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Set refresh token cookie
 */
export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie('refresh_token', token, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/auth/refresh',
  });
};

/**
 * Set both auth cookies
 */
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
};

/**
 * Clear access token cookie
 */
export const clearAccessTokenCookie = (res: Response): void => {
  res.clearCookie('access_token', {
    ...COOKIE_OPTIONS,
    path: '/',
  });
};

/**
 * Clear refresh token cookie
 */
export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie('refresh_token', {
    ...COOKIE_OPTIONS,
    path: '/auth/refresh',
  });
};

/**
 * Clear all auth cookies
 */
export const clearAuthCookies = (res: Response): void => {
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
};

/**
 * Get access token from request
 */
export const getAccessTokenFromRequest = (req: {
  cookies?: { access_token?: string };
  headers?: { authorization?: string | string[] };
}): string | undefined => {
  // First check cookie
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  // Then check Authorization header
  const authHeader = req.headers?.authorization;
  if (Array.isArray(authHeader)) {
    const bearerToken = authHeader.find((h) => h.startsWith('Bearer '));
    if (bearerToken) {
      return bearerToken.substring(7);
    }
  } else if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return undefined;
};

/**
 * Get refresh token from request
 */
export const getRefreshTokenFromRequest = (req: {
  cookies?: { refresh_token?: string };
  body?: { refreshToken?: string };
}): string | undefined => {
  // First check cookie
  if (req.cookies?.refresh_token) {
    return req.cookies.refresh_token;
  }

  // Then check body
  return req.body?.refreshToken;
};
