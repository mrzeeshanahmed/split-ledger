import api, { getErrorMessage } from '@/lib/axios';
import type {
  ApiKey,
  ApiKeyWithRawKey,
  CreateApiKeyInput,
  ListApiKeysResponse,
  GetApiKeyUsageResponse,
  GetAggregatedStatsResponse,
  DetailedUsageStats,
} from '@/types/apiKeys';

export { getErrorMessage };

/**
 * List all API keys for the current tenant
 */
export async function listApiKeys(limit?: number, offset?: number): Promise<ListApiKeysResponse> {
  const params = new URLSearchParams();
  if (limit !== undefined) params.append('limit', limit.toString());
  if (offset !== undefined) params.append('offset', offset.toString());

  const queryString = params.toString();
  const url = `/api-keys${queryString ? `?${queryString}` : ''}`;

  const response = await api.get<ListApiKeysResponse>(url);
  return response.data;
}

/**
 * Create a new API key
 * Returns the API key with the raw key (shown only once)
 */
export async function createApiKey(data: CreateApiKeyInput): Promise<ApiKeyWithRawKey> {
  const response = await api.post<ApiKeyWithRawKey>('/api-keys', {
    name: data.name,
    scopes: data.scopes,
    rateLimitPerMinute: data.rateLimitPerMinute,
    rateLimitPerDay: data.rateLimitPerDay,
    expiresAt: data.expiresAt,
  });
  return response.data;
}

/**
 * Get a single API key by ID
 */
export async function getApiKey(apiKeyId: string): Promise<ApiKey> {
  const response = await api.get<{ apiKey: ApiKey }>(`/api-keys/${apiKeyId}`);
  return response.data.apiKey;
}

/**
 * Revoke an API key (soft delete)
 */
export async function revokeApiKey(apiKeyId: string): Promise<ApiKey> {
  const response = await api.delete<{ apiKey: ApiKey }>(`/api-keys/${apiKeyId}`);
  return response.data.apiKey;
}

/**
 * Get detailed usage statistics for a specific API key
 */
export async function getApiKeyUsage(apiKeyId: string): Promise<DetailedUsageStats> {
  const response = await api.get<GetApiKeyUsageResponse>(`/api-keys/${apiKeyId}/usage`);
  return response.data.usage;
}

/**
 * Get aggregated usage statistics across all API keys
 */
export async function getAggregatedUsageStats(): Promise<GetAggregatedStatsResponse> {
  const response = await api.get<GetAggregatedStatsResponse>('/api-keys/usage/summary');
  return response.data;
}
