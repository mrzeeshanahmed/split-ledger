/**
 * API Key Types
 *
 * Type definitions for the API key management system.
 */

/**
 * Available API key scopes
 */
export type ApiKeyScope = 'read' | 'write' | 'admin';

/**
 * API Key model
 */
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  [key: string]: unknown;
}

/**
 * API key with full raw key (shown only once at creation)
 */
export interface ApiKeyWithRawKey {
  apiKey: ApiKey;
  rawKey: string;
}

/**
 * Input for creating an API key
 */
export interface CreateApiKeyInput {
  name: string;
  scopes: ApiKeyScope[];
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
  expiresAt?: string;
}

/**
 * API key usage record
 */
export interface ApiKeyUsage {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

/**
 * Top endpoint by request count
 */
export interface TopEndpoint {
  endpoint: string;
  method: string;
  count: number;
  [key: string]: unknown;
}

/**
 * Requests per day
 */
export interface RequestsByDay {
  date: string;
  count: number;
}

/**
 * Detailed usage statistics for a single API key
 */
export interface DetailedUsageStats {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  last24Hours: number;
  topEndpoints: TopEndpoint[];
  requestsByDay: RequestsByDay[];
}

/**
 * Top API key by usage
 */
export interface TopApiKey {
  apiKeyId: string;
  keyPrefix: string;
  name: string;
  requestCount: number;
  lastUsedAt: string | null;
}

/**
 * Aggregated usage statistics across all API keys
 */
export interface AggregatedUsageStats {
  totalApiKeys: number;
  activeApiKeys: number;
  totalRequests: number;
  requestsLast24Hours: number;
  avgResponseTime: number;
  globalSuccessRate: number;
  topApiKeys: TopApiKey[];
}

/**
 * API key list response
 */
export interface ListApiKeysResponse {
  apiKeys: ApiKey[];
  total: number;
}

/**
 * API key usage response
 */
export interface GetApiKeyUsageResponse {
  apiKeyId: string;
  usage: DetailedUsageStats;
}

/**
 * Aggregated stats response
 */
export interface GetAggregatedStatsResponse {
  stats: AggregatedUsageStats;
}
