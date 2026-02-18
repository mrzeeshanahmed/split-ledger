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
