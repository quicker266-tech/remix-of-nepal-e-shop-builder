-- Add domain-related columns to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS domain_type TEXT DEFAULT 'path';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMPTZ;

-- Create indexes for fast domain lookups
CREATE INDEX IF NOT EXISTS idx_stores_subdomain ON stores(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_custom_domain ON stores(custom_domain) WHERE custom_domain IS NOT NULL;

-- Backfill: Set subdomain = slug for existing stores
UPDATE stores SET subdomain = slug WHERE subdomain IS NULL;

-- Add comment for domain_type values
COMMENT ON COLUMN stores.domain_type IS 'Values: path | subdomain | custom';