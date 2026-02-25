import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { query, transaction, getClient } from '../db/index.js';
import {
  CreateTenantInput,
  TenantProvisioningResult,
  TenantError,
  TenantErrorCode,
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
} from '../types/tenant.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 12;

export class TenantProvisioningService {
  /**
   * Provision a new tenant with atomic transaction
   */
  static async provisionTenant(input: CreateTenantInput): Promise<TenantProvisioningResult> {
    await this.validateInput(input);

    const result = await transaction(async (client) => {
      // Create the tenant record
      const tenantId = randomUUID();

      const { rows: tenantRows } = await client.query(
        `INSERT INTO tenants (id, name, subdomain, custom_domain, billing_email, owner_id)
         VALUES ($1, $2, $3, $4, $5, NULL)
         RETURNING *`,
        [tenantId, input.name, input.subdomain, input.custom_domain || null, input.billing_email || null]
      );

      const tenant = tenantRows[0];

      // Create schema name (UUID without dashes)
      const schemaName = `tenant_${tenantId.replace(/-/g, '')}`;

      // Create schema for tenant
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

      // Fetch all tables from the tenant_template schema
      const { rows: tables } = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'tenant_template'
      `);

      console.log('Tables cloned from tenant_template:', tables);

      // Clone every table in tenant_template
      for (const { table_name } of tables) {
        await client.query(`
          CREATE TABLE ${schemaName}.${table_name} (
            LIKE tenant_template.${table_name} INCLUDING ALL
          )
        `);
      }

      // Hash owner password
      const passwordHash = await bcrypt.hash(input.owner_password, SALT_ROUNDS);

      // Insert owner user
      const { rows: userRows } = await client.query(
        `INSERT INTO ${schemaName}.users 
         (email, password_hash, first_name, last_name, role, email_verified)
         VALUES ($1, $2, $3, $4, 'owner', TRUE)
         RETURNING *`,
        [input.owner_email, passwordHash, input.owner_first_name, input.owner_last_name]
      );

      const owner = userRows[0];

      // Update tenant with owner_id
      await client.query(
        'UPDATE tenants SET owner_id = $1 WHERE id = $2',
        [owner.id, tenantId]
      );

      return {
        tenant,
        owner,
        schema_name: schemaName,
      };
    });

    logger.info({
      message: 'Tenant provisioned successfully',
      tenant_id: result.tenant.id,
      subdomain: result.tenant.subdomain,
      schema_name: result.schema_name,
    });

    return result;
  }

  /**
   * Validate subdomain
   */
  static async validateSubdomain(subdomain: string): Promise<void> {
    // Check format
    if (!SUBDOMAIN_REGEX.test(subdomain)) {
      throw new TenantError(
        'Subdomain must be 1-63 characters, start and end with alphanumeric, only contain hyphens in the middle',
        'SUBDOMAIN_INVALID',
        400
      );
    }

    // Check if reserved
    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      throw new TenantError(
        'This subdomain is reserved and cannot be used',
        'RESERVED_SUBDOMAIN',
        400
      );
    }

    // Check if already exists
    const { rows } = await query(
      'SELECT id FROM tenants WHERE subdomain = $1',
      [subdomain.toLowerCase()]
    );

    if (rows.length > 0) {
      throw new TenantError(
        'This subdomain is already taken',
        'DUPLICATE_SUBDOMAIN',
        409
      );
    }
  }

  /**
   * Validate custom domain
   */
  static async validateCustomDomain(customDomain: string): Promise<void> {
    const { rows } = await query(
      'SELECT id FROM tenants WHERE custom_domain = $1',
      [customDomain.toLowerCase()]
    );

    if (rows.length > 0) {
      throw new TenantError(
        'This custom domain is already in use',
        'DUPLICATE_CUSTOM_DOMAIN',
        409
      );
    }
  }

  /**
   * Get tenant by ID
   */
  static async getTenant(id: string) {
    const { rows } = await query(
      'SELECT * FROM tenants WHERE id = $1',
      [id]
    );

    return rows[0] || null;
  }

  /**
   * Get tenant by subdomain
   */
  static async getTenantBySubdomain(subdomain: string) {
    const { rows } = await query(
      'SELECT * FROM tenants WHERE subdomain = $1',
      [subdomain.toLowerCase()]
    );

    return rows[0] || null;
  }

  /**
   * List all users in a tenant schema
   */
  static async listTenantUsers(tenantId: string) {
    const schemaName = `tenant_${tenantId.replace(/-/g, '')}`;

    const { rows } = await query(
      `SELECT id, email, first_name, last_name, role, status, email_verified, created_at, updated_at
       FROM ${schemaName}.users
       ORDER BY created_at DESC`
    );

    return rows;
  }

  /**
   * Check if a tenant schema exists
   */
  static async tenantSchemaExists(tenantId: string): Promise<boolean> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '')}`;

    const { rows } = await query(
      'SELECT 1 FROM information_schema.schemata WHERE schema_name = $1',
      [schemaName]
    );

    return rows.length > 0;
  }

  private static async validateInput(input: CreateTenantInput): Promise<void> {
    // Validate subdomain
    await this.validateSubdomain(input.subdomain);

    // Validate custom domain if provided
    if (input.custom_domain) {
      await this.validateCustomDomain(input.custom_domain);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.owner_email)) {
      throw new TenantError(
        'Invalid email address format',
        'PROVISIONING_FAILED',
        400
      );
    }

    // Password strength validation
    if (input.owner_password.length < 8) {
      throw new TenantError(
        'Password must be at least 8 characters long',
        'PROVISIONING_FAILED',
        400
      );
    }
  }
}