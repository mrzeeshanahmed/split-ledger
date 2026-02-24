# ZEE-13: API Key System - Implementation

## Overview
Implemented a comprehensive API key system with secure key generation, SHA-256 hashing, scope-based access control, and per-key rate limiting using Redis sliding window algorithm.

## Files Created

### 1. Database Migrations

#### `backend/migrations/004_create_api_keys.sql`
- Created `api_keys` table in `tenant_template` schema (following ADR-001)
- Fields: id, name, key_prefix, key_hash, scopes, rate_limit_per_minute, rate_limit_per_day, last_used_at, expires_at, is_active, created_by, created_at, updated_at, revoked_at
- Indexes: key_prefix, key_hash, is_active, created_by, expires_at
- Constraints: unique name, unique key_prefix, scopes not empty, rate limits positive, foreign key to users
- Auto-updates updated_at timestamp via trigger

#### `backend/migrations/005_create_api_key_usage.sql`
- Created `api_key_usage` table in `tenant_template` schema
- Fields: id, api_key_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent, created_at
- Indexes: api_key_id, created_at, endpoint, status_code, composite (api_key_id, created_at)
- Constraints: valid methods (GET, POST, etc.), valid status codes, positive response time
- Cascading delete when API key is deleted

### 2. Type Definitions

#### `backend/src/types/apiKey.ts`
- `ApiKeyScope`: 'read' | 'write' | 'admin'
- `ApiKey`: Interface for API key record
- `CreateApiKeyInput`: Input for creating API keys
- `CreateApiKeyResult`: Result including raw key (shown once)
- `ApiKeyVerificationResult`: Result of key verification
- `ApiKeyUsage`: Usage record interface
- `CreateApiKeyUsageInput`: Input for creating usage records
- `KeyGenerationResult`: Result from key generation
- `ApiKeyRateLimitStatus`: Rate limit status

### 3. Service Layer

#### `backend/src/services/apiKey.ts`
- `ApiKeyService` class with static methods:

  **Key Management:**
  - `generateKey(testMode?)`: Generate secure API key with crypto.randomBytes(32)
    - Returns rawKey, keyPrefix (8 chars), keyHash (SHA-256)
    - Format: `sk_live_<64 hex chars>` or `sk_test_<64 hex chars>`

  - `createApiKey(input, tenantId, createdBy)`: Store API key in database
    - Stores only keyPrefix and keyHash (never raw key)
    - Returns rawKey only once
    - Validates scopes, rate limits, expiry

  - `verifyApiKey(rawKey, tenantId)`: Verify and validate API key
    - Validates prefix format
    - Hashes key and checks database
    - Uses constant-time comparison (timing-safe)
    - Validates: active, not expired, not revoked

  - `revokeApiKey(apiKeyId, tenantId)`: Revoke an API key
    - Sets revoked_at and is_active=false
    - Soft delete approach

  - `updateLastUsed(apiKeyId, tenantId)`: Update last_used_at timestamp
    - Called asynchronously on each authentication

  - `getApiKeyById(apiKeyId, tenantId)`: Get single API key

  - `listApiKeys(tenantId)`: List all API keys for tenant

  - `deleteApiKey(apiKeyId, tenantId)`: Permanently delete API key
    - Hard delete

  **Usage Tracking:**
  - `createUsageRecord(input, tenantId)`: Record API usage
  - `getUsageRecords(apiKeyId, tenantId, limit?)`: Get usage records
  - `getUsageStats(apiKeyId, tenantId)`: Get usage statistics
    - total requests
    - success rate
    - average response time
    - last 24 hours count

### 4. Redis Extensions

#### `backend/src/db/redis.ts` (modified)
Added sliding window rate limiting functions:

- `slidingWindowIncrement(key, windowSeconds)`: Increment counter with sliding window
  - Uses Lua script for atomicity
  - Removes expired entries outside window
  - Returns current count
  - Caches script SHA for performance

- `getSlidingWindowCount(key)`: Get current count within window

- `checkRateLimit(key, windowSeconds, limit)`: Check if limit exceeded
  - Returns: { exceeded, count, resetAt }

**Lua Script:**
- Uses Redis sorted sets (ZSET)
- Scores are timestamps
- Removes entries outside window (ZREMRANGEBYSCORE)
- Adds current request (ZADD)
- Sets expiry (EXPIRE)
- Returns count (ZCARD)

### 5. Middleware

