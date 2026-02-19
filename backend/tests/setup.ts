import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { pool, query } from '../src/db/index.js';

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Wait for database to be ready
  let retries = 10;
  while (retries > 0) {
    try {
      await query('SELECT 1');
      break;
    } catch {
      retries--;
      if (retries === 0) throw new Error('Database not available');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

afterAll(async () => {
  // Clean up: close pool
  await pool.end();
});

afterEach(async () => {
  // Clean up test data between tests
  // Get all tenant schemas
  const { rows: schemas } = await query(
    `SELECT schema_name FROM information_schema.schemata 
     WHERE schema_name LIKE 'tenant_%' 
     AND schema_name != 'tenant_template'`
  );

  // Drop all tenant schemas
  for (const schema of schemas) {
    await query(`DROP SCHEMA IF EXISTS ${schema.schema_name} CASCADE`);
  }

  // Clean up tenants table (keep reserved subdomains)
  await query(`DELETE FROM tenants WHERE subdomain NOT IN (
    'www', 'api', 'admin', 'mail', 'ftp', 'localhost', 'app', 'staging', 'dev', 'test'
  )`);
});

// Mock logger to reduce noise in tests
vi.mock('../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));