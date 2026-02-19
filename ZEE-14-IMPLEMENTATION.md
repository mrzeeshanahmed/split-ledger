# ZEE-14: API Key Management Routes & Usage Tracking - Implementation

## Overview
Implemented CRUD routes for API keys, enhanced usage tracking, and usage statistics endpoints to provide complete API key management capabilities.

## Files Modified

### 1. Type Definitions (`backend/src/types/apiKey.ts`)
Added new interfaces for API key management:

- `UpdateApiKeyInput`: Input for updating an API key (name and scopes only)
- `DetailedUsageStats`: Detailed usage statistics for a single API key
  - `totalRequests`: Total number of requests
  - `successRate`: Percentage of successful requests
  - `avgResponseTime`: Average response time in milliseconds
  - `last24Hours`: Number of requests in the last 24 hours
  - `topEndpoints`: Top 10 most used endpoints with method and count
  - `requestsByDay`: Daily request count for the last 30 days
- `AggregatedUsageStats`: Usage statistics across all API keys
  - `totalApiKeys`: Total number of API keys
  - `activeApiKeys`: Number of active (non-revoked) API keys
  - `totalRequests`: Total requests across all keys
  - `requestsLast24Hours`: Requests in the last 24 hours
  - `avgResponseTime`: Average response time across all requests
  - `globalSuccessRate`: Success rate across all requests
  - `topApiKeys`: Top 10 API keys by request count

### 2. Service Layer (`backend/src/services/apiKey.ts`)
Added new methods to ApiKeyService:

- `getDetailedUsageStats(apiKeyId, tenantId)`: Get comprehensive usage statistics for a specific API key
  - Returns total requests, success rate, average response time, last 24 hours count
  - Includes top 10 endpoints by usage
  - Includes daily request counts for the last 30 days
- `getAggregatedUsageStats(tenantId)`: Get tenant-wide usage statistics
  - Returns aggregate statistics across all API keys
  - Shows top 10 most used API keys
- `updateApiKey(apiKeyId, tenantId, updates)`: Update API key name and scopes
  - Only allows updating `name` and `scopes` fields
  - Updates `updated_at` timestamp
  - Returns the updated API key
- Enhanced `listApiKeys(tenantId, limit?, offset?)`: Added pagination support
  - Now accepts optional `limit` and `offset` parameters
  - Uses SQL LIMIT and OFFSET clauses for efficient pagination

### 3. Validation Schemas (`backend/src/validation/apiKey.validation.ts`)
Updated validation schemas:

- Modified `updateApiKeySchema`: Removed rate limit and expiry fields, only allows `name` and `scopes` updates
  - Added refinement to ensure at least one field is provided
- Added `getAggregatedUsageSchema`: Validation schema for aggregated usage endpoint

### 4. API Key Routes (`backend/src/routes/apiKeys.routes.ts`) - NEW FILE
Created comprehensive CRUD routes for API key management:

**Route Definitions:**

1. `POST /api/api-keys` - Create new API key
   - Requires: Authenticated user with `owner` or `admin` role
   - Body: `name`, `scopes`, `rateLimitPerMinute`, `rateLimitPerDay`, `expiresAt`
   - Returns: Created API key with raw key (shown only once)
   - Validation: `createApiKeySchema`

2. `GET /api/api-keys` - List all API keys
   - Requires: Authenticated user with `owner` or `admin` role
   - Query params: `limit` (1-1000, optional), `offset` (0+, optional)
   - Returns: Array of API keys (without key_hash or raw key)
   - Validation: `listApiKeysSchema`
   - Security: Never exposes `key_hash` or raw key

3. `GET /api/api-keys/:apiKeyId` - Get single API key
   - Requires: Authenticated user with `owner` or `admin` role
   - Returns: Single API key details (without key_hash or raw key)
   - Validation: `getApiKeySchema`

4. `PATCH /api/api-keys/:apiKeyId` - Update API key
   - Requires: Authenticated user with `owner` or `admin` role
   - Body: `name` (optional), `scopes` (optional)
   - Returns: Updated API key
   - Validation: `updateApiKeySchema`
   - Restrictions: Only allows updating name and scopes

5. `DELETE /api/api-keys/:apiKeyId` - Revoke API key
   - Requires: Authenticated user with `owner` or `admin` role
   - Action: Soft delete (sets `revoked_at` and `is_active = false`)
   - Returns: Revoked API key
   - Validation: `deleteApiKeySchema`

