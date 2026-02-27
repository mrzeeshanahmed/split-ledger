import { Router } from 'express';
import { query } from '../../db/index.js';
import { ValidationError } from '../../errors/index.js';
import logger from '../../utils/logger.js';

const router = Router();

// Keys that should have their values masked in GET responses
const SENSITIVE_KEYS = ['smtp_pass'];

/**
 * GET /api/admin/settings
 * Get all platform settings (sensitive values masked)
 */
router.get('/', async (req, res, next) => {
    try {
        const { rows } = await query(
            `SELECT key, value, encrypted, description, updated_at
       FROM platform_settings
       ORDER BY key`
        );

        const settings = rows.map((row) => ({
            ...row,
            value: SENSITIVE_KEYS.includes(row.key) && row.value ? '••••••••' : row.value,
        }));

        res.json({ settings });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/admin/settings
 * Update platform settings (batch key-value pairs)
 */
router.patch('/', async (req, res, next) => {
    try {
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            throw new ValidationError('Settings must be an object of key-value pairs');
        }

        const adminId = req.platformAdmin?.id;
        const updatedKeys: string[] = [];

        for (const [key, value] of Object.entries(settings)) {
            if (typeof value !== 'string') continue;

            await query(
                `UPDATE platform_settings
         SET value = $1, updated_at = NOW(), updated_by = $2
         WHERE key = $3`,
                [value, adminId, key]
            );
            updatedKeys.push(key);
        }

        logger.info({
            message: 'Platform settings updated',
            updatedKeys,
            updatedBy: adminId,
        });

        // Return all settings (with sensitive values masked)
        const { rows } = await query(
            `SELECT key, value, encrypted, description, updated_at
       FROM platform_settings ORDER BY key`
        );

        const responseSettings = rows.map((row) => ({
            ...row,
            value: SENSITIVE_KEYS.includes(row.key) && row.value ? '••••••••' : row.value,
        }));

        res.json({
            message: `Updated ${updatedKeys.length} setting(s)`,
            settings: responseSettings,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/settings/smtp/test
 * Send a test email to verify SMTP configuration
 */
router.post('/smtp/test', async (req, res, next) => {
    try {
        const { recipientEmail } = req.body;

        if (!recipientEmail) {
            throw new ValidationError('recipientEmail is required');
        }

        // Dynamic import to avoid circular deps before email service exists
        try {
            const { EmailService } = await import('../../services/email.js');
            const result = await EmailService.sendTestEmail(recipientEmail);
            res.json(result);
        } catch (importError: any) {
            if (importError.code === 'ERR_MODULE_NOT_FOUND') {
                res.json({
                    success: false,
                    error: 'Email service not yet implemented. Complete Phase 4 first.',
                });
            } else {
                throw importError;
            }
        }
    } catch (error) {
        next(error);
    }
});

export default router;
