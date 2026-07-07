BEGIN;

CREATE TABLE IF NOT EXISTS business_settings (
  user_id UUID PRIMARY KEY,
  base_currency CHAR(3) NOT NULL DEFAULT 'USD',
  show_base_currency_equivalent BOOLEAN NOT NULL DEFAULT false,
  per_currency_tax_rate BOOLEAN NOT NULL DEFAULT false,
  per_currency_tax_rates JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON business_settings(user_id);

CREATE OR REPLACE FUNCTION update_business_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_business_settings_updated_at_trigger ON business_settings;

CREATE TRIGGER update_business_settings_updated_at_trigger
  BEFORE UPDATE ON business_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_business_settings_updated_at();

COMMIT;