6. `GET /api/api-keys/:apiKeyId/usage` - Get detailed usage statistics
   - Requires: Authenticated user with `owner` or `admin` role
   - Returns: Detailed usage stats including top endpoints and daily breakdown
   - Validation: `getApiKeyStatsSchema`

7. `GET /api/api-keys/usage/summary` - Get aggregated usage statistics
   - Requires: Authenticated user with `owner` or `admin` role
   - Returns: Tenant-wide usage statistics and top API keys
   - Validation: `getAggregatedUsageSchema`
   - Note: Defined before `/:apiKeyId` route to avoid conflicts

**Helper Function:**
- `formatApiKeyForResponse(apiKey)`: Formats API key for API responses
  - Converts snake_case to camelCase
  - Never includes `key_hash` or raw key
  - Shows only 8-char `keyPrefix` for identification

**Security Considerations:**
- All routes require user authentication (not API key authentication)
- Only owners and admins can manage API keys
- Raw API key is returned only on creation (POST endpoint)
- List and detail endpoints never expose `key_hash` or raw key
- Only 8-char prefix shown for identification

### 5. Main Application (`backend/src/index.ts`)
Registered API key routes:

- Imported `apiKeysRoutes` from `./routes/apiKeys.routes.js`
- Mounted routes at `/api/api-keys` path
- Routes are automatically protected by tenant context middleware and rate limiting

### 6. Middleware (Already Existed)
The usage tracking middleware already exists and is properly exported:

- `apiKeyUsageTracker` from `apiKeyRateLimiter.ts`:
  - Records API usage to database after response is sent
  - Captures: endpoint, method, status code, response time, IP, user agent
  - Runs asynchronously (fire and forget) to avoid blocking responses
  - Should be applied to routes that use `requireApiKey` middleware

## API Endpoints Summary

### CRUD Operations

| Method | Path | Description | Auth | Required Role |
|--------|------|-------------|------|---------------|
| POST | /api/api-keys | Create new API key | User auth | owner, admin |
| GET | /api/api-keys | List all API keys | User auth | owner, admin |
| GET | /api/api-keys/:id | Get API key details | User auth | owner, admin |
| PATCH | /api/api-keys/:id | Update API key | User auth | owner, admin |
| DELETE | /api/api-keys/:id | Revoke API key | User auth | owner, admin |

### Usage Statistics

| Method | Path | Description | Auth | Required Role |
|--------|------|-------------|------|---------------|
| GET | /api/api-keys/:id/usage | Detailed usage for one key | User auth | owner, admin |
| GET | /api/api-keys/usage/summary | Aggregated usage across all keys | User auth | owner, admin |

## Response Formats

### Create API Key (POST /api/api-keys)
```json
{
  "apiKey": {
    "id": "uuid",
    "name": "Production Integration",
    "keyPrefix": "abc12345",
    "scopes": ["read", "write"],
    "rateLimitPerMinute": 100,
    "rateLimitPerDay": 10000,
    "lastUsedAt": null,
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "isActive": true,
    "createdBy": "uuid",
    "createdAt": "2024-02-19T12:00:00.000Z",
    "updatedAt": "2024-02-19T12:00:00.000Z",
    "revokedAt": null
  },
  "rawKey": "sk_live_abc12345..."
}
```

### List API Keys (GET /api/api-keys)
```json
{
  "apiKeys": [
    {
      "id": "uuid",
      "name": "Production Integration",
      "keyPrefix": "abc12345",
      "scopes": ["read", "write"],
      ...
    }
  ],
  "total": 5
}
```

### Detailed Usage Stats (GET /api/api-keys/:id/usage)
```json
{
  "apiKeyId": "uuid",
  "usage": {
    "totalRequests": 12345,
    "successRate": 99.5,
    "avgResponseTime": 125.5,
    "last24Hours": 234,
    "topEndpoints": [
      {
        "endpoint": "/api/transactions",
        "method": "GET",
        "count": 5678
      },
      ...
    ],
    "requestsByDay": [
      {
        "date": "2024-02-19",
        "count": 1234
      },
      ...
    ]
  }
}
```

