-- =============================================================================
-- Table: business_settings
-- Purpose: Per-user business settings for estimate/invoice configuration.
-- =============================================================================

CREATE TABLE business_settings (
  user_id UUID PRIMARY KEY,
  base_currency CHAR(3) NOT NULL DEFAULT 'USD',
  show_base_currency_equivalent BOOLEAN NOT NULL DEFAULT false,
  per_currency_tax_rate BOOLEAN NOT NULL DEFAULT false,
  per_currency_tax_rates JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user-scoped queries
CREATE INDEX idx_business_settings_user_id ON business_settings(user_id);

-- Function + trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_business_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_settings_updated_at_trigger
  BEFORE UPDATE ON business_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_business_settings_updated_at();
