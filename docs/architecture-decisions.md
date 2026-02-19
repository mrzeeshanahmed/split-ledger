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

