BEGIN;

DROP TRIGGER IF EXISTS update_business_settings_updated_at_trigger ON business_settings;

DROP FUNCTION IF EXISTS update_business_settings_updated_at();

DROP TABLE IF EXISTS business_settings CASCADE;

COMMIT;
