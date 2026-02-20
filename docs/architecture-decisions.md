# Architecture Decision Records

## ADR-001: Multi-Tenancy Schema-per-Tenant

### Status
Accepted

### Context
Split-Ledger needs to support multiple organizations/tenants with data isolation requirements.

### Decision
We will use a schema-per-tenant approach where each tenant gets their own PostgreSQL schema within the same database.

### Consequences
- Strong data isolation between tenants
- Shared connection pool, efficient resource usage
- Schema migrations need to be applied to all tenant schemas
- Backup/restore can be done per-tenant

---

## ADR-002: Payment Abstraction IPaymentProvider

### Status
Accepted

### Context
The application needs to process payments through Stripe, but may need to support other providers in the future.

### Decision
Create an `IPaymentProvider` interface that abstracts payment operations. Stripe will be the initial implementation.

### Consequences
- Easy to add new payment providers
- Consistent API across payment operations
- Slight overhead for abstraction layer
- Test payments can use mock provider

---

## ADR-003: Authentication Strategy

### Status
Accepted

### Context
The application needs secure user authentication with support for:
- Multi-tenant isolation
- Token-based stateless authentication
- Secure password storage
- Password reset functionality
- Protection against common attacks (XSS, CSRF, brute force)

### Decision

We will implement JWT-based authentication with the following specifications:

**Token Strategy:**
- **Access tokens**: JWT with 15-minute expiry, stored in httpOnly cookies
- **Refresh tokens**: JWT with 7-day expiry, stored in httpOnly cookies with path restriction
- Both tokens include `userId`, `tenantId`, `email`, and `role` in the payload
- Refresh tokens include a unique `tokenId` for blacklisting

**Password Security:**
- Passwords hashed using bcrypt with 12 rounds
- Password reset tokens with 1-hour expiry stored in Redis
- Email enumeration prevented (forgot-password always returns success)

**Security Measures:**
- httpOnly cookies for all tokens (prevents XSS)
- SameSite=Strict for CSRF protection
- Secure flag for cookies in production
- Token blacklisting via Redis for logout/password reset
- Rate limiting on all auth endpoints (10 per 15 minutes, 3 per hour for password reset)
- Tenant isolation enforced in token validation

**Authentication Flow:**
1. User registers or logs in → tokens set in httpOnly cookies
2. Client sends requests with cookies automatically
3. Server validates access token, checks tenant match
4. When access token expires, client calls `/api/auth/refresh` with refresh token cookie
5. On logout, refresh token is blacklisted and cookies cleared

### Consequences

**Positive:**
- Stateless authentication reduces database load
- httpOnly cookies prevent XSS token theft
- Short-lived access tokens limit exposure if compromised
- Rate limiting prevents brute force attacks
- Multi-tenant isolation enforced at the token level
- No sensitive data in localStorage (security best practice)

**Negative:**
- Requires Redis for rate limiting and token blacklisting
- Token rotation needed for proper logout
- More complex than traditional session-based auth
- CSRF protection relies on SameSite cookie attribute

**Considerations:**
- In production, email delivery service needed for password reset
- Token rotation strategy for concurrent sessions may be needed
- Consider implementing device tracking for enhanced security

---

## ADR-004: API Key Security

### Status
Accepted

### Context
The application needs to provide a secure API key system for third-party integrations and programmatic access. API keys must be:
- Securely generated and stored
- Never exposed after creation
- Support rate limiting per key
- Support scope-based access control
- Enable usage tracking and analytics

### Decision

We will implement a secure API key system with the following specifications:

**Key Generation:**
- Keys are generated using `crypto.randomBytes(32)` (256 bits of entropy)
- Key format: `sk_live_<64 hex chars>` for production, `sk_test_<64 hex chars>` for testing
- Only the SHA-256 hash and 8-character prefix are stored in the database
- The raw key is returned to the user ONLY once during creation
- Keys include a check digit (prefix) for fast database lookup

**Storage Security:**
- SHA-256 hash of the full key is stored in the database
- 8-character prefix is stored for indexing and quick lookups
- Raw key is NEVER stored permanently
- Hash verification uses `crypto.timingSafeEqual()` to prevent timing attacks

**Scope System:**
- Three scopes available: `read`, `write`, `admin`
- Keys must have at least one scope
- Middleware factory `requireScope('read', 'write')` for checking permissions
- Scopes are stored as TEXT[] array in PostgreSQL

**Rate Limiting:**
- Per-key rate limiting using Redis sliding window algorithm
- Two limits enforced per key:
  - Per-minute limit (default: 60 requests)
  - Per-day limit (default: 1000 requests)
- Sliding window provides smoother limits vs fixed window
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Fails open if Redis is unavailable (logs error, allows request)

**Usage Tracking:**
- All API key requests are logged to `api_key_usage` table
- Tracked fields: endpoint, method, status_code, response_time_ms, ip_address, user_agent
- Enables analytics and usage monitoring per key
- Records are stored in tenant schema for isolation

