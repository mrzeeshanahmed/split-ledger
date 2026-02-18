# Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| NODE_ENV | string | Yes | development | Application environment |
| PORT | number | Yes | 3000 | Server port |
| DATABASE_URL | string | Yes | - | PostgreSQL connection string |
| REDIS_URL | string | Yes | - | Redis connection string |
| JWT_SECRET | string | Yes | - | Secret for JWT signing |
| JWT_EXPIRES_IN | string | Yes | 15m | JWT token expiration |
| REFRESH_TOKEN_SECRET | string | Yes | - | Secret for refresh tokens |
| REFRESH_TOKEN_EXPIRES_IN | string | Yes | 7d | Refresh token expiration |
| COOKIE_SECRET | string | Yes | - | Secret for cookie signing |
| COOKIE_DOMAIN | string | Yes | - | Cookie domain |
| STRIPE_SECRET_KEY | string | Yes | - | Stripe API secret key |
| STRIPE_PUBLISHABLE_KEY | string | Yes | - | Stripe publishable key |
| STRIPE_WEBHOOK_SECRET | string | Yes | - | Stripe webhook signing secret |
| FRONTEND_URL | string | Yes | - | Frontend application URL |
| ALLOWED_ORIGINS | string | Yes | - | CORS allowed origins (comma-separated) |
