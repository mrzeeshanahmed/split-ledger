import { Router } from 'express';
import { AuthService } from '../services/auth.js';
import {
  authRateLimiter,
  passwordResetLimiter,
} from '../middleware/rateLimiting.js';
import { validate } from '../middleware/validate.js';
import {
  requireAuth,
  requireRole,
} from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantContext.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../errors/index.js';
import { tenantDb } from '../db/tenantClient.js';
import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenFromRequest,
} from '../utils/cookies.js';
import logger from '../utils/logger.js';
import {
  registerSchema,
  registerTenantSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validation/auth.validation.js';
import { TenantProvisioningService } from '../services/tenantProvisioning.js';

const router = Router({ mergeParams: true });

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  '/register',
  requireTenant,
  authRateLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const tenantSchema = req.tenantSchema!;

      // Check if user already exists
      const { rows: existingUsers } = await tenantDb.query(
        tenantSchema,
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUsers.length > 0) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(password);

      // Create user
      const { rows } = await tenantDb.query(
        tenantSchema,
        `INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified)
         VALUES ($1, $2, $3, $4, 'member', 'active', FALSE)
         RETURNING id, email, first_name, last_name, role, status, email_verified, created_at`,
        [email.toLowerCase(), passwordHash, firstName, lastName]
      );

      const user = rows[0];

      // Generate tokens
      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: user.id,
        tenantId: req.tenantId!,
        email: user.email,
        role: user.role,
      });

      // Set cookies
      setAuthCookies(res, accessToken, refreshToken);

      logger.info({
        message: 'User registered successfully',
        userId: user.id,
        tenantId: req.tenantId,
        email: user.email,
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/register-tenant
 * Register a new workspace/tenant and its owner
 */
router.post(
  '/register-tenant',
  authRateLimiter,
  validate(registerTenantSchema),
  async (req, res, next) => {
    try {
      const { workspaceName, email, password, firstName, lastName } = req.body;

      // Generate a safe base subdomain
      let baseSubdomain = workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      if (!baseSubdomain || baseSubdomain.length < 3) {
        baseSubdomain = `tenant-${Math.random().toString(36).substring(2, 6)}`;
      }

      // Ensure it's not too long
      baseSubdomain = baseSubdomain.substring(0, 50);

      let subdomain = baseSubdomain;
      let counter = 1;

      // Find an available subdomain
      while (true) {
        try {
          await TenantProvisioningService.validateSubdomain(subdomain);
          break; // It's valid and available
        } catch (err: any) {
          if (err.code === 'DUPLICATE_SUBDOMAIN' || err.code === 'RESERVED_SUBDOMAIN' || err.errorCode === 'DUPLICATE_SUBDOMAIN' || err.errorCode === 'RESERVED_SUBDOMAIN') {
            subdomain = `${baseSubdomain}-${counter}`;
            counter++;
          } else {
            throw err; // Some other validation error
          }
        }
      }

      // Provision the tenant and owner
      const result = await TenantProvisioningService.provisionTenant({
        name: workspaceName,
        subdomain,
        owner_email: email.toLowerCase(),
        owner_password: password,
        owner_first_name: firstName,
        owner_last_name: lastName,
      });

      // Generate tokens for the new owner
      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: result.owner.id,
        tenantId: result.tenant.id,
        email: result.owner.email,
        role: result.owner.role,
      });

      // Set cookies
      setAuthCookies(res, accessToken, refreshToken);

      logger.info({
        message: 'Tenant and owner registered successfully',
        tenantId: result.tenant.id,
        userId: result.owner.id,
        email: result.owner.email,
      });

      res.status(201).json({
        success: true,
        user: {
          id: result.owner.id,
          email: result.owner.email,
          firstName: result.owner.first_name,
          lastName: result.owner.last_name,
          role: result.owner.role,
          emailVerified: result.owner.email_verified,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          subdomain: result.tenant.subdomain,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * Login user
 */
router.post(
  '/login',
  requireTenant,
  authRateLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const tenantSchema = req.tenantSchema!;

      // Find user
      const { rows } = await tenantDb.query(
        tenantSchema,
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (rows.length === 0) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const user = rows[0];

      // Check if user is active
      if (user.status !== 'active') {
        throw new UnauthorizedError('Account is not active');
      }

      // Verify password
      const isValidPassword = await AuthService.comparePassword(
        password,
        user.password_hash
      );

      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Update last login
      await tenantDb.query(
        tenantSchema,
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate tokens
      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: user.id,
        tenantId: req.tenantId!,
        email: user.email,
        role: user.role,
      });

      // Set cookies
      setAuthCookies(res, accessToken, refreshToken);

      logger.info({
        message: 'User logged in successfully',
        userId: user.id,
        tenantId: req.tenantId,
        email: user.email,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  requireTenant,
  validate(refreshTokenSchema),
  async (req, res, next) => {
    try {
      const tenantSchema = req.tenantSchema!;

      // Get refresh token from cookie or body
      const refreshToken = getRefreshTokenFromRequest(req);

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token required');
      }

      // Verify refresh token
      const payload = await AuthService.verifyRefreshToken(
        refreshToken,
        req.tenantId!
      );

      // Fetch user to ensure they still exist and are active
      const { rows } = await tenantDb.query(
        tenantSchema,
        'SELECT * FROM users WHERE id = $1',
        [payload.userId]
      );

      if (rows.length === 0) {
        throw new UnauthorizedError('User not found');
      }

      const user = rows[0];

      if (user.status !== 'active') {
        throw new UnauthorizedError('Account is not active');
      }

      // Generate new access token
      const accessToken = AuthService.generateAccessToken({
        userId: user.id,
        tenantId: req.tenantId!,
        email: user.email,
        role: user.role,
      });

      // Set new access token cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
        domain: process.env.COOKIE_DOMAIN,
        path: '/',
      });

      logger.debug({
        message: 'Access token refreshed',
        userId: user.id,
        tenantId: req.tenantId,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', requireTenant, requireAuth, async (req, res, next) => {
  try {
    const tenantSchema = req.tenantSchema!;

    // Get refresh token from cookie
    const refreshToken = getRefreshTokenFromRequest(req);

    // Blacklist refresh token if present
    if (refreshToken) {
      try {
        const payload = await AuthService.verifyRefreshToken(
          refreshToken,
          req.tenantId!
        );
        await AuthService.blacklistRefreshToken(payload.tokenId);
      } catch (error) {
        // Ignore errors when blacklisting
        logger.debug({
          message: 'Failed to blacklist refresh token during logout',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Clear cookies
    clearAuthCookies(res);

    logger.info({
      message: 'User logged out',
      userId: req.userId,
      tenantId: req.tenantId,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', requireTenant, requireAuth, async (req, res, next) => {
  try {
    const tenantSchema = req.tenantSchema!;

    const { rows } = await tenantDb.query(
      tenantSchema,
      `SELECT id, email, first_name, last_name, role, status, email_verified, 
              last_login_at, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.userId!]
    );

    if (rows.length === 0) {
      throw new NotFoundError('User');
    }

    const user = rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  requireTenant,
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const tenantSchema = req.tenantSchema!;

      // Find user
      const { rows } = await tenantDb.query(
        tenantSchema,
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      // Always return success to prevent email enumeration
      if (rows.length === 0) {
        logger.info({
          message: 'Password reset requested for non-existent email',
          tenantId: req.tenantId,
          email: email.toLowerCase(),
        });
        return res.json({ success: true });
      }

      const user = rows[0];

      // Generate password reset token
      const resetToken = await AuthService.generatePasswordResetToken(
        user.id,
        req.tenantId!
      );

      // In development, log the reset link
      if (process.env.NODE_ENV === 'development') {
        const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
        logger.info({
          message: 'Password reset link (development only)',
          resetLink,
          userId: user.id,
          tenantId: req.tenantId,
        });
      }

      // Send password reset email
      try {
        const { EmailService } = await import('../services/email.js');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        await EmailService.sendPasswordResetEmail(email, resetToken, frontendUrl);
      } catch (emailErr) {
        // Don't fail the request if email sending fails — still log the token in dev
        logger.warn({
          message: 'Failed to send password reset email (SMTP may not be configured)',
          error: emailErr instanceof Error ? emailErr.message : 'Unknown error',
        });
      }

      logger.info({
        message: 'Password reset email sent',
        userId: user.id,
        tenantId: req.tenantId,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  requireTenant,
  passwordResetLimiter,
  validate(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      const tenantSchema = req.tenantSchema!;

      // Verify reset token
      const tokenData = await AuthService.verifyPasswordResetToken(
        token,
        req.tenantId!
      );

      // Check if user exists and is active
      const { rows } = await tenantDb.query(
        tenantSchema,
        'SELECT * FROM users WHERE id = $1',
        [tokenData.userId]
      );

      if (rows.length === 0) {
        throw new NotFoundError('User');
      }

      const user = rows[0];

      if (user.status !== 'active') {
        throw new UnauthorizedError('Account is not active');
      }

      // Hash new password
      const passwordHash = await AuthService.hashPassword(newPassword);

      // Update password
      await tenantDb.query(
        tenantSchema,
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, user.id]
      );

      // Delete reset token
      await AuthService.deletePasswordResetToken(token);

      logger.info({
        message: 'Password reset successful',
        userId: user.id,
        tenantId: req.tenantId,
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
