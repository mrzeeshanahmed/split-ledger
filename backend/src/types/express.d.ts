import 'express';

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
    }
  }
}