### Aggregated Usage Stats (GET /api/api-keys/usage/summary)
```json
{
  "stats": {
    "totalApiKeys": 10,
    "activeApiKeys": 8,
    "totalRequests": 123456,
    "requestsLast24Hours": 2345,
    "avgResponseTime": 145.3,
    "globalSuccessRate": 98.7,
    "topApiKeys": [
      {
        "apiKeyId": "uuid",
        "keyPrefix": "abc12345",
        "name": "Production Integration",
        "requestCount": 45000,
        "lastUsedAt": "2024-02-19T11:30:00.000Z"
      },
      ...
    ]
  }
}
```

## Database Queries

### listApiKeys with Pagination
```sql
SELECT * FROM api_keys
ORDER BY created_at DESC
LIMIT $1 OFFSET $2
```

### getDetailedUsageStats - Top Endpoints
```sql
SELECT endpoint, method, COUNT(*) as count
FROM api_key_usage
WHERE api_key_id = $1
GROUP BY endpoint, method
ORDER BY count DESC
LIMIT 10
```

### getDetailedUsageStats - Requests by Day
```sql
SELECT DATE(created_at) as date, COUNT(*) as count
FROM api_key_usage
WHERE api_key_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC
```

### getAggregatedUsageStats - Top API Keys
```sql
SELECT ak.id as api_key_id, ak.key_prefix, ak.name, ak.last_used_at, COUNT(aku.id) as request_count
FROM api_keys ak
LEFT JOIN api_key_usage aku ON ak.id = aku.api_key_id
WHERE ak.is_active = true
GROUP BY ak.id, ak.key_prefix, ak.name, ak.last_used_at
ORDER BY request_count DESC
LIMIT 10
```

## Security Considerations

1. **Raw Key Exposure**: Raw API key is returned only once on creation, never again
2. **Hash Protection**: List and detail endpoints never expose `key_hash`
3. **Authorization**: All routes require user authentication (not API key auth)
4. **Role-Based Access**: Only `owner` and `admin` roles can manage API keys
5. **Tenant Isolation**: All queries use tenant-specific schema
6. **Scope Restriction**: Update endpoint only allows changing name and scopes, not rate limits or expiry

## Usage Logger Middleware

The `apiKeyUsageTracker` middleware (from `apiKeyRateLimiter.ts`) handles usage logging:

- Automatically records API usage when `req.apiKey` is present
- Logs: `api_key_id`, `endpoint`, `method`, `status_code`, `response_time_ms`, `ip_address`, `user_agent`
- Runs asynchronously after response using `res.on('finish')`
- Calculates response time from `res.locals.startTime`
- Catches and logs errors silently (fire and forget)

**Usage**: Apply `apiKeyUsageTracker` to routes that accept API key authentication:
```typescript
app.get('/api/data', requireApiKey, apiKeyUsageTracker, handler);
```

## Testing Recommendations

1. **CRUD Operations**:
   - Test creating API keys and verify raw key is returned only once
   - Test listing API keys with pagination
   - Test getting single API key details
   - Test updating API key name and scopes
   - Test revoking API keys

2. **Security**:
   - Verify raw key is never returned after creation
   - Verify non-owner/admin users cannot access API key endpoints
   - Test that revoked keys show correct status

3. **Usage Statistics**:
   - Test detailed usage stats accuracy
   - Test aggregated usage stats
   - Verify top endpoints are correctly ranked
   - Verify daily breakdown covers correct date range

4. **Edge Cases**:
   - Test pagination with offset and limit combinations
   - Test updating with only name or only scopes
   - Test updating with no changes
   - Test querying non-existent API keys

5. **Integration**:
   - Test usage tracking with `apiKeyUsageTracker` middleware
   - Verify usage records are created correctly
   - Test rate limit headers are set correctly

## Future Enhancements

- Add date range filtering for usage statistics
- Add usage export functionality (CSV, JSON)
- Add usage alerts and notifications
- Add API key activity heatmap visualization
- Add cost tracking per API key
- Add webhooks for usage events
- Add granular permissions (view-only vs manage)
- Add API key groups/team assignment
- Add automated cleanup of inactive keys
- Add usage anomaly detection

## Compliance

- Follows ADR-004: API Key Security guidelines
- Uses tenant isolation for multi-tenancy
- Implements audit logging for all management operations
- Supports principle of least privilege via role-based access
