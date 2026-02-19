-- Migration: 003_create_tenant_schema_template
-- Created at: 2025-01-26

-- UP
-- Create tenant_template schema
CREATE SCHEMA IF NOT EXISTS tenant_template;

-- Create users table in tenant_template schema
CREATE TABLE IF NOT EXISTS tenant_template.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login_at TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON tenant_template.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON tenant_template.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON tenant_template.users(status);

-- Create trigger for users updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON tenant_template.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- DOWN
DROP TRIGGER IF EXISTS update_users_updated_at ON tenant_template.users;
DROP TABLE IF EXISTS tenant_template.users;
DROP SCHEMA IF EXISTS tenant_template;