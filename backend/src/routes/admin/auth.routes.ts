import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../../db/index.js';
import { generatePlatformAdminToken, requirePlatformAdmin } from '../../middleware/platformAdmin.js';
import { UnauthorizedError, ValidationError } from '../../errors/index.js';
import logger from '../../utils/logger.js';

const router = Router();
const SALT_ROUNDS = 12;

/**
 * POST /api/admin/auth/login
 * Authenticate platform admin
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        const { rows } = await query(
            'SELECT id, email, name, password_hash, is_active FROM platform_admins WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (rows.length === 0) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const admin = rows[0];

        if (!admin.is_active) {
            throw new UnauthorizedError('Account is deactivated');
        }

        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const token = generatePlatformAdminToken({
            id: admin.id,
            email: admin.email,
            name: admin.name,
        });

        logger.info({
            message: 'Platform admin logged in',
            adminId: admin.id,
            email: admin.email,
        });

        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/auth/me
 * Get current platform admin profile
 */
router.get('/me', requirePlatformAdmin, (req, res) => {
    res.json({ admin: req.platformAdmin });
});

/**
 * POST /api/admin/auth/setup
 * Create the first platform admin (only works when no admins exist)
 */
router.post('/setup', async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            throw new ValidationError('Email, password, and name are required');
        }

        // Check if any admin already exists
        const { rows: existing } = await query('SELECT COUNT(*) as count FROM platform_admins');
        if (parseInt(existing[0].count, 10) > 0) {
            throw new ValidationError('Platform admin already exists. Use login instead.');
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const { rows } = await query(
            `INSERT INTO platform_admins (email, password_hash, name)
       VALUES ($1, $2, $3) RETURNING id, email, name`,
            [email.toLowerCase().trim(), passwordHash, name.trim()]
        );

        const admin = rows[0];
        const token = generatePlatformAdminToken({
            id: admin.id as string,
            email: admin.email as string,
            name: admin.name as string,
        });

        logger.info({
            message: 'Initial platform admin created',
            adminId: admin.id,
            email: admin.email,
        });

        res.status(201).json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