**Key Lifecycle:**
- Keys can be set to expire (`expires_at` timestamp)
- Keys can be revoked (`revoked_at` timestamp, sets `is_active = false`)
- Soft delete via revoke, hard delete available for permanent removal
- `last_used_at` updated on each successful authentication

**Authentication Flow:**
1. Client sends `Authorization: Bearer sk_live_...` header
2. Middleware extracts key and validates prefix format
3. Key is hashed and looked up in tenant's `api_keys` table
4. Validation checks: active, not expired, not revoked
5. Key info attached to `req.apiKey` with scopes and rate limits
6. Rate limiter checks per-minute and per-day limits
7. Usage record created asynchronously

### Consequences

**Positive:**
- Strong security: only hash stored, raw key shown once
- Timing-safe comparison prevents timing attacks
- Sliding window rate limiting provides smooth limits
- Per-key isolation ensures one key doesn't affect others
- Comprehensive usage tracking for analytics
- Scope-based access control follows principle of least privilege
- Tenant isolation via schema-per-tenant approach

**Negative:**
- Requires Redis for rate limiting
- More complex than simple token-based auth
- Usage table can grow large (needs cleanup strategy)
- Users must save their API keys securely (can't be retrieved)

**Security Considerations:**
- Keys are similar to Stripe's format (familiar to developers)
- Prefix (`sk_live_`) makes keys easily identifiable
- Never log raw API keys
- Hash lookup with prefix prevents full table scans
- Constant-time hash comparison prevents timing attacks

**Monitoring & Operations:**
- Monitor rate limit violations to detect abuse
- Analyze usage patterns for capacity planning
- Consider implementing key rotation mechanism
- Usage records may need periodic archival/deletion
- Consider adding IP whitelisting for enhanced security

**Future Enhancements:**
- IP restriction per API key
- Key expiration notifications
- Key rotation strategy
- Webhook on key revocation
- Automated key renewal for expired keys

---

## ADR-005: Billing Engine

### Status
Accepted

### Context
The platform needs a complete billing engine with:
- Usage metering for tracking API calls, storage, and other billable metrics
- Plan configuration with tiered pricing and overage charges
- Monthly billing job with idempotency to prevent duplicate charges
- Revenue split with Stripe Connect (platform fee)
- Reconciliation endpoint for financial reporting

### Decision

**Usage Metering Architecture:**
- Usage records stored in tenant schemas (ADR-001 compliant)
- Table `usage_records` in each tenant schema with: metric, quantity, unit_price_cents, total_price_cents
- Usage Meter Service provides methods for recording and aggregating usage

**Revenue Records:**
- Revenue records stored in **public schema** (cross-tenant financial visibility)
- Table `revenue_records` with: tenant_id, billing_period, gross_amount, platform_fee, net_amount
- Foreign key to tenants table for referential integrity

**Idempotency Strategy:**
- Job-level: Redis key `billing_job:<period>` with status (in_progress, completed, failed)
- Tenant-level: Redis key `billing:<tenantId>:<period>` to prevent duplicate billing
- Stripe idempotency keys used for all Stripe API calls

**Revenue Split:**
- Platform fee percentage configurable via PLATFORM_FEE_PERCENT (default 20%)
- Applied to gross amount before splitting
- Net amount transferred to tenant's Stripe Connect account (future)
- Revenue recorded in public schema for platform reporting

**Monthly Billing Job:**
- Scheduled via node-cron on 1st of month at 00:05 UTC
- Dry-run mode supported for testing
- Per-tenant error handling - failures don't block other tenants
- Comprehensive logging for debugging

**Plan Configuration:**
- Plans defined in code: free, basic, pro, enterprise
- Each plan has included quantities for API calls and storage
- Overage pricing per unit beyond included amount
- Stripe Price IDs for subscription plans

### Consequences

**Positive:**
- Complete billing solution with minimal external dependencies
- Idempotency prevents duplicate charges and billing errors
- Tenant-scoped usage ensures data isolation
- Public revenue records enable platform-wide reporting
- Stripe abstraction allows for easy provider changes (ADR-002)
- Mock provider enables testing without Stripe

**Negative:**
- Requires Redis for idempotency keys
- Stripe Connect requires additional tenant onboarding
- Usage aggregation queries can be expensive for large periods

**Security Considerations:**
- Billing endpoints require admin role
- Usage recording requires authentication
- No sensitive data in logs
- Stripe keys stored in environment variables

**Monitoring & Operations:**
- Monitor failed charges and dunning queue
- Track platform revenue via reconciliation
- Alert on billing job failures
- Consider usage archival for old records

**Future Enhancements:**
- Dunning flow with retry logic
- Invoice generation
- Usage alerts and notifications
- Stripe Connect onboarding flow
- Proration for plan changes


