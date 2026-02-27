import { Router } from 'express';
import { ApiKeyService } from '../services/apiKey.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { NotFoundError } from '../errors/index.js';
import logger from '../utils/logger.js';
import {
  createApiKeySchema,
  getApiKeySchema,
  listApiKeysSchema,
  updateApiKeySchema,
  deleteApiKeySchema,
  revokeApiKeySchema,
  getApiKeyUsageSchema,
  getApiKeyStatsSchema,
  getAggregatedUsageSchema,
} from '../validation/apiKey.validation.js';

const router = Router({ mergeParams: true });

/**
 * Helper function to format API key for API response
 * Never exposes key_hash or raw key
 */
function formatApiKeyForResponse(apiKey: any) {
  return {
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.key_prefix,
    scopes: apiKey.scopes,
    rateLimitPerMinute: apiKey.rate_limit_per_minute,
    rateLimitPerDay: apiKey.rate_limit_per_day,
    lastUsedAt: apiKey.last_used_at,
    expiresAt: apiKey.expires_at,
    isActive: apiKey.is_active,
    createdBy: apiKey.created_by,
    createdAt: apiKey.created_at,
    updatedAt: apiKey.updated_at,
    revokedAt: apiKey.revoked_at,
  };
}

/**
 * POST /api-keys
 * Create a new API key
 * Only accessible to owners and admins
 */
router.post(
  '/',
  validate(createApiKeySchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { name, scopes, rateLimitPerMinute, rateLimitPerDay, expiresAt } = req.body;
      const tenantId = req.tenantId!;
      const createdBy = req.user!.id;

      // Parse expiresAt if provided
      const parsedExpiresAt = expiresAt ? new Date(expiresAt) : undefined;

      const result = await ApiKeyService.createApiKey(
        {
          name,
          scopes,
          rateLimitPerMinute,
          rateLimitPerDay,
          expiresAt: parsedExpiresAt,
        },
        tenantId,
        createdBy
      );

      logger.info({
        message: 'API key created via API',
        apiKeyId: result.apiKey.id,
        tenantId,
        createdBy,
      });

      // Return the API key with the raw key (shown only once)
      res.status(201).json({
        apiKey: formatApiKeyForResponse(result.apiKey),
        rawKey: result.rawKey,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api-keys
 * List all API keys for the tenant
 * Never exposes key_hash or raw key
 */
router.get(
  '/',
  validate(listApiKeysSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const apiKeys = await ApiKeyService.listApiKeys(tenantId, limit, offset);

      res.json({
        apiKeys: apiKeys.map(formatApiKeyForResponse),
        total: apiKeys.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api-keys/usage/summary
 * Get aggregated usage statistics across all API keys
 * This route must be defined before /:apiKeyId to avoid route conflicts
 */
router.get(
  '/usage/summary',
  validate(getAggregatedUsageSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantId!;

      const aggregatedStats = await ApiKeyService.getAggregatedUsageStats(tenantId);

      res.json({
        stats: aggregatedStats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api-keys/:apiKeyId
 * Get a single API key by ID
 */
router.get(
  '/:apiKeyId',
  validate(getApiKeySchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { apiKeyId } = req.params;
      const tenantId = req.tenantId!;

      const apiKey = await ApiKeyService.getApiKeyById(apiKeyId, tenantId);

      if (!apiKey) {
        throw new NotFoundError('API key');
      }

      res.json({
        apiKey: formatApiKeyForResponse(apiKey),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api-keys/:apiKeyId
 * Update an API key (name and scopes only)
 */
router.patch(
  '/:apiKeyId',
  validate(updateApiKeySchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { apiKeyId } = req.params;
      const tenantId = req.tenantId!;
      const { name, scopes } = req.body;

      const updatedApiKey = await ApiKeyService.updateApiKey(
        apiKeyId,
        tenantId,
        { name, scopes }
      );

      if (!updatedApiKey) {
        throw new NotFoundError('API key');
      }

      logger.info({
        message: 'API key updated via API',
        apiKeyId,
        tenantId,
        updatedBy: req.user!.id,
      });

      res.json({
        apiKey: formatApiKeyForResponse(updatedApiKey),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api-keys/:apiKeyId
 * Revoke an API key (soft delete)
 */
router.delete(
  '/:apiKeyId',
  validate(deleteApiKeySchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { apiKeyId } = req.params;
      const tenantId = req.tenantId!;

      const revokedApiKey = await ApiKeyService.revokeApiKey(apiKeyId, tenantId);

      if (!revokedApiKey) {
        throw new NotFoundError('API key');
      }

      logger.info({
        message: 'API key revoked via API',
        apiKeyId,
        tenantId,
        revokedBy: req.user!.id,
      });

      res.json({
        apiKey: formatApiKeyForResponse(revokedApiKey),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api-keys/:apiKeyId/usage
 * Get detailed usage statistics for a specific API key
 */
router.get(
  '/:apiKeyId/usage',
  validate(getApiKeyStatsSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { apiKeyId } = req.params;
      const tenantId = req.tenantId!;

      // First verify the API key exists
      const apiKey = await ApiKeyService.getApiKeyById(apiKeyId, tenantId);
      if (!apiKey) {
        throw new NotFoundError('API key');
      }

      const usageStats = await ApiKeyService.getDetailedUsageStats(apiKeyId, tenantId);

      res.json({
        apiKeyId,
        usage: usageStats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
