# Split-Ledger

A modern expense splitting and ledger management application.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Vite)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Pages    │  │ Components  │  │    State Management     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP/WebSocket
┌────────────────────────────────▼────────────────────────────────┐
│                       BACKEND (Node.js/Express)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Routes    │─▶│  Services   │─▶│     Repositories        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────┬───────────────────┬───────────────────┬────────────────┘
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐
    │PostgreSQL│        │   Redis   │       │   Stripe  │
    │    15    │        │     7     │       │    API    │
    └──────────┘        └───────────┘       └───────────┘
```

## Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)
- Redis 7 (or use Docker)

## Setup

1. Clone the repository
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Start infrastructure:
   ```bash
   docker-compose up -d
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run migrations:
   ```bash
   npm run db:migrate
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run db:migrate` | Run database migrations |

## Documentation

- [Environment Variables](./docs/environment-variables.md)
- [Architecture Decisions](./docs/architecture-decisions.md)

## License

MIT
