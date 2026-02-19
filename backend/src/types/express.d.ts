import 'express';
import type { ApiKeyScope } from './apiKey.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      tenantId?: string;
      tenantSchema?: string;
      tenant?: any;
      userId?: string;
      user?: {
        id: string;
        email: string;
        role: string;
        tenantId: string;
      };
      apiKey?: {
        id: string;
        scopes: ApiKeyScope[];
        tenantId: string;
        rateLimitPerMinute: number;
        rateLimitPerDay: number;
      };
    }
  }
}
