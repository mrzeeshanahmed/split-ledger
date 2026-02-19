import crypto from 'crypto';
import { tenantDb, getTenantSchema } from '../db/tenantClient.js';
import logger from '../utils/logger.js';
import {
  ApiKey,
  CreateApiKeyInput,
  CreateApiKeyResult,
  KeyGenerationResult,
  ApiKeyVerificationResult,
  CreateApiKeyUsageInput,
  ApiKeyUsage,
  UpdateApiKeyInput,
  DetailedUsageStats,
  AggregatedUsageStats,
} from '../types/apiKey.js';

/**
 * API Key Service
 * Handles API key generation, verification, and usage tracking
 */
export class ApiKeyService {
  private static readonly KEY_PREFIX_LENGTH = 8;
  private static readonly KEY_RAW_LENGTH = 32; // 256 bits
  private static readonly LIVE_PREFIX = 'sk_live_';
  private static readonly TEST_PREFIX = 'sk_test_';

  /**
   * Generate a new API key
   * Returns the raw key, prefix (first 8 chars), and SHA-256 hash
   * The raw key should only be shown to user once
   */
  static generateKey(testMode = false): KeyGenerationResult {
    // Generate 32 random bytes (256 bits)
    const rawBytes = crypto.randomBytes(this.KEY_RAW_LENGTH);

    // Convert to hex string (64 hex chars)
    const rawHex = rawBytes.toString('hex');

    // Create the prefix
    const prefix = testMode ? this.TEST_PREFIX : this.LIVE_PREFIX;
    const rawKey = `${prefix}${rawHex}`;

    // Extract first 8 chars after prefix for database lookup
    const keyPrefix = rawHex.substring(0, this.KEY_PREFIX_LENGTH);

    // Compute SHA-256 hash of the full key
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    return {
      rawKey,
      keyPrefix,
      keyHash,
    };
  }

