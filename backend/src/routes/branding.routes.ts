import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantContext.js';
import { query } from '../db/index.js';
import logger from '../utils/logger.js';

const router = Router({ mergeParams: true });

/**
 * GET /branding
 * Get tenant branding configuration
 */
router.get(
    '/',
    requireTenant,
    requireAuth,
    async (req, res, next) => {
        try {
            const tenantId = req.tenantId!;

            const { rows } = await query(
                `SELECT logo_url, primary_color, secondary_color, custom_domain, name
         FROM tenants WHERE id = $1`,
                [tenantId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            res.json({ branding: rows[0] });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /branding
 * Update tenant branding (owner only)
 */
router.patch(
    '/',
    requireTenant,
    requireAuth,
    requireRole('owner'),
    async (req, res, next) => {
        try {
            const tenantId = req.tenantId!;
            const { logoUrl, primaryColor, secondaryColor, customDomain } = req.body;

            const updates: string[] = [];
            const params: any[] = [];
            let paramIdx = 1;

            if (logoUrl !== undefined) {
                updates.push(`logo_url = $${paramIdx++}`);
                params.push(logoUrl);
            }
            if (primaryColor !== undefined) {
                if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
                    return res.status(400).json({ error: 'Invalid primary color format (use #RRGGBB)' });
                }
                updates.push(`primary_color = $${paramIdx++}`);
                params.push(primaryColor);
            }
            if (secondaryColor !== undefined) {
                if (!/^#[0-9A-Fa-f]{6}$/.test(secondaryColor)) {
                    return res.status(400).json({ error: 'Invalid secondary color format (use #RRGGBB)' });
                }
                updates.push(`secondary_color = $${paramIdx++}`);
                params.push(secondaryColor);
            }
            if (customDomain !== undefined) {
                updates.push(`custom_domain = $${paramIdx++}`);
                params.push(customDomain || null);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            updates.push(`updated_at = NOW()`);
            params.push(tenantId);

            const { rows } = await query(
                `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIdx}
         RETURNING logo_url, primary_color, secondary_color, custom_domain, name`,
                params
            );

            logger.info({
                message: 'Tenant branding updated',
                tenantId,
                updatedFields: updates.filter(u => u !== 'updated_at = NOW()').map(u => u.split(' = ')[0]),
            });

            res.json({ branding: rows[0] });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
