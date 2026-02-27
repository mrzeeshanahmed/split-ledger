import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantContext.js';
import { tenantDb } from '../db/tenantClient.js';
import { AuthService } from '../services/auth.js';
import logger from '../utils/logger.js';

const router = Router({ mergeParams: true });

/**
 * GET /users
 * List all users in the tenant (admin/owner only)
 */
router.get(
    '/',
    requireTenant,
    requireAuth,
    requireRole('owner', 'admin'),
    async (req, res, next) => {
        try {
            const tenantSchema = req.tenantSchema!;
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
            const offset = (page - 1) * limit;
            const search = req.query.search as string;

            let whereClause = '';
            const params: any[] = [];

            if (search) {
                params.push(`%${search}%`);
                whereClause = `WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`;
            }

            const countResult = await tenantDb.query(
                tenantSchema,
                `SELECT COUNT(*) FROM users ${whereClause}`,
                params
            );

            const { rows } = await tenantDb.query(
                tenantSchema,
                `SELECT id, email, first_name, last_name, role, status, email_verified,
                last_login_at, created_at, updated_at
         FROM users ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                [...params, limit, offset]
            );

            res.json({
                users: rows,
                pagination: {
                    page,
                    limit,
                    total: parseInt(countResult.rows[0].count),
                    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /users/:userId/role
 * Update a user's role (owner only)
 */
router.patch(
    '/:userId/role',
    requireTenant,
    requireAuth,
    requireRole('owner'),
    async (req, res, next) => {
        try {
            const tenantSchema = req.tenantSchema!;
            const { userId } = req.params;
            const { role } = req.body;

            if (!['member', 'admin', 'owner'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            // Cannot change own role
            if (userId === req.userId) {
                return res.status(400).json({ error: 'Cannot change your own role' });
            }

            const { rowCount } = await tenantDb.query(
                tenantSchema,
                'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
                [role, userId]
            );

            if (rowCount === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            logger.info({
                message: 'User role updated',
                tenantId: req.tenantId,
                targetUserId: userId,
                newRole: role,
                updatedBy: req.userId,
            });

            res.json({ success: true, userId, role });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /users/:userId/status
 * Activate or deactivate a user (owner/admin only)
 */
router.patch(
    '/:userId/status',
    requireTenant,
    requireAuth,
    requireRole('owner', 'admin'),
    async (req, res, next) => {
        try {
            const tenantSchema = req.tenantSchema!;
            const { userId } = req.params;
            const { status } = req.body;

            if (!['active', 'inactive', 'suspended'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            if (userId === req.userId) {
                return res.status(400).json({ error: 'Cannot change your own status' });
            }

            const { rowCount } = await tenantDb.query(
                tenantSchema,
                'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
                [status, userId]
            );

            if (rowCount === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            logger.info({
                message: 'User status updated',
                tenantId: req.tenantId,
                targetUserId: userId,
                newStatus: status,
                updatedBy: req.userId,
            });

            res.json({ success: true, userId, status });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /users/invite
 * Invite a new user to the tenant
 */
router.post(
    '/invite',
    requireTenant,
    requireAuth,
    requireRole('owner', 'admin'),
    async (req, res, next) => {
        try {
            const tenantSchema = req.tenantSchema!;
            const { email, firstName, lastName, role = 'member' } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            if (!['member', 'admin'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role for invitation' });
            }

            // Check if user already exists
            const { rows: existing } = await tenantDb.query(
                tenantSchema,
                'SELECT id FROM users WHERE email = $1',
                [email.toLowerCase()]
            );

            if (existing.length > 0) {
                return res.status(409).json({ error: 'User with this email already exists' });
            }

            // Generate a random temp password; the invited user will reset it
            const tempPassword = AuthService.generateRandomPassword();
            const passwordHash = await AuthService.hashPassword(tempPassword);

            const { rows } = await tenantDb.query(
                tenantSchema,
                `INSERT INTO users (email, password_hash, first_name, last_name, role, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         RETURNING id, email, first_name, last_name, role`,
                [email.toLowerCase(), passwordHash, firstName || '', lastName || '', role]
            );

            // Send invite email with temp password (best effort)
            try {
                const { EmailService } = await import('../services/email.js');
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                await EmailService.sendEmail({
                    to: email,
                    subject: `You've been invited to Split-Ledger`,
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to Split-Ledger!</h2>
              <p>You've been invited to join a workspace. Here are your credentials:</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p><a href="${frontendUrl}/login">Log in here</a> and change your password immediately.</p>
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">Split-Ledger Platform</p>
            </div>
          `,
                    text: `You've been invited to Split-Ledger. Login at ${frontendUrl}/login with email: ${email} and temp password: ${tempPassword}`,
                });
            } catch (emailErr) {
                logger.warn({
                    message: 'Failed to send invite email (SMTP may not be configured)',
                    error: emailErr instanceof Error ? emailErr.message : 'Unknown error',
                });
            }

            logger.info({
                message: 'User invited',
                tenantId: req.tenantId,
                invitedUserId: rows[0].id,
                invitedBy: req.userId,
            });

            res.status(201).json({ success: true, user: rows[0] });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
