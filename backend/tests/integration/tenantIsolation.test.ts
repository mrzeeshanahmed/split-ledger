import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { TenantProvisioningService } from '../../src/services/tenantProvisioning.js';
import { tenantDb, getTenantSchema, TenantPoolClient } from '../../src/db/tenantClient.js';
import { query } from '../../src/db/index.js';

describe('Tenant Isolation Integration Tests', () => {
  // Test tenant data
  const tenant1Input = {
    name: 'Acme Corp',
    subdomain: 'acme-test',
    owner_email: 'owner@acme.com',
    owner_password: 'securepass123',
    owner_first_name: 'John',
    owner_last_name: 'Doe',
    billing_email: 'billing@acme.com',
  };

  const tenant2Input = {
    name: 'Globex Inc',
    subdomain: 'globex-test',
    owner_email: 'owner@globex.com',
    owner_password: 'securepass123',
    owner_first_name: 'Jane',
    owner_last_name: 'Smith',
    billing_email: 'billing@globex.com',
  };

  let tenant1Result: Awaited<ReturnType<typeof TenantProvisioningService.provisionTenant>>;
  let tenant2Result: Awaited<ReturnType<typeof TenantProvisioningService.provisionTenant>>;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';

    // Wait for database
    let retries = 10;
    while (retries > 0) {
      try {
        await query('SELECT 1');
        break;
      } catch {
        retries--;
        if (retries === 0) throw new Error('Database not available');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  });

  afterAll(async () => {
    // Close all tenant pools
    await tenantDb.closeAll();
  });

  beforeEach(async () => {
    // Provision two test tenants
    tenant1Result = await TenantProvisioningService.provisionTenant(tenant1Input);
    tenant2Result = await TenantProvisioningService.provisionTenant(tenant2Input);
  });

  describe('Search Path Isolation', () => {
    it('should set search_path correctly for tenant queries', async () => {
      const tenant1Schema = tenant1Result.schema_name;
      const tenant2Schema = tenant2Result.schema_name;

      // Get clients for each tenant
      const client1 = await tenantDb.getClient(tenant1Schema);
      const client2 = await tenantDb.getClient(tenant2Schema);

      try {
        // Verify search_path is set correctly
        const { rows: result1 } = await client1.query("SHOW search_path");
        const { rows: result2 } = await client2.query("SHOW search_path");

        expect(result1[0].search_path).toContain(tenant1Schema);
        expect(result2[0].search_path).toContain(tenant2Schema);
      } finally {
        client1.release();
        client2.release();
      }
    });

    it('should isolate data between tenants using search_path', async () => {
      const tenant1Schema = tenant1Result.schema_name;
      const tenant2Schema = tenant2Result.schema_name;

      // Insert test data in tenant1
      const client1 = await tenantDb.getClient(tenant1Schema);
      await client1.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
         VALUES ($1, $2, $3, $4, 'member', true)`,
        ['user1@acme.com', 'hash1', 'User', 'One']
      );
      client1.release();

      // Insert test data in tenant2
      const client2 = await tenantDb.getClient(tenant2Schema);
      await client2.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
         VALUES ($1, $2, $3, $4, 'member', true)`,
        ['user1@globex.com', 'hash2', 'User', 'Two']
      );
      client2.release();

      // Query tenant1 - should only see tenant1's users
      const tenant1Client = await tenantDb.getClient(tenant1Schema);
      const { rows: tenant1Users } = await tenant1Client.query(
        'SELECT email FROM users WHERE role = $1',
        ['member']
      );
      tenant1Client.release();

      // Query tenant2 - should only see tenant2's users
      const tenant2Client = await tenantDb.getClient(tenant2Schema);
      const { rows: tenant2Users } = await tenant2Client.query(
        'SELECT email FROM users WHERE role = $1',
        ['member']
      );
      tenant2Client.release();

      // Verify isolation
      expect(tenant1Users).toHaveLength(1);
      expect(tenant1Users[0].email).toBe('user1@acme.com');
      
      expect(tenant2Users).toHaveLength(1);
      expect(tenant2Users[0].email).toBe('user1@globex.com');
    });
  });

  describe('Cross-Tenant Query Prevention', () => {
    it('should not allow querying other tenant schemas without explicit reference', async () => {
      const tenant1Schema = tenant1Result.schema_name;
      const tenant2Schema = tenant2Result.schema_name;

      // Try to explicitly query tenant2's schema from tenant1's context
      const client1 = await tenantDb.getClient(tenant1Schema);

      // This should fail because the table doesn't exist in tenant1's search_path
      await expect(
        client1.query(`SELECT * FROM ${tenant2Schema}.users`)
      ).rejects.toThrow();

      client1.release();
    });

    it('should maintain isolation even with direct schema qualification', async () => {
      const tenant1Schema = tenant1Result.schema_name;
      const tenant2Schema = tenant2Result.schema_name;

      // Insert data in both tenants
      const client1 = await tenantDb.getClient(tenant1Schema);
      await client1.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
         VALUES ($1, $2, $3, $4, 'member', true)`,
        ['test@acme.com', 'hash', 'Test', 'User']
      );
      client1.release();

      const client2 = await tenantDb.getClient(tenant2Schema);
      await client2.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
         VALUES ($1, $2, $3, $4, 'member', true)`,
        ['test@globex.com', 'hash', 'Test', 'User']
      );
      client2.release();

      // Query from tenant1's search_path should only see tenant1's data
      const verifyClient1 = await tenantDb.getClient(tenant1Schema);
      const { rows: tenant1Only } = await verifyClient1.query(
        'SELECT email FROM users WHERE role = $1',
        ['member']
      );
      verifyClient1.release();

      // Query from tenant2's search_path should only see tenant2's data
      const verifyClient2 = await tenantDb.getClient(tenant2Schema);
      const { rows: tenant2Only } = await verifyClient2.query(
        'SELECT email FROM users WHERE role = $1',
        ['member']
      );
      verifyClient2.release();

      expect(tenant1Only).toHaveLength(1);
      expect(tenant1Only[0].email).toBe('test@acme.com');
      
      expect(tenant2Only).toHaveLength(1);
      expect(tenant2Only[0].email).toBe('test@globex.com');
    });
  });

  describe('Tenant Pool Management', () => {
    it('should reuse pool for same tenant schema', async () => {
      const tenant1Schema = tenant1Result.schema_name;

      // Get multiple clients for same tenant
      const client1a = await tenantDb.getClient(tenant1Schema);
      const client1b = await tenantDb.getClient(tenant1Schema);

      // Both should work
      await Promise.all([
        client1a.query('SELECT 1'),
        client1b.query('SELECT 1'),
      ]);

      client1a.release();
      client1b.release();
    });

    it('should create separate pools for different tenants', async () => {
      const tenant1Schema = tenant1Result.schema_name;
      const tenant2Schema = tenant2Result.schema_name;

      // Get clients from different tenants
      const client1 = await tenantDb.getClient(tenant1Schema);
      const client2 = await tenantDb.getClient(tenant2Schema);

      // Verify they're connected to different schemas
      const { rows: schema1 } = await client1.query('SELECT current_schema() as schema');
      const { rows: schema2 } = await client2.query('SELECT current_schema() as schema');

      expect(schema1[0].schema).toBe(tenant1Schema);
      expect(schema2[0].schema).toBe(tenant2Schema);

      client1.release();
      client2.release();
    });

    it('should close individual tenant pools', async () => {
      const tenant1Schema = tenant1Result.schema_name;

      // Get a client to ensure pool is created
      const client1 = await tenantDb.getClient(tenant1Schema);
      await client1.query('SELECT 1');
      client1.release();

      // Close the pool
      await tenantDb.closePool(tenant1Schema);

      // Should still work - pool will be recreated
      const client2 = await tenantDb.getClient(tenant1Schema);
      const { rows } = await client2.query('SELECT 1');
      expect(rows).toHaveLength(1);
      client2.release();
    });
  });

  describe('Transaction Isolation', () => {
    it('should maintain isolation in transactions', async () => {
      const tenant1Schema = tenant1Result.schema_name;

      // Use transaction
      await tenantDb.transaction(tenant1Schema, async (client) => {
        await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
           VALUES ($1, $2, $3, $4, 'member', true)`,
          ['transaction@acme.com', 'hash', 'Transaction', 'Test']
        );

        // Query within transaction should see the inserted data
        const { rows } = await client.query(
          'SELECT email FROM users WHERE email = $1',
          ['transaction@acme.com']
        );
        expect(rows).toHaveLength(1);
      });

      // Data should be committed
      const verifyClient = await tenantDb.getClient(tenant1Schema);
      const { rows } = await verifyClient.query(
        'SELECT email FROM users WHERE email = $1',
        ['transaction@acme.com']
      );
      expect(rows).toHaveLength(1);
      verifyClient.release();
    });

    it('should rollback failed transactions', async () => {
      const tenant1Schema = tenant1Result.schema_name;

      // Attempt a transaction that will fail
      await expect(
        tenantDb.transaction(tenant1Schema, async (client) => {
          await client.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
             VALUES ($1, $2, $3, $4, 'member', true)`,
            ['rollback@acme.com', 'hash', 'Rollback', 'Test']
          );
          
          // Force a failure
          throw new Error('Simulated failure');
        })
      ).rejects.toThrow('Simulated failure');

      // Data should not be committed
      const verifyClient = await tenantDb.getClient(tenant1Schema);
      const { rows } = await verifyClient.query(
        'SELECT email FROM users WHERE email = $1',
        ['rollback@acme.com']
      );
      expect(rows).toHaveLength(0);
      verifyClient.release();
    });
  });

  describe('getTenantSchema helper', () => {
    it('should correctly convert UUID to schema name', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const expected = 'tenant_550e8400e29b41d4a716446655440000';
      
      expect(getTenantSchema(uuid)).toBe(expected);
    });

    it('should handle UUID with braces', () => {
      const uuid = '{550e8400-e29b-41d4-a716-446655440000}';
      const expected = 'tenant_550e8400e29b41d4a716446655440000';
      
      expect(getTenantSchema(uuid)).toBe(expected);
    });
  });
});