  /**
   * Create a new API key in the database
   * Stores only the key prefix and hash, never the raw key
   * Returns the raw key only once
   */
  static async createApiKey(
    input: CreateApiKeyInput,
    tenantId: string,
    createdBy: string
  ): Promise<CreateApiKeyResult> {
    const tenantSchema = getTenantSchema(tenantId);

    // Generate the key
    const { rawKey, keyPrefix, keyHash } = this.generateKey(false);

    // Set default values
    const scopes = input.scopes || ['read'];
    const rateLimitPerMinute = input.rateLimitPerMinute || 60;
    const rateLimitPerDay = input.rateLimitPerDay || 1000;
    const expiresAt = input.expiresAt || null;

    // Insert into database
    const result = await tenantDb.query<ApiKey>(
      tenantSchema,
      `INSERT INTO api_keys (name, key_prefix, key_hash, scopes, rate_limit_per_minute, rate_limit_per_day, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.name,
        keyPrefix,
        keyHash,
        scopes,
        rateLimitPerMinute,
        rateLimitPerDay,
        expiresAt,
        createdBy,
      ]
    );

    const apiKey = result.rows[0];

    logger.info({
      message: 'API key created',
      apiKeyId: apiKey.id,
      tenantId,
      createdBy,
      scopes,
    });

    return {
      apiKey,
      rawKey, // Return raw key only once
    };
  }

  /**
   * Verify an API key
   * Hashes the provided key and checks if it exists in the database
   * Also validates that the key is active and not expired
   */
  static async verifyApiKey(
    rawKey: string,
    tenantId: string
  ): Promise<ApiKeyVerificationResult | null> {
    const tenantSchema = getTenantSchema(tenantId);

    // Check if the key has the correct prefix
    const hasLivePrefix = rawKey.startsWith(this.LIVE_PREFIX);
    const hasTestPrefix = rawKey.startsWith(this.TEST_PREFIX);

    if (!hasLivePrefix && !hasTestPrefix) {
      logger.debug({
        message: 'Invalid API key format',
        tenantId,
      });
      return null;
    }

    // Extract the prefix (skip sk_live_ or sk_test_, then take 8 chars)
    const prefixStart = hasLivePrefix ? this.LIVE_PREFIX.length : this.TEST_PREFIX.length;
    const keyPrefix = rawKey.substring(prefixStart, prefixStart + this.KEY_PREFIX_LENGTH);

    // Compute hash of the full key
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // Query database for key with matching prefix
    const result = await tenantDb.query<ApiKey>(
      tenantSchema,
      `SELECT * FROM api_keys
       WHERE key_prefix = $1 AND is_active = true`,
      [keyPrefix]
    );

    if (result.rows.length === 0) {
      logger.debug({
        message: 'API key not found or inactive',
        keyPrefix,
        tenantId,
      });
      return null;
    }

    // Check hash (constant-time comparison to prevent timing attacks)
    const apiKey = result.rows[0];
    if (!crypto.timingSafeEqual(Buffer.from(keyHash, 'hex'), Buffer.from(apiKey.key_hash, 'hex'))) {
      logger.warn({
        message: 'API key hash mismatch (possible attack)',
        keyPrefix,
        tenantId,
      });
      return null;
    }

    // Check if expired
    if (apiKey.expires_at && new Date() > new Date(apiKey.expires_at)) {
      logger.debug({
        message: 'API key expired',
        apiKeyId: apiKey.id,
        tenantId,
      });
      return null;
    }

    // Check if revoked
    if (apiKey.revoked_at) {
      logger.debug({
        message: 'API key revoked',
        apiKeyId: apiKey.id,
        tenantId,
      });
      return null;
    }

    return {
      apiKey,
      tenantId,
    };
  }

  /**
   * Revoke an API key
   * Sets revoked_at timestamp and marks as inactive
   */
  static async revokeApiKey(apiKeyId: string, tenantId: string): Promise<ApiKey | null> {
    const tenantSchema = getTenantSchema(tenantId);

    const result = await tenantDb.query<ApiKey>(
      tenantSchema,
      `UPDATE api_keys
       SET is_active = false, revoked_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [apiKeyId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const apiKey = result.rows[0];

    logger.info({
      message: 'API key revoked',
      apiKeyId,
      tenantId,
    });

    return apiKey;
  }

  /**
   * Update last_used_at timestamp for an API key
   */
  static async updateLastUsed(apiKeyId: string, tenantId: string): Promise<void> {
    const tenantSchema = getTenantSchema(tenantId);

    await tenantDb.query(
      tenantSchema,
      `UPDATE api_keys
       SET last_used_at = NOW()
       WHERE id = $1`,
      [apiKeyId]
    );
  }

  /**
   * Get an API key by ID
   */
  static async getApiKeyById(apiKeyId: string, tenantId: string): Promise<ApiKey | null> {
    const tenantSchema = getTenantSchema(tenantId);

    const result = await tenantDb.query<ApiKey>(
      tenantSchema,
      `SELECT * FROM api_keys WHERE id = $1`,
      [apiKeyId]
    );

    return result.rows[0] || null;
  }

  /**
   * List all API keys for a tenant
   * Supports pagination via limit and offset
   */
  static async listApiKeys(tenantId: string, limit?: number, offset = 0): Promise<ApiKey[]> {
    const tenantSchema = getTenantSchema(tenantId);

    let query = `SELECT * FROM api_keys ORDER BY created_at DESC`;
    const params: any[] = [];

    if (limit !== undefined) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    if (offset > 0) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }

    const result = await tenantDb.query<ApiKey>(tenantSchema, query, params);

    return result.rows;
  }

  /**
   * Delete an API key permanently
   */
  static async deleteApiKey(apiKeyId: string, tenantId: string): Promise<boolean> {
    const tenantSchema = getTenantSchema(tenantId);

    const result = await tenantDb.query(
      tenantSchema,
      `DELETE FROM api_keys WHERE id = $1`,
      [apiKeyId]
    );

    const deleted = result.rowCount > 0;

    if (deleted) {
      logger.info({
        message: 'API key deleted',
        apiKeyId,
        tenantId,
      });
    }

    return deleted;
  }

  /**
   * Create a usage record for an API key
   */
  static async createUsageRecord(
    input: CreateApiKeyUsageInput,
    tenantId: string
  ): Promise<ApiKeyUsage> {
    const tenantSchema = getTenantSchema(tenantId);

    const result = await tenantDb.query<ApiKeyUsage>(
      tenantSchema,
      `INSERT INTO api_key_usage (api_key_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.api_key_id,
        input.endpoint,
        input.method,
        input.status_code,
        input.response_time_ms,
        input.ip_address,
        input.user_agent,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get usage records for an API key
   */
  static async getUsageRecords(
    apiKeyId: string,
    tenantId: string,
    limit = 100
  ): Promise<ApiKeyUsage[]> {
    const tenantSchema = getTenantSchema(tenantId);

    const result = await tenantDb.query<ApiKeyUsage>(
      tenantSchema,
      `SELECT * FROM api_key_usage
       WHERE api_key_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [apiKeyId, limit]
    );

    return result.rows;
  }

  /**
   * Get usage statistics for an API key
   */
  static async getUsageStats(
    apiKeyId: string,
    tenantId: string
  ): Promise<{
    total: number;
    successRate: number;
    avgResponseTime: number;
    last24Hours: number;
  }> {
    const tenantSchema = getTenantSchema(tenantId);

    const totalResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_key_usage WHERE api_key_id = $1`,
      [apiKeyId]
    );

    const successResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_key_usage
       WHERE api_key_id = $1 AND status_code >= 200 AND status_code < 300`,
      [apiKeyId]
    );

    const avgResponseResult = await tenantDb.query<{ avg: string }>(
      tenantSchema,
      `SELECT COALESCE(AVG(response_time_ms), 0) as avg FROM api_key_usage
       WHERE api_key_id = $1 AND response_time_ms IS NOT NULL`,
      [apiKeyId]
    );

    const last24HoursResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_key_usage
       WHERE api_key_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
      [apiKeyId]
    );