#### `backend/src/middleware/apiKeyAuth.ts`
- `requireApiKey`: Authenticate request with API key
  - Extracts key from `Authorization: Bearer sk_...` header
  - Validates format (sk_live_ or sk_test_)
  - Verifies key via ApiKeyService
  - Attaches apiKey info to request
  - Updates last_used_at asynchronously
  - Throws UnauthorizedError if invalid

- `requireScope(...scopes)`: Factory for scope checking middleware
  - Checks if API key has required scope(s)
  - Supports multiple scopes (OR logic)
  - Throws ForbiddenError if insufficient

- `optionalApiKeyAuth`: Optional API key authentication
  - Attempts to authenticate but doesn't fail if no key
  - Useful for mixed auth endpoints

- `getApiKeyRateLimitStatus(req)`: Get rate limit status for headers

**Extended Express.Request:**
```typescript
req.apiKey?: {
  id: string;
  scopes: ApiKeyScope[];
  tenantId: string;
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
}
```

#### `backend/src/middleware/apiKeyRateLimiter.ts`
- `apiKeyRateLimiter`: Per-key rate limiting middleware
  - Uses sliding window algorithm via Redis
  - Checks per-minute and per-day limits
  - Sets response headers:
    - `X-RateLimit-Limit-Minute` / `-Day`
    - `X-RateLimit-Remaining-Minute` / `-Day`
    - `X-RateLimit-Reset-Minute` / `-Day`
    - `X-RateLimit-Limit` / `-Remaining` / `-Reset` (standard)
  - Sets `Retry-After` header on 429
  - Fails open if Redis is unavailable (logs error, allows request)
  - Throws TooManyRequestsError if exceeded

- `apiKeyUsageTracker`: Track API usage in database
  - Records request details to api_key_usage table
  - Captures: endpoint, method, status_code, response_time_ms, ip_address, user_agent
  - Runs asynchronously after response (fire and forget)
  - Uses res.locals.startTime to measure response time

### 6. Validation

#### `backend/src/validation/apiKey.validation.ts`
Zod schemas for API key endpoints:

- `createApiKeySchema`: Create API key validation
  - name (required, 1-100 chars)
  - scopes (array, at least one, enum: read/write/admin)
  - rateLimitPerMinute (1-10000)
  - rateLimitPerDay (1-1000000)
  - expiresAt (datetime, optional)

- `revokeApiKeySchema`: Revoke API key
  - apiKeyId (UUID in params)

- `getApiKeySchema`: Get API key
  - apiKeyId (UUID in params)

- `deleteApiKeySchema`: Delete API key
  - apiKeyId (UUID in params)

- `listApiKeysSchema`: List API keys
  - limit (1-1000)
  - offset (0+)

- `getApiKeyUsageSchema`: Get usage records
  - apiKeyId (UUID in params)
  - limit (1-1000)

- `getApiKeyStatsSchema`: Get usage statistics
  - apiKeyId (UUID in params)

- `updateApiKeySchema`: Update API key (for future use)
  - name, scopes, rateLimits, expiresAt (all optional)

### 7. Modified Files

#### `backend/src/types/express.d.ts`
- Added `apiKey` property to Express.Request interface
- Imported `ApiKeyScope` type

#### `backend/src/middleware/index.ts`
- Exported new middleware:
  - `requireApiKey`, `requireScope`, `optionalApiKeyAuth`, `getApiKeyRateLimitStatus`
  - `apiKeyRateLimiter`, `apiKeyUsageTracker`

#### `docs/architecture-decisions.md`
- Added ADR-004: API Key Security
- Documents key generation, storage, scopes, rate limiting, usage tracking, lifecycle
- Covers authentication flow, consequences, security considerations, monitoring

## Key Features

### Security
- **Key Generation**: 256-bit entropy using crypto.randomBytes(32)
- **Storage**: Only SHA-256 hash and 8-char prefix stored
- **Comparison**: Timing-safe hash comparison prevents timing attacks
- **Exposure**: Raw key shown only once at creation time
- **Format**: Similar to Stripe (sk_live_...) for developer familiarity

### Rate Limiting
- **Algorithm**: Sliding window (smoother than fixed window)
- **Limits**: Per-minute (default: 60) and per-day (default: 1000)
- **Isolation**: Per-key, not per-tenant or per-user
- **Headers**: Standard rate limit headers in responses
- **Failure Mode**: Fails open (allows requests if Redis down, logs error)

### Scope System
- Three scopes: `read`, `write`, `admin`
- Middleware factory for flexible permission checking
- At least one scope required per key
- Stored as TEXT[] in PostgreSQL

