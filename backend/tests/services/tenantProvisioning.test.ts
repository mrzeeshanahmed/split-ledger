import { describe, it, expect, beforeEach } from 'vitest';
import { TenantProvisioningService } from '../../src/services/tenantProvisioning.js';
import { query } from '../../src/db/index.js';
import type { CreateTenantInput } from '../../src/types/tenant.js';

describe('TenantProvisioningService', () => {
  const validInput: CreateTenantInput = {
    name: 'Test Company',
    subdomain: 'testco',
    owner_email: 'owner@testco.com',
    owner_password: 'password123',
    owner_first_name: 'John',
    owner_last_name: 'Doe',
    billing_email: 'billing@testco.com',
  };

  describe('provisionTenant', () => {
    it('should create a new tenant with owner user in a new schema', async () => {
      const result = await TenantProvisioningService.provisionTenant(validInput);

      expect(result.tenant).toBeDefined();
      expect(result.tenant.name).toBe('Test Company');
      expect(result.tenant.subdomain).toBe('testco');
      expect(result.tenant.status).toBe('active');

      expect(result.owner).toBeDefined();
      expect(result.owner.email).toBe('owner@testco.com');
      expect(result.owner.first_name).toBe('John');
      expect(result.owner.last_name).toBe('Doe');
      expect(result.owner.role).toBe('owner');
      expect(result.owner.password_hash).not.toBe('password123');

      expect(result.schema_name).toMatch(/^tenant_[a-f0-9]+$/);

      // Verify schema exists
      const schemaExists = await TenantProvisioningService.tenantSchemaExists(result.tenant.id);
      expect(schemaExists).toBe(true);

      // Verify users table exists in schema
      const { rows: tables } = await query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = $1 AND table_name = 'users'`,
        [result.schema_name]
      );
      expect(tables.length).toBe(1);
    });

    it('should hash the owner password correctly', async () => {
      const bcrypt = await import('bcrypt');
      const result = await TenantProvisioningService.provisionTenant({
        ...validInput,
        subdomain: 'testco2',
        owner_email: 'owner2@testco.com',
      });

      const isValidPassword = await bcrypt.default.compare('password123', result.owner.password_hash);
      expect(isValidPassword).toBe(true);
    });

    it('should create schema with tenant_template users structure', async () => {
      const result = await TenantProvisioningService.provisionTenant({
        ...validInput,
        subdomain: 'testco3',
        owner_email: 'owner3@testco.com',
      });

      // Check that the users table has the same columns as template
      const { rows: templateColumns } = await query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'tenant_template' AND table_name = 'users'
        ORDER BY ordinal_position
      `);

      const { rows: tenantColumns } = await query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'users'
        ORDER BY ordinal_position
      `, [result.schema_name]);

      expect(tenantColumns.length).toBe(templateColumns.length);
    });
  });

  describe('validateSubdomain', () => {
    it('should accept valid subdomains', async () => {
      await expect(
        TenantProvisioningService.validateSubdomain('valid-subdomain')
      ).resolves.not.toThrow();
    });

    it('should reject reserved subdomains', async () => {
      await expect(
        TenantProvisioningService.validateSubdomain('www')
      ).rejects.toThrow('reserved');
    });

    it('should reject duplicate subdomains', async () => {
      await TenantProvisioningService.provisionTenant({
        ...validInput,
        subdomain: 'duplicate-test',
        owner_email: 'owner-dupe@test.com',
      });

      await expect(
        TenantProvisioningService.validateSubdomain('duplicate-test')
      ).rejects.toThrow('already taken');
    });

    it('should reject invalid subdomain formats', async () => {
      await expect(
        TenantProvisioningService.validateSubdomain('invalid_subdomain')
      ).rejects.toThrow();

      await expect(
        TenantProvisioningService.validateSubdomain('-startswithdash')
      ).rejects.toThrow();

      await expect(
        TenantProvisioningService.validateSubdomain('endswithdash-')
      ).rejects.toThrow();
    });
  });

  describe('validateCustomDomain', () => {
    it('should reject duplicate custom domains', async () => {
      await TenantProvisioningService.provisionTenant({
        ...validInput,
        subdomain: 'custom-test',
        custom_domain: 'example.com',
        owner_email: 'owner-custom@test.com',
      });

      await expect(
        TenantProvisioningService.validateCustomDomain('example.com')
      ).rejects.toThrow('already in use');
    });

    it('should accept non-existent custom domains', async () => {
      await expect(
        TenantProvisioningService.validateCustomDomain('newdomain.com')
      ).resolves.not.toThrow();
    });
  });

  describe('input validation', () => {
    it('should reject invalid email format', async () => {
      await expect(
        TenantProvisioningService.provisionTenant({
          ...validInput,
          subdomain: 'invalid-email',
          owner_email: 'not-an-email',
        })
      ).rejects.toThrow('Invalid email');
    });

    it('should reject short passwords', async () => {
      await expect(
        TenantProvisioningService.provisionTenant({
          ...validInput,
          subdomain: 'short-pass',
          owner_email: 'shortpass@test.com',
          owner_password: 'short',
        })
      ).rejects.toThrow('at least 8 characters');
    });
  });

  describe('getTenant', () => {
    it('should retrieve tenant by ID', async () => {
      const created = await TenantProvisioningService.provisionTenant({
        ...validInput,
        subdomain: 'get-test',
        owner_email: 'gettest@test.com',
      });

      const found = await TenantProvisioningService.getTenant(created.tenant.id);
      expect(found).toBeDefined();
      expect(found?.subdomain).toBe('get-test');
    });

    it('should return null for non-existent tenant', async () => {
      const found = await TenantProvisioningService.getTenant('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('getTenantBySubdomain', () => {
    it('should retrieve tenant by subdomain', async () => {
      const found = await TenantProvisioningService.getTenantBySubdomain('get-test');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Company');
    });

    it('should return null for non-existent subdomain', async () => {
      const found = await TenantProvisioningService.getTenantBySubdomain('nonexistent123');
      expect(found).toBeNull();
    });
  });

  describe('listTenantUsers', () => {
    it('should list users in tenant schema', async () => {
      const created = await TenantProvisioningService.provisionTenant({
        ...validInput,
        subdomain: 'list-users',
        owner_email: 'listuser@test.com',
      });

      const users = await TenantProvisioningService.listTenantUsers(created.tenant.id);
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('listuser@test.com');
    });
  });

  describe('tenantSchemaExists', () => {
    it('should return true for existing tenant schema', async () => {
      const created = await TenantProvisioningService.provisionTenant({
        ...validInput,
        subdomain: 'schema-check',
        owner_email: 'schema@test.com',
      });

      const exists = await TenantProvisioningService.tenantSchemaExists(created.tenant.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent tenant schema', async () => {
      const exists = await TenantProvisioningService.tenantSchemaExists('00000000-0000-0000-0000-000000000000');
      expect(exists).toBe(false);
    });
  });
});