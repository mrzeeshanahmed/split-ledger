import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';
import logger from '../utils/logger.js';

export interface PlatformAdmin {
    id: string;
    email: string;
    name: string;
}

declare global {
    namespace Express {
        interface Request {
            platformAdmin?: PlatformAdmin;
        }
    }
}

interface PlatformAdminJWTPayload {
    adminId: string;
    email: string;
    name: string;
    audience: string;
}

/**
 * Middleware to require platform admin authentication.
 * Uses JWT with a 'platform_admin' audience claim to distinguish
 * from tenant user tokens.
 */
export const requirePlatformAdmin: RequestHandler = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedError('Platform admin token required');
        }

        const token = authHeader.slice(7);

        const payload = jwt.verify(token, env.JWT_SECRET) as PlatformAdminJWTPayload;

        if (payload.audience !== 'platform_admin') {
            throw new ForbiddenError('Not a platform admin token');
        }

        // Verify admin still exists and is active
        const { rows } = await query(
            'SELECT id, email, name, is_active FROM platform_admins WHERE id = $1',
            [payload.adminId]
        );

        if (rows.length === 0) {
            throw new UnauthorizedError('Platform admin not found');
        }

        if (!rows[0].is_active) {
            throw new ForbiddenError('Platform admin account is deactivated');
        }

        req.platformAdmin = {
            id: rows[0].id,
            email: rows[0].email,
            name: rows[0].name,
        };

        next();
    } catch (error) {
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            return next(error);
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new UnauthorizedError('Invalid platform admin token'));
        }
        logger.error({
            message: 'Platform admin auth error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
};

/**
 * Generate JWT for platform admin
 */
export function generatePlatformAdminToken(admin: PlatformAdmin): string {
    return jwt.sign(
        {
            adminId: admin.id,
            email: admin.email,
            name: admin.name,
            audience: 'platform_admin',
        },
        env.JWT_SECRET,
        { expiresIn: '8h' }
    );
}
