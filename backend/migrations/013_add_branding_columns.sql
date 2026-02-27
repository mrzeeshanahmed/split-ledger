-- 013: Add branding columns to tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#4F46E5',
  ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#7C3AED',
  ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_custom_domain
  ON tenants(custom_domain)
  WHERE custom_domain IS NOT NULL;
