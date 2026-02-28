import pg, { Pool, PoolClient, QueryResultRow } from 'pg';
import { getDatabaseConfig } from '../config/env.js';
import logger from '../utils/logger.js';

const { Pool: PgPool } = pg;

/**
 * Configuration for creating a tenant-scoped database pool
 */
export interface TenantPoolConfig {
  /**
   * The tenant schema name (e.g., tenant_550e8400e29b41d4a716446655440000)
   */
  tenantSchema: string;

  /**
   * Pool configuration options
   */
  poolOptions?: {
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };

  /**
   * Whether to validate the tenant schema exists before creating connections
   * @default true
   */
  validateSchema?: boolean;
}

/**
 * Tenant-scoped database pool
 * Automatically sets search_path for tenant isolation
 */
export class TenantPool {
  private pool: Pool;
  private tenantSchema: string;
  private originalSearchPath: string | null = null;

  constructor(config: TenantPoolConfig) {
    this.tenantSchema = config.tenantSchema;

    const poolConfig = getDatabaseConfig();

    this.pool = new PgPool({
      ...poolConfig,
      max: config.poolOptions?.max ?? 10,
      idleTimeoutMillis: config.poolOptions?.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: config.poolOptions?.connectionTimeoutMillis ?? 5000,
    });

    this.pool.on('error', (err) => {
      logger.error({
        message: 'Unexpected error on tenant pool client',
        error: err.message,
        tenantSchema: this.tenantSchema,
      });
    });
  }

  /**
   * Get a client from the pool with search_path set to tenant schema
   */
  async connect(): Promise<TenantPoolClient> {
    const client = await this.pool.connect();
    return new TenantPoolClient(client, this.tenantSchema);
  }

  /**
   * Execute a query with search_path set to tenant schema
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<pg.QueryResult<T>> {
    const client = await this.connect();
    try {
      return await client.query<T>(sql, params);
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction with search_path set to tenant schema
   */
  async transaction<T>(
    callback: (client: TenantPoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * End the pool
   */
  async end(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Get the tenant schema name
   */
  getTenantSchema(): string {
    return this.tenantSchema;
  }
}

/**
 * Tenant-scoped pool client
 * Automatically sets search_path on each query
 */
export class TenantPoolClient {
  private client: PoolClient;
  private tenantSchema: string;
  private searchPathSet: boolean = false;

  constructor(client: PoolClient, tenantSchema: string) {
    this.client = client;
    this.tenantSchema = tenantSchema;
  }

  /**
   * Ensure search_path is set for this connection
   */
  private async ensureSearchPath(): Promise<void> {
    if (!this.searchPathSet) {
      // Set search_path to tenant schema and public (for shared tables)
      await this.client.query(
        `SET search_path TO "${this.tenantSchema}", public`
      );
      this.searchPathSet = true;

      logger.debug({
        message: 'Set search_path for tenant',
        tenantSchema: this.tenantSchema,
      });
    }
  }

  /**
   * Execute a query with tenant search_path
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<pg.QueryResult<T>> {
    await this.ensureSearchPath();
    return this.client.query<T>(sql, params);
  }

  /**
   * Release the client back to the pool
   */
  release(): void {
    // Reset search_path before releasing
    if (this.searchPathSet) {
      this.client.query('RESET search_path').catch(() => {
        // Ignore errors when resetting
      });
    }
    this.client.release();
  }

  /**
   * Get the underlying PoolClient
   */
  getClient(): PoolClient {
    return this.client;
  }

  /**
   * Get the tenant schema name
   */
  getTenantSchema(): string {
    return this.tenantSchema;
  }
}

/**
 * TenantScopedDb - Singleton manager for tenant-scoped database connections
 * Maintains a cache of pools per tenant
 */
class TenantScopedDbManager {
  private pools: Map<string, TenantPool> = new Map();
  private defaultPool: Pool;

  constructor() {
    const poolConfig = getDatabaseConfig();
    this.defaultPool = new PgPool({
      ...poolConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.defaultPool.on('error', (err) => {
      logger.error({
        message: 'Unexpected error on default pool client',
        error: err.message,
      });
    });
  }

  /**
   * Get or create a tenant-scoped pool
   */
  getPool(tenantSchema: string): TenantPool {
    let pool = this.pools.get(tenantSchema);

    if (!pool) {
      pool = new TenantPool({ tenantSchema });
      this.pools.set(tenantSchema, pool);

      logger.debug({
        message: 'Created new tenant pool',
        tenantSchema,
      });
    }

    return pool;
  }

  /**
   * Get a tenant-scoped client for the given tenant schema
   */
  async getClient(tenantSchema: string): Promise<TenantPoolClient> {
    const pool = this.getPool(tenantSchema);
    return pool.connect();
  }

  /**
   * Execute a query in a tenant's schema
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    tenantSchema: string,
    sql: string,
    params?: unknown[]
  ): Promise<pg.QueryResult<T>> {
    const pool = this.getPool(tenantSchema);
    return pool.query<T>(sql, params);
  }

  /**
   * Execute a transaction in a tenant's schema
   */
  async transaction<T>(
    tenantSchema: string,
    callback: (client: TenantPoolClient) => Promise<T>
  ): Promise<T> {
    const pool = this.getPool(tenantSchema);
    return pool.transaction(callback);
  }

  /**
   * Close a specific tenant pool
   */
  async closePool(tenantSchema: string): Promise<void> {
    const pool = this.pools.get(tenantSchema);
    if (pool) {
      await pool.end();
      this.pools.delete(tenantSchema);

      logger.debug({
        message: 'Closed tenant pool',
        tenantSchema,
      });
    }
  }

  /**
   * Close all tenant pools and the default pool
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.pools.values()).map(pool => pool.end());
    await Promise.all(closePromises);
    this.pools.clear();
    await this.defaultPool.end();

    logger.info({
      message: 'Closed all tenant pools',
    });
  }

  /**
   * Get the default pool for public schema operations
   */
  getDefaultPool(): Pool {
    return this.defaultPool;
  }

  /**
   * Execute a query on the default pool (public schema)
   */
  async queryDefault<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<pg.QueryResult<T>> {
    return this.defaultPool.query<T>(sql, params);
  }
}

// Export singleton instance
export const tenantDb = new TenantScopedDbManager();

/**
 * Helper function to get tenant schema name from tenant ID
 */
export function getTenantSchema(tenantId: string): string {
  return `tenant_${tenantId.replace(/[^a-zA-Z0-9]/g, '')}`;
}

/**
 * Middleware to automatically add tenant-scoped database to request
 */
import type { RequestHandler } from 'express';
import { getCurrentTenantSchema } from '../middleware/tenantContext.js';

export const tenantDbMiddleware: RequestHandler = (req, _res, next) => {
  try {
    const tenantSchema = getCurrentTenantSchema(req);
    (req as any).db = {
      query: <T extends QueryResultRow = QueryResultRow>(
        sql: string,
        params?: unknown[]
      ) => tenantDb.query<T>(tenantSchema, sql, params),
      transaction: <T>(
        callback: (client: TenantPoolClient) => Promise<T>
      ) => tenantDb.transaction(tenantSchema, callback),
      getClient: () => tenantDb.getClient(tenantSchema),
      getTenantSchema: () => tenantSchema,
    };
    next();
  } catch (error) {
    next(error);
  }
};
