-- Migration: 002_create_tenants
-- Created at: 2025-01-26

-- UP
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  stripe_customer_id TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'unpaid')),
  billing_email TEXT,
  owner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id ON tenants(stripe_customer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tenants
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert reserved subdomains
INSERT INTO tenants (name, subdomain, status, subscription_plan, subscription_status)
VALUES 
  ('Reserved', 'www', 'suspended', 'free', 'canceled'),
  ('Reserved', 'api', 'suspended', 'free', 'canceled'),
  ('Reserved', 'admin', 'suspended', 'free', 'canceled'),
  ('Reserved', 'mail', 'suspended', 'free', 'canceled'),
  ('Reserved', 'ftp', 'suspended', 'free', 'canceled'),
  ('Reserved', 'localhost', 'suspended', 'free', 'canceled'),
  ('Reserved', 'app', 'suspended', 'free', 'canceled'),
  ('Reserved', 'staging', 'suspended', 'free', 'canceled'),
  ('Reserved', 'dev', 'suspended', 'free', 'canceled'),
  ('Reserved', 'test', 'suspended', 'free', 'canceled')
ON CONFLICT (subdomain) DO NOTHING;

-- DOWN
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP INDEX IF EXISTS idx_tenants_stripe_customer_id;
DROP INDEX IF EXISTS idx_tenants_status;
DROP INDEX IF EXISTS idx_tenants_custom_domain;
DROP INDEX IF EXISTS idx_tenants_subdomain;
DROP TABLE IF EXISTS tenants;