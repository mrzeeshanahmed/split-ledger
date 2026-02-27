import { Router } from 'express';
import { query } from '../../db/index.js';
import { NotFoundError, ValidationError } from '../../errors/index.js';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/admin/tenants
 * List all tenants with status, user count, and revenue
 */
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt((req.query.page as string) || '1', 10);
        const limit = parseInt((req.query.limit as string) || '50', 10);
        const offset = (page - 1) * limit;
        const search = (req.query.search as string) || '';

        let whereClause = '';
        const params: any[] = [];

        if (search) {
            params.push(`%${search}%`);
            whereClause = `WHERE t.name ILIKE $${params.length} OR t.subdomain ILIKE $${params.length}`;
        }

        const { rows: tenants } = await query(
            `SELECT t.id, t.name, t.subdomain, t.status, t.custom_domain,
              t.billing_email, t.created_at, t.updated_at
       FROM tenants t
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );

        const { rows: countResult } = await query(
            `SELECT COUNT(*) as total FROM tenants t ${whereClause}`,
            params
        );

        res.json({
            tenants,
            pagination: {
                page,
                limit,
                total: parseInt(countResult[0].total, 10),
                totalPages: Math.ceil(parseInt(countResult[0].total, 10) / limit),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/tenants/:tenantId
 * Get detailed information about a specific tenant
 */
router.get('/:tenantId', async (req, res, next) => {
    try {
        const { tenantId } = req.params;

        const { rows } = await query(
            `SELECT id, name, subdomain, status, custom_domain, billing_email,
              stripe_account_id, stripe_account_status,
              created_at, updated_at
       FROM tenants WHERE id = $1`,
            [tenantId]
        );

        if (rows.length === 0) {
            throw new NotFoundError('Tenant');
        }

        const tenant = rows[0];

        // Get schema name for user count query
        const schemaName = `tenant_${tenantId.replace(/-/g, '')}`;

        let userCount = 0;
        try {
            const { rows: userRows } = await query(
                `SELECT COUNT(*) as count FROM ${schemaName}.users`
            );
            userCount = parseInt(userRows[0].count, 10);
        } catch {
            // Schema may not exist yet
        }

        res.json({
            tenant: {
                ...tenant,
                userCount,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/admin/tenants/:tenantId/status
 * Activate, suspend, or deactivate a tenant
 */
router.patch('/:tenantId/status', async (req, res, next) => {
    try {
        const { tenantId } = req.params;
        const { status } = req.body;

        const validStatuses = ['active', 'suspended', 'deactivated'];
        if (!status || !validStatuses.includes(status)) {
            throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
        }

        const { rows } = await query(
            `UPDATE tenants SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, name, subdomain, status`,
            [status, tenantId]
        );

        if (rows.length === 0) {
            throw new NotFoundError('Tenant');
        }

        logger.info({
            message: 'Tenant status updated by platform admin',
            tenantId,
            newStatus: status,
            updatedBy: req.platformAdmin?.id,
        });

        res.json({ tenant: rows[0] });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/tenants/:tenantId/users
 * List users within a specific tenant
 */
router.get('/:tenantId/users', async (req, res, next) => {
    try {
        const { tenantId } = req.params;

        // Verify tenant exists
        const { rows: tenantRows } = await query(
            'SELECT id FROM tenants WHERE id = $1',
            [tenantId]
        );

        if (tenantRows.length === 0) {
            throw new NotFoundError('Tenant');
        }

        const schemaName = `tenant_${tenantId.replace(/-/g, '')}`;

        try {
            const { rows: users } = await query(
                `SELECT id, email, name, role, is_active, last_login, created_at
         FROM ${schemaName}.users
         ORDER BY created_at DESC`
            );

            res.json({ users });
        } catch {
            // Schema may not exist
            res.json({ users: [] });
        }
    } catch (error) {
        next(error);
    }
});

export default router;
