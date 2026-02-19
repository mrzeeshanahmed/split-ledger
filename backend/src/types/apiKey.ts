/**
 * Available API key scopes
 */
export type ApiKeyScope = 'read' | 'write' | 'admin';

/**
 * API Key interface
 */
export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: ApiKeyScope[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  last_used_at: Date | null;
  expires_at: Date | null;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  revoked_at: Date | null;
}

/**
 * Input for creating an API key
 */
export interface CreateApiKeyInput {
  name: string;
  scopes?: ApiKeyScope[];
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
  expiresAt?: Date;
}

/**
 * Result of creating an API key - includes the raw key (returned only once)
 */
export interface CreateApiKeyResult {
  apiKey: ApiKey;
  rawKey: string;
}

/**
 * Result of verifying an API key
 */
export interface ApiKeyVerificationResult {
  apiKey: ApiKey;
  tenantId: string;
}

/**
 * API key usage record
 */
export interface ApiKeyUsage {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

/**
 * Input for creating API key usage record
 */
export interface CreateApiKeyUsageInput {
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Key generation result
 */
export interface KeyGenerationResult {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
}

/**
 * API key rate limit status
 */
export interface ApiKeyRateLimitStatus {
  remainingMinute: number;
  limitMinute: number;
  resetMinute: number;
  remainingDay: number;
  limitDay: number;
  resetDay: number;
}

/**
 * Input for updating an API key
 */
export interface UpdateApiKeyInput {
  name?: string;
  scopes?: ApiKeyScope[];
}

/**
 * Detailed usage statistics for a single API key
 */
export interface DetailedUsageStats {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  last24Hours: number;
  topEndpoints: Array<{
    endpoint: string;
    method: string;
    count: number;
  }>;
  requestsByDay: Array<{
    date: string;
    count: number;
  }>;
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
  topApiKeys: Array<{
    apiKeyId: string;
    keyPrefix: string;
    name: string;
    requestCount: number;
    lastUsedAt: Date | null;
  }>;
}
