export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  status: TenantStatus;
  stripe_customer_id: string | null;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  billing_email: string | null;
  owner_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export type TenantStatus = 'active' | 'suspended' | 'archived';

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface CreateTenantInput {
  name: string;
  subdomain: string;
  custom_domain?: string;
  owner_email: string;
  owner_password: string;
  owner_first_name: string;
  owner_last_name: string;
  billing_email?: string;
}

export interface TenantWithOwner extends Tenant {
  owner: User;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  last_login_at: Date | null;
  email_verified: boolean;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface TenantProvisioningResult {
  tenant: Tenant;
  owner: User;
  schema_name: string;
}

export class TenantError extends Error {
  constructor(
    message: string,
    public readonly code: TenantErrorCode,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'TenantError';
  }
}

export type TenantErrorCode =
  | 'RESERVED_SUBDOMAIN'
  | 'DUPLICATE_SUBDOMAIN'
  | 'DUPLICATE_CUSTOM_DOMAIN'
  | 'SUBDOMAIN_INVALID'
  | 'TENANT_NOT_FOUND'
  | 'PROVISIONING_FAILED'
  | 'SCHEMA_CREATION_FAILED';

export const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'mail',
  'ftp',
  'localhost',
  'app',
  'staging',
  'dev',
  'test',
];

export const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;