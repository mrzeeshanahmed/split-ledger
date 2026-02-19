# Authentication System

This document describes the authentication system implementation for Split-Ledger.

## Overview

The authentication system provides secure, multi-tenant user authentication using JWT tokens and httpOnly cookies.

## Features

- **User Registration**: Register new users with email and password
- **User Login**: Authenticate users with email and password
- **Token Refresh**: Refresh expired access tokens
- **User Logout**: Securely logout and invalidate tokens
- **Password Reset**: Request and complete password reset via email
- **Multi-tenant Isolation**: Users are isolated per tenant
- **Rate Limiting**: Protection against brute force attacks
- **Security**: httpOnly cookies, CSRF protection, token blacklisting

## API Endpoints

### Register

**POST** `/api/auth/register`

Register a new user account.

**Request Headers:**
- `X-Tenant-ID`: Tenant ID (required)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "emailVerified": false
  }
}
```

**Cookies Set:**
- `access_token`: JWT access token (15 min)
- `refresh_token`: JWT refresh token (7 days)

### Login

**POST** `/api/auth/login`

Authenticate a user.

**Request Headers:**
- `X-Tenant-ID`: Tenant ID (required)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "emailVerified": true
  }
}
```

**Cookies Set:**
- `access_token`: JWT access token (15 min)
- `refresh_token`: JWT refresh token (7 days)

### Refresh Token

**POST** `/api/auth/refresh`

Refresh an expired access token.

**Request Headers:**
- `X-Tenant-ID`: Tenant ID (required)
- `Cookie`: `refresh_token=<token>` (required)

**Response (200 OK):**
```json
{
  "success": true
}
```

**Cookie Set:**
- `access_token`: New JWT access token (15 min)

### Logout

**POST** `/api/auth/logout`

Logout a user and invalidate tokens.

**Request Headers:**
- `X-Tenant-ID`: Tenant ID (required)
- `Cookie`: `access_token=<token>` (required)

**Response (200 OK):**
```json
{
  "success": true
}
```

**Cookies Cleared:**
- `access_token`
- `refresh_token`

### Get Current User

**GET** `/api/auth/me`

Get the current authenticated user's information.

**Request Headers:**
- `X-Tenant-ID`: Tenant ID (required)
- `Cookie`: `access_token=<token>` (required)

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "status": "active",
    "emailVerified": true,
    "lastLoginAt": "2024-02-19T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-02-19T10:30:00Z"
  }
}
```

### Forgot Password

**POST** `/api/auth/forgot-password`

Request a password reset email.

**Request Headers:**
- `X-Tenant-ID`: Tenant ID (required)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Note:** This endpoint always returns success to prevent email enumeration.

### Reset Password

**POST** `/api/auth/reset-password`

Reset password using a token from forgot-password email.

**Request Headers:**
- `X-Tenant-ID`: Tenant ID (required)

**Request Body:**
```json
{
  "token": "reset-token-uuid",
  "newPassword": "NewSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

## Rate Limiting

All authentication endpoints are rate-limited:

- **Auth endpoints** (register, login): 10 requests per 15 minutes per IP per tenant
- **Password reset endpoints**: 3 requests per hour per IP per tenant
- **API endpoints**: 100 requests per 15 minutes per IP per tenant
- **User-specific endpoints**: 200 requests per 15 minutes per user

Rate limits are enforced using Redis with the following keys:
- `ratelimit:${ip}:${tenantId}`: General API limits
- `ratelimit:${tenantId}:${userId}`: User-specific limits

## Security Features

### httpOnly Cookies
All tokens are stored in httpOnly cookies to prevent XSS attacks.

### SameSite=Strict
All cookies have `SameSite=Strict` to prevent CSRF attacks.

### Token Blacklisting
Refresh tokens are blacklisted on logout and password reset.

### Short-lived Access Tokens
Access tokens expire after 15 minutes to limit exposure.

### Password Hashing
Passwords are hashed using bcrypt with 12 rounds.

### Email Enumeration Protection
Forgot-password always returns success, preventing email enumeration.

### Tenant Isolation
Token validation ensures tenant ID matches request tenant context.

## Token Payload

### Access Token
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "email": "user@example.com",
  "role": "member",
  "iat": 1234567890,
  "exp": 1234568790,
  "iss": "split-ledger-api",
  "aud": "tenant-uuid"
}
```

### Refresh Token
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "email": "user@example.com",
  "role": "member",
  "tokenId": "uuid",
  "iat": 1234567890,
  "exp": 1235172590,
  "iss": "split-ledger-api",
  "aud": "tenant-uuid"
}
```

## Middleware

### requireAuth
Middleware to require authentication for a route.

```typescript
import { requireAuth } from './middleware/auth.js';

router.get('/protected', requireAuth, async (req, res) => {
  // req.user is populated with user info
  res.json({ user: req.user });
});
```

### requireRole
Middleware to require specific roles.

```typescript
import { requireAuth, requireRole } from './middleware/auth.js';

router.get('/admin', requireAuth, requireRole('admin', 'owner'), async (req, res) => {
  // Only admin and owner roles can access
  res.json({ message: 'Admin area' });
});
```

### optionalAuth
Middleware to attempt authentication but not fail if no token.

```typescript
import { optionalAuth } from './middleware/auth.js';

router.get('/public', optionalAuth, async (req, res) => {
  if (req.user) {
    res.json({ message: `Hello ${req.user.email}` });
  } else {
    res.json({ message: 'Hello anonymous' });
  }
});
```

## Environment Variables

The following environment variables are required for authentication:

```env
# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here
REFRESH_TOKEN_EXPIRES_IN=7d

# Cookie Configuration
COOKIE_SECRET=your-cookie-secret-here
COOKIE_DOMAIN=localhost
```

## Database Schema

Users are stored in each tenant's schema:

```sql
CREATE TABLE tenant_<id>.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing

Run authentication tests:

```bash
cd backend
npm test
```

Tests are located in:
- `tests/services/auth.test.ts` - Auth service tests
- `tests/routes/auth.test.ts` - Auth route tests

## Development Notes

### Testing Password Reset
In development, the password reset link is logged to the console. In production, an email service should be integrated.

### Viewing Tokens
For debugging, you can view the token payload using a JWT debugger like jwt.io.

### Clearing Tokens
To clear all tokens, delete the cookies:
```javascript
document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
```

## Future Enhancements

- [ ] Email service integration for password reset
- [ ] Multi-factor authentication (MFA)
- [ ] Device management and tracking
- [ ] Concurrent session limits
- [ ] OAuth2/OIDC provider integration
- [ ] Session management UI
- [ ] Audit logging for authentication events
