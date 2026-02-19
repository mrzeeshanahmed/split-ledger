import 'express';
import type { Request, RequestHandler } from 'express';
import { TenantProvisioningService } from '../services/tenantProvisioning.js';
import { Tenant } from '../types/tenant.js';
import { AppError } from '../errors/index.js';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSchema?: string;
      tenant?: Tenant;
    }
  }
}

export interface TenantContextOptions {
  /**
   * Whether to extract tenant from subdomain in the Host header
   * @default true
   */
  extractFromSubdomain?: boolean;
  
  /**
   * Whether to extract tenant from X-Tenant-ID header
   * @default true
   */
  extractFromHeader?: boolean;
  
  /**
   * Whether to extract tenant from X-Tenant-Subdomain header
   * @default false
   */
  extractFromSubdomainHeader?: boolean;
  
  /**
   * Whether to require tenant context (throw error if not found)
   * @default false
   */
  required?: boolean;
}

/**
 * Extract tenant identifier from various sources
 */
function extractTenantIdentifier(req: Request, options: TenantContextOptions): string | null {
  // Priority 1: X-Tenant-ID header (most explicit)
  if (options.extractFromHeader !== false) {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    if (tenantId) {
      return tenantId;
    }
  }

  // Priority 2: X-Tenant-Subdomain header
  if (options.extractFromSubdomainHeader) {
    const subdomain = req.headers['x-tenant-subdomain'] as string | undefined;
    if (subdomain) {
      return subdomain;
    }
  }

  // Priority 3: Subdomain from Host header
  if (options.extractFromSubdomain !== false) {
    const host = req.headers.host;
    if (host) {
      const hostValue = Array.isArray(host) ? host[0] : host;
      // Remove port if present
      const hostname = hostValue.split(':')[0];
      
      // Check for subdomain pattern (e.g., acme.example.com)
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        // First part is likely the subdomain (e.g., "acme" from "acme.example.com")
        // Skip localhost and common patterns
        const subdomain = parts[0];
        
        // Skip if it's localhost or an IP address
        if (subdomain !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
          return subdomain;
        }
      }
    }
  }

  return null;
}

/**
 * Tenant context middleware
 * Resolves tenant from request and attaches tenant info to the request object
 */
export const tenantContextMiddleware = (options: TenantContextOptions = {}): RequestHandler => {
  const {
    extractFromSubdomain = true,
    extractFromHeader = true,
    extractFromSubdomainHeader = false,
    required = false,
  } = options;

  return async (req, res, next) => {
    try {
      const tenantIdentifier = extractTenantIdentifier(req, {
        extractFromSubdomain,
        extractFromHeader,
        extractFromSubdomainHeader,
      });

      if (!tenantIdentifier) {
        if (required) {
          throw new AppError('Tenant context is required', 400, 'TENANT_REQUIRED');
        }
        return next();
      }

      let tenant: Tenant | null = null;
      let tenantId: string | null = null;

      // Check if it looks like a UUID (tenant ID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(tenantIdentifier)) {
        const result = await TenantProvisioningService.getTenant(tenantIdentifier);
        tenant = result as Tenant | null;
        tenantId = tenantIdentifier;
      } else {
        // Assume it's a subdomain
        const result = await TenantProvisioningService.getTenantBySubdomain(tenantIdentifier);
        tenant = result as Tenant | null;
        tenantId = tenant?.id || null;
      }

      if (!tenant) {
        if (required) {
          throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
        }
        return next();
      }

      // Check if tenant is active
      if (tenant.status !== 'active') {
        throw new AppError(
          `Tenant is ${tenant.status}. Please contact support.`,
          403,
          'TENANT_NOT_ACTIVE'
        );
      }

      // Set tenant context on request
      req.tenantId = tenantId || undefined;
      req.tenantSchema = `tenant_${tenantId?.replace(/-/g, '')}`;
      req.tenant = tenant;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to require tenant context
 * Use this after tenantContextMiddleware to ensure tenant is resolved
 */
export const requireTenant: RequestHandler = (req, res, next) => {
  if (!req.tenantId) {
    return next(new AppError('Tenant context is required', 400, 'TENANT_REQUIRED'));
  }
  next();
};

/**
 * Get current tenant ID from request
 * Throws if tenant context is not set
 */
export function getCurrentTenantId(req: Request): string {
  if (!req.tenantId) {
    throw new AppError('Tenant context is not set', 400, 'TENANT_NOT_SET');
  }
  return req.tenantId;
}

/**
 * Get current tenant schema name from request
 * Throws if tenant context is not set
 */
export function getCurrentTenantSchema(req: Request): string {
  if (!req.tenantSchema) {
    throw new AppError('Tenant context is not set', 400, 'TENANT_NOT_SET');
  }
  return req.tenantSchema;
}
