-- Align sales_channels with company-scoped model.
-- Current model: id, company_id, name, code, active, created_at

ALTER TABLE IF EXISTS sales_channels
  ADD COLUMN IF NOT EXISTS code TEXT;

UPDATE sales_channels
SET code = NULLIF(
  BTRIM(
    REGEXP_REPLACE(UPPER(TRIM(name)), '[^A-Z0-9]+', '_', 'g'),
    '_'
  ),
  ''
)
WHERE COALESCE(code, '') = '';

ALTER TABLE IF EXISTS sales_channels
  ALTER COLUMN code SET NOT NULL;

ALTER TABLE IF EXISTS sales_channels
  DROP COLUMN IF EXISTS merchant_id,
  DROP COLUMN IF EXISTS source_type,
  DROP COLUMN IF EXISTS updated_at;

DROP TRIGGER IF EXISTS sales_channels_updated_at ON sales_channels;
DROP FUNCTION IF EXISTS update_sales_channels_updated_at();

DROP INDEX IF EXISTS idx_sales_channels_company_merchant_active;
DROP INDEX IF EXISTS idx_sales_channels_unique_name;

CREATE INDEX IF NOT EXISTS idx_sales_channels_company_active
  ON sales_channels (company_id, active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_channels_unique_name
  ON sales_channels (company_id, lower(name));
