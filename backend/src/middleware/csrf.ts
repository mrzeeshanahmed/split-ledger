import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_COOKIE_NAME = '_csrf';
const TOKEN_LENGTH = 32;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Generate a cryptographically random CSRF token
 */
function generateToken(): string {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware: Set CSRF token cookie on every response
 * The frontend reads this cookie and sends it back as a header
 */
export function setCSRFToken(req: Request, res: Response, next: NextFunction): void {
    // Only set if not already present
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
        const token = generateToken();
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false, // Must be readable by JavaScript
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
    }
    next();
}

/**
 * Middleware: Validate CSRF token on state-changing requests
 * Skips: safe methods (GET, HEAD, OPTIONS), API key auth, admin auth
 */
export function validateCSRF(req: Request, res: Response, next: NextFunction): void {
    // Skip safe methods
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    // Skip if request is authenticated via API key (not a browser session)
    if (req.headers['x-api-key']) {
        return next();
    }

    // Skip if no cookies present (likely a non-browser client)
    if (!req.cookies || Object.keys(req.cookies).length === 0) {
        return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_TOKEN_HEADER] as string | undefined;

    if (!cookieToken || !headerToken) {
        logger.warn({
            message: 'CSRF validation failed: missing token',
            hasCookie: !!cookieToken,
            hasHeader: !!headerToken,
            path: req.path,
            method: req.method,
        });

        res.status(403).json({
            error: 'CSRF validation failed',
            message: 'Missing CSRF token. Please refresh the page and try again.',
        });
        return;
    }

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
        logger.warn({
            message: 'CSRF validation failed: token mismatch',
            path: req.path,
            method: req.method,
        });

        res.status(403).json({
            error: 'CSRF validation failed',
            message: 'Invalid CSRF token. Please refresh the page and try again.',
        });
        return;
    }

    next();
}