    const total = parseInt(totalResult.rows[0].count, 10);
    const successCount = parseInt(successResult.rows[0].count, 10);
    const avgResponseTime = parseFloat(avgResponseResult.rows[0].avg);
    const last24Hours = parseInt(last24HoursResult.rows[0].count, 10);

    return {
      total,
      successRate: total > 0 ? (successCount / total) * 100 : 0,
      avgResponseTime,
      last24Hours,
    };
  }

  /**
   * Get detailed usage statistics for an API key
   * Includes top endpoints and requests by day
   */
  static async getDetailedUsageStats(
    apiKeyId: string,
    tenantId: string
  ): Promise<DetailedUsageStats> {
    const tenantSchema = getTenantSchema(tenantId);

    const totalResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_key_usage WHERE api_key_id = $1`,
      [apiKeyId]
    );

    const successResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_key_usage
       WHERE api_key_id = $1 AND status_code >= 200 AND status_code < 300`,
      [apiKeyId]
    );

    const avgResponseResult = await tenantDb.query<{ avg: string }>(
      tenantSchema,
      `SELECT COALESCE(AVG(response_time_ms), 0) as avg FROM api_key_usage
       WHERE api_key_id = $1 AND response_time_ms IS NOT NULL`,
      [apiKeyId]
    );

    const last24HoursResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_key_usage
       WHERE api_key_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
      [apiKeyId]
    );

    const topEndpointsResult = await tenantDb.query<{
      endpoint: string;
      method: string;
      count: string;
    }>(
      tenantSchema,
      `SELECT endpoint, method, COUNT(*) as count
       FROM api_key_usage
       WHERE api_key_id = $1
       GROUP BY endpoint, method
       ORDER BY count DESC
       LIMIT 10`,
      [apiKeyId]
    );

    const requestsByDayResult = await tenantDb.query<{
      date: string;
      count: string;
    }>(
      tenantSchema,
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM api_key_usage
       WHERE api_key_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [apiKeyId]
    );

    const total = parseInt(totalResult.rows[0].count, 10);
    const successCount = parseInt(successResult.rows[0].count, 10);
    const avgResponseTime = parseFloat(avgResponseResult.rows[0].avg);
    const last24Hours = parseInt(last24HoursResult.rows[0].count, 10);

    return {
      totalRequests: total,
      successRate: total > 0 ? (successCount / total) * 100 : 0,
      avgResponseTime,
      last24Hours,
      topEndpoints: topEndpointsResult.rows.map((row) => ({
        endpoint: row.endpoint,
        method: row.method,
        count: parseInt(row.count, 10),
      })),
      requestsByDay: requestsByDayResult.rows.map((row) => ({
        date: row.date,
        count: parseInt(row.count, 10),
      })),
    };
  }

  /**
   * Get aggregated usage statistics across all API keys for a tenant
   */
  static async getAggregatedUsageStats(tenantId: string): Promise<AggregatedUsageStats> {
    const tenantSchema = getTenantSchema(tenantId);

    const totalKeysResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_keys`
    );

    const activeKeysResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_keys WHERE is_active = true AND revoked_at IS NULL`
    );

    const totalRequestsResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_key_usage`
    );

    const last24HoursResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_key_usage
       WHERE created_at >= NOW() - INTERVAL '24 hours'`
    );

    const avgResponseResult = await tenantDb.query<{ avg: string }>(
      tenantSchema,
      `SELECT COALESCE(AVG(response_time_ms), 0) as avg FROM api_key_usage
       WHERE response_time_ms IS NOT NULL`
    );

    const successResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM api_key_usage
       WHERE status_code >= 200 AND status_code < 300`
    );

    const topApiKeysResult = await tenantDb.query<{
      api_key_id: string;
      key_prefix: string;
      name: string;
      request_count: string;
      last_used_at: Date | null;
    }>(
      tenantSchema,
      `SELECT ak.id as api_key_id, ak.key_prefix, ak.name, ak.last_used_at, COUNT(aku.id) as request_count
       FROM api_keys ak
       LEFT JOIN api_key_usage aku ON ak.id = aku.api_key_id
       WHERE ak.is_active = true
       GROUP BY ak.id, ak.key_prefix, ak.name, ak.last_used_at
       ORDER BY request_count DESC
       LIMIT 10`
    );

    const totalKeys = parseInt(totalKeysResult.rows[0].count, 10);
    const totalRequests = parseInt(totalRequestsResult.rows[0].count, 10);
    const successCount = parseInt(successResult.rows[0].count, 10);

    return {
      totalApiKeys: totalKeys,
      activeApiKeys: parseInt(activeKeysResult.rows[0].count, 10),
      totalRequests,
      requestsLast24Hours: parseInt(last24HoursResult.rows[0].count, 10),
      avgResponseTime: parseFloat(avgResponseResult.rows[0].avg),
      globalSuccessRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      topApiKeys: topApiKeysResult.rows.map((row) => ({
        apiKeyId: row.api_key_id,
        keyPrefix: row.key_prefix,
        name: row.name,
        requestCount: parseInt(row.request_count, 10),
        lastUsedAt: row.last_used_at,
      })),
    };
  }

  /**
   * Update an API key (name and scopes only)
   */
  static async updateApiKey(
    apiKeyId: string,
    tenantId: string,
    updates: UpdateApiKeyInput
  ): Promise<ApiKey | null> {
    const tenantSchema = getTenantSchema(tenantId);

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updates.scopes !== undefined) {
      updateFields.push(`scopes = $${paramIndex++}`);
      values.push(updates.scopes);
    }

    if (updateFields.length === 0) {
      return await this.getApiKeyById(apiKeyId, tenantId);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(apiKeyId);

    const result = await tenantDb.query<ApiKey>(
      tenantSchema,
      `UPDATE api_keys
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    const apiKey = result.rows[0];

    logger.info({
      message: 'API key updated',
      apiKeyId,
      tenantId,
      updates,
    });

    return apiKey;
  }
}