### Usage Tracking
- All API key requests logged to database
- Tracks: endpoint, method, status, response time, IP, user agent
- Enables analytics and abuse detection
- Records in tenant schema for isolation

### Key Lifecycle
- Creation: Raw key returned once, hash stored
- Active: Normal state, can authenticate
- Expired: expires_at timestamp, automatically rejected
- Revoked: revoked_at timestamp, soft delete (is_active=false)
- Deleted: Hard delete, usage records cascade deleted

### Tenant Isolation
- API keys stored in tenant schema (tenant_template.api_keys)
- Follows ADR-001: Schema-per-tenant approach
- Each tenant has isolated API keys and usage
- New tenants get tables automatically from tenant_template

## Usage Examples

### Creating an API Key
```typescript
import { ApiKeyService } from './services/apiKey.js';

const result = await ApiKeyService.createApiKey(
  {
    name: 'Production Integration',
    scopes: ['read', 'write'],
    rateLimitPerMinute: 100,
    rateLimitPerDay: 10000,
  },
  tenantId,
  userId
);

// result.rawKey is shown only once!
console.log('API Key:', result.rawKey); // sk_live_abc123...
```

### Using API Key Middleware
```typescript
import { requireApiKey, requireScope, apiKeyRateLimiter } from './middleware/index.js';

// Require API key authentication
app.post('/api/data', requireApiKey, apiKeyRateLimiter, (req, res) => {
  // req.apiKey is available here
  console.log('API Key ID:', req.apiKey.id);
  console.log('Scopes:', req.apiKey.scopes);
});

// Require specific scope
app.delete('/api/data/:id', requireApiKey, requireScope('write', 'admin'), (req, res) => {
  // Only API keys with 'write' or 'admin' scope can access
});
```

### Client Usage
```bash
# Include API key in Authorization header
curl -H "Authorization: Bearer sk_live_abc123def456..." \
  https://api.example.com/api/data
```

### Response Headers (Rate Limiting)
```
HTTP/1.1 200 OK
X-RateLimit-Limit-Minute: 60
X-RateLimit-Remaining-Minute: 59
X-RateLimit-Reset-Minute: 1739965200000
X-RateLimit-Limit-Day: 1000
X-RateLimit-Remaining-Day: 999
X-RateLimit-Reset-Day: 1740048000000
```

## Migration Notes

### Existing Tenants
Since migrations 004 and 005 add tables to `tenant_template`:
- New tenants automatically get api_keys and api_key_usage tables
- Existing tenants need the tables added to their schemas

### Recommended Migration for Existing Tenants
```sql
-- For each existing tenant schema (e.g., tenant_550e8400e29b41d4a716446655440000)
-- Run the UP sections of migrations 004 and 005:

CREATE TABLE IF NOT EXISTS tenant_<uuid-no-dashes>.api_keys (
  -- ... same schema as tenant_template.api_keys
);

CREATE TABLE IF NOT EXISTS tenant_<uuid-no-dashes>.api_key_usage (
  -- ... same schema as tenant_template.api_key_usage
);
```

## Testing Recommendations

1. **Key Generation**: Verify keys have correct format and entropy
2. **Hash Verification**: Test timing-safe comparison
3. **Expired/Revoked Keys**: Ensure they are rejected
4. **Rate Limiting**: Test sliding window accuracy
5. **Scope Validation**: Test requireScope middleware
6. **Usage Tracking**: Verify records are created
7. **Redis Failure**: Test fail-open behavior
8. **Tenant Isolation**: Verify keys don't cross tenant boundaries

## Security Considerations

- Never log raw API keys
- Use HTTPS in production (never send keys over HTTP)
- Implement key rotation strategy for production
- Monitor rate limit violations for abuse detection
- Consider adding IP whitelisting per key
- Regularly audit unused or inactive keys
- Implement key expiration notifications

## Future Enhancements

- IP restriction per API key
- Key expiration notifications (email/webhook)
- Key rotation mechanism
- Webhook on key revocation
- Automated key renewal for expired keys
- Usage analytics dashboard
- Key metadata (description, tags, etc.)
- Key groups/team assignment
- Temporary/test keys with auto-expiration
- Key activity audit log

## Compliance

- Follows OWASP API Security best practices
- Implements defense in depth (hash + prefix + timing-safe comparison)
- Enables auditability via usage tracking
- Supports principle of least privilege via scopes
