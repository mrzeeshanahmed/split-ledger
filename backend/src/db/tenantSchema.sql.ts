export const getTenantProvisioningSQL = (schemaName: string): string => `
  -- Create isolated schema
  CREATE SCHEMA IF NOT EXISTS "${schemaName}";

  -- 1. users table
  CREATE TABLE IF NOT EXISTS "${schemaName}".users (
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

  CREATE INDEX IF NOT EXISTS idx_users_email ON "${schemaName}".users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON "${schemaName}".users(role);
  CREATE INDEX IF NOT EXISTS idx_users_status ON "${schemaName}".users(status);

  CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON "${schemaName}".users
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();

  -- 2. api_keys table
  CREATE TABLE IF NOT EXISTS "${schemaName}".api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT ARRAY['read']::TEXT[],
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    rate_limit_per_day INTEGER NOT NULL DEFAULT 1000,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT api_keys_name_unique UNIQUE (name),
    CONSTRAINT api_keys_key_prefix_unique UNIQUE (key_prefix),
    CONSTRAINT api_keys_scopes_not_empty CHECK (array_length(scopes, 1) > 0),
    CONSTRAINT api_keys_rate_limits_positive CHECK (rate_limit_per_minute > 0 AND rate_limit_per_day > 0),
    CONSTRAINT api_keys_created_by_fkey FOREIGN KEY (created_by) REFERENCES "${schemaName}".users(id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON "${schemaName}".api_keys(key_prefix);
  CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON "${schemaName}".api_keys(key_hash);
  CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON "${schemaName}".api_keys(is_active);
  CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON "${schemaName}".api_keys(created_by);
  CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON "${schemaName}".api_keys(expires_at);

  CREATE TRIGGER update_api_keys_updated_at
      BEFORE UPDATE ON "${schemaName}".api_keys
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();

  -- 3. api_key_usage table
  CREATE TABLE IF NOT EXISTS "${schemaName}".api_key_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT api_key_usage_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES "${schemaName}".api_keys(id) ON DELETE CASCADE,
    CONSTRAINT api_key_usage_method_valid CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')),
    CONSTRAINT api_key_usage_status_code_valid CHECK (status_code >= 100 AND status_code <= 599),
    CONSTRAINT api_key_usage_response_time_ms_positive CHECK (response_time_ms IS NULL OR response_time_ms >= 0)
  );

  CREATE INDEX IF NOT EXISTS idx_api_key_usage_api_key_id ON "${schemaName}".api_key_usage(api_key_id);
  CREATE INDEX IF NOT EXISTS idx_api_key_usage_created_at ON "${schemaName}".api_key_usage(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_api_key_usage_endpoint ON "${schemaName}".api_key_usage(endpoint);
  CREATE INDEX IF NOT EXISTS idx_api_key_usage_status_code ON "${schemaName}".api_key_usage(status_code);
  CREATE INDEX IF NOT EXISTS idx_api_key_usage_api_key_created_at ON "${schemaName}".api_key_usage(api_key_id, created_at DESC);

  -- 4. usage_records table
  CREATE TABLE IF NOT EXISTS "${schemaName}".usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_cents INTEGER DEFAULT 0,
    total_price_cents INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT usage_records_quantity_positive CHECK (quantity >= 0),
    CONSTRAINT usage_records_unit_price_cents_positive CHECK (unit_price_cents >= 0),
    CONSTRAINT usage_records_total_price_cents_positive CHECK (total_price_cents >= 0)
  );

  CREATE INDEX IF NOT EXISTS idx_usage_records_metric ON "${schemaName}".usage_records(metric);
  CREATE INDEX IF NOT EXISTS idx_usage_records_recorded_at ON "${schemaName}".usage_records(recorded_at DESC);
  CREATE INDEX IF NOT EXISTS idx_usage_records_metric_recorded_at ON "${schemaName}".usage_records(metric, recorded_at DESC);

  -- 5. webhooks table
  CREATE TABLE IF NOT EXISTS "${schemaName}".webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url VARCHAR(2048) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    description VARCHAR(255),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT webhooks_url_not_empty CHECK (char_length(url) > 0),
    CONSTRAINT webhooks_secret_not_empty CHECK (char_length(secret) > 0),
    CONSTRAINT webhooks_created_by_fkey FOREIGN KEY (created_by) REFERENCES "${schemaName}".users(id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON "${schemaName}".webhooks(is_active);
  CREATE INDEX IF NOT EXISTS idx_webhooks_created_by ON "${schemaName}".webhooks(created_by);

  CREATE TRIGGER update_webhooks_updated_at
      BEFORE UPDATE ON "${schemaName}".webhooks
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();

  -- 6. webhook_deliveries table
  CREATE TABLE IF NOT EXISTS "${schemaName}".webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES "${schemaName}".webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempt_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    last_response_status INTEGER,
    last_response_body TEXT,
    last_error TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT webhook_deliveries_status_valid CHECK (status IN ('pending', 'success', 'failed', 'dead'))
  );

  CREATE INDEX IF NOT EXISTS idx_deliveries_webhook_id ON "${schemaName}".webhook_deliveries(webhook_id);
  CREATE INDEX IF NOT EXISTS idx_deliveries_status ON "${schemaName}".webhook_deliveries(status);
  CREATE INDEX IF NOT EXISTS idx_deliveries_next_retry ON "${schemaName}".webhook_deliveries(next_retry_at) WHERE status = 'pending';
`;
