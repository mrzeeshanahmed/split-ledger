import { describe, it, expect, beforeAll, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { tenantContextMiddleware, requireTenant, getCurrentTenantId, getCurrentTenantSchema } from '../../src/middleware/tenantContext.js';
import { TenantProvisioningService } from '../../src/services/tenantProvisioning.js';

// Mock dependencies
vi.mock('../../src/services/tenantProvisioning.js', () => ({
  TenantProvisioningService: {
    getTenant: vi.fn(),
    getTenantBySubdomain: vi.fn(),
  },
}));

vi.mock('../../src/db/index.js', () => ({
  query: vi.fn(),
}));

describe('Tenant Context Middleware', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRequest: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockResponse: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nextFunction: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: vi.fn(),
    };
    nextFunction = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('tenantContextMiddleware', () => {
    it('should call next without setting tenant if no identifier found', async () => {
      const middleware = tenantContextMiddleware();

      await middleware(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.tenantId).toBeUndefined();
      expect(mockRequest.tenant).toBeUndefined();
    });

    it('should set tenant from X-Tenant-ID header', async () => {
      const mockTenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Tenant',
        subdomain: 'test',
        status: 'active' as const,
      };

      vi.mocked(TenantProvisioningService.getTenant).mockResolvedValue(mockTenant as any);

      mockRequest.headers = {
        'x-tenant-id': mockTenant.id,
      };

      const middleware = tenantContextMiddleware();

      await middleware(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(TenantProvisioningService.getTenant).toHaveBeenCalledWith(mockTenant.id);
      expect(mockRequest.tenantId).toBe(mockTenant.id);
      expect(mockRequest.tenant).toEqual(mockTenant);
      expect(mockRequest.tenantSchema).toBe(`tenant_${mockTenant.id.replace(/-/g, '')}`);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should set tenant from X-Tenant-Subdomain header', async () => {
      const mockTenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Tenant',
        subdomain: 'acme',
        status: 'active' as const,
      };

      vi.mocked(TenantProvisioningService.getTenantBySubdomain).mockResolvedValue(mockTenant as any);

      mockRequest.headers = {
        'x-tenant-subdomain': 'acme',
      };

      const middleware = tenantContextMiddleware({ extractFromSubdomainHeader: true });

      await middleware(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(TenantProvisioningService.getTenantBySubdomain).toHaveBeenCalledWith('acme');
      expect(mockRequest.tenantId).toBe(mockTenant.id);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should extract tenant from subdomain in Host header', async () => {
      const mockTenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Tenant',
        subdomain: 'acme',
        status: 'active' as const,
      };

      vi.mocked(TenantProvisioningService.getTenantBySubdomain).mockResolvedValue(mockTenant as any);

      mockRequest.headers = {
        host: 'acme.example.com:3000',
      };

      const middleware = tenantContextMiddleware({ extractFromSubdomain: true });

      await middleware(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(TenantProvisioningService.getTenantBySubdomain).toHaveBeenCalledWith('acme');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should not extract subdomain from localhost', async () => {
      mockRequest.headers = {
        host: 'localhost:3000',
      };

      const middleware = tenantContextMiddleware();

      await middleware(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(TenantProvisioningService.getTenantBySubdomain).not.toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject suspended tenant', async () => {
      const mockTenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Suspended Tenant',
        subdomain: 'suspended',
        status: 'suspended' as const,
      };

      vi.mocked(TenantProvisioningService.getTenant).mockResolvedValue(mockTenant as any);

      mockRequest.headers = {
        'x-tenant-id': mockTenant.id,
      };

      const middleware = tenantContextMiddleware();

      await middleware(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AppError',
          message: 'Tenant is suspended. Please contact support.',
        })
      );
    });

    it('should reject archived tenant', async () => {
      const mockTenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Archived Tenant',
        subdomain: 'archived',
        status: 'archived' as const,
      };

      vi.mocked(TenantProvisioningService.getTenant).mockResolvedValue(mockTenant as any);

      mockRequest.headers = {
        'x-tenant-id': mockTenant.id,
      };

      const middleware = tenantContextMiddleware();

      await middleware(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AppError',
          message: 'Tenant is archived. Please contact support.',
        })
      );
    });

    it('should throw error when tenant not found and required is true', async () => {
      vi.mocked(TenantProvisioningService.getTenant).mockResolvedValue(null as any);

      mockRequest.headers = {
        'x-tenant-id': '00000000-0000-0000-0000-000000000000',
      };

      const middleware = tenantContextMiddleware({ required: true });

      await middleware(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AppError',
          message: 'Tenant not found',
        })
      );
    });

    it('should prioritize X-Tenant-ID over subdomain', async () => {
      const mockTenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'By ID',
        subdomain: 'byid',
        status: 'active' as const,
      };

      vi.mocked(TenantProvisioningService.getTenant).mockResolvedValue(mockTenant as any);

      mockRequest.headers = {
        host: 'acme.example.com',
        'x-tenant-id': mockTenant.id,
      };

      const middleware = tenantContextMiddleware();

      await middleware(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(TenantProvisioningService.getTenant).toHaveBeenCalledWith(mockTenant.id);
      expect(TenantProvisioningService.getTenantBySubdomain).not.toHaveBeenCalled();
    });

    it('should handle missing tenant when required is false', async () => {
      mockRequest.headers = {
        'x-tenant-id': '00000000-0000-0000-0000-000000000000',
      };

      vi.mocked(TenantProvisioningService.getTenant).mockResolvedValue(null as any);

      const middleware = tenantContextMiddleware({ required: false });

      await middleware(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.tenantId).toBeUndefined();
    });
  });

  describe('requireTenant', () => {
    it('should call next if tenantId is present', () => {
      mockRequest.tenantId = '123e4567-e89b-12d3-a456-426614174000';

      requireTenant(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next with error if tenantId is missing', () => {
      requireTenant(
        mockRequest,
        mockResponse,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AppError',
          message: 'Tenant context is required',
        })
      );
    });
  });

  describe('getCurrentTenantId', () => {
    it('should return tenantId if present', () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.tenantId = tenantId;

      expect(getCurrentTenantId(mockRequest)).toBe(tenantId);
    });

    it('should throw if tenantId is not set', () => {
      expect(() => getCurrentTenantId(mockRequest)).toThrow(
        expect.objectContaining({
          name: 'AppError',
          message: 'Tenant context is not set',
        })
      );
    });
  });

  describe('getCurrentTenantSchema', () => {
    it('should return tenantSchema if present', () => {
      const schema = 'tenant_123e4567e89b12d3a456426614174000';
      mockRequest.tenantSchema = schema;

      expect(getCurrentTenantSchema(mockRequest)).toBe(schema);
    });

    it('should throw if tenantSchema is not set', () => {
      expect(() => getCurrentTenantSchema(mockRequest)).toThrow(
        expect.objectContaining({
          name: 'AppError',
          message: 'Tenant context is not set',
        })
      );
    });
  });
});
