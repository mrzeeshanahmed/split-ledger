# Split Ledger Deployment Guide

This guide describes how to deploy the Split Ledger Backend using Docker and Docker Compose on a single-server Linux environment (Ubuntu 22.04+).

## Prerequisites

- **Node.js**: 20.x
- **PostgreSQL**: 15+
- **Redis**: 7+
- **Docker**: 24+
- **Docker Compose**: V2+

For a production deployment, we strongly recommend spinning these up via the pre-configured `docker-compose.prod.yml` file rather than installing them natively.

## Environment Variables

You must supply these variables to the `docker-compose` environment or directly to the runtime if hosting elsewhere:

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `NODE_ENV` | `string` | No | `development` | Should be `production` |
| `PORT` | `number` | No | `3000` | Port Node listens on |
| `DATABASE_URL` | `string` | Yes | - | Full connection string for PostgreSQL |
| `REDIS_URL` | `string` | No | `redis://localhost:6379` | Full connection string for Redis |
| `JWT_ACCESS_SECRET` | `string` | Yes | - | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | `string` | Yes | - | Secret for signing refresh tokens (min 32 chars) |
| `ALLOWED_ORIGINS` | `string` | No | `http://localhost:5173`| Comma-separated CORS allowed domains |
| `COOKIE_DOMAIN` | `string` | No | `localhost` | Top-level cookie domain (`.splitledger.com`) |
| `PAYMENT_PROVIDER` | `string` | No | `mock` | Switch to `"stripe"` for live billing |

## Single-Server Docker Deployment

If you are using a single VPS via Hetzner or DigitalOcean, run the following:

1. Copy `.env` to `.env.production` and fill out your Postgres and Redis URLs.
2. Build and start the services using the provided Compose configuration.

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Production Migrations

Database structure is managed with Knex-like schemas via Node scripts in `backend/src/db/migrations`.

When deploying a new version, *always* run migrations before cutting traffic to the new instances.

```bash
npm run migrate:up
```

*Note: In Docker, you should execute this within the Node app container before attaching it to the load balancer.*

## Provisioning the First Tenant

If your database is completely empty (i.e. first deployment), no tenant subdomains exist. Registration must happen via the backend scripts or UI wizard if exposed.

You can also seed a generic tenant for testing:
```bash
npm run seed:admin-tenant
```
*(This creates `hello` subdomain with an admin operator).*

## Backup Strategy

### PostgreSQL `pg_dump`
Back up the entire cluster every 12 hours via cron. Be aware that because of the schema-per-tenant isolation, standard table-level dumps will not suffice. Do a full database dump (`pg_dumpall` or `pg_dump -Fc dbname`) so that the multi-schema architecture (`tenant_uuid`, `tenant_template`, `public`) is preserved correctly.

### Redis RDB
Redis stores ephemeral session contexts, API Key authentication tokens, rate-limits, and password-reset hashes. If Redis loses data, active sessions will drop, requiring users to log back in. Configure Redis `appendonly yes` and sync periodic RDB dumps to AWS S3.
