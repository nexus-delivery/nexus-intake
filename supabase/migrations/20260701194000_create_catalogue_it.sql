-- Catalogue It: merchant-owned commercial engine
CREATE TABLE IF NOT EXISTS merchant_catalogue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service', 'surcharge', 'labour', 'storage')),
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  default_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  xero_account_code TEXT,
  xero_tax_code TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_catalogue_items_merchant_id
  ON merchant_catalogue_items (merchant_id);

CREATE INDEX IF NOT EXISTS idx_merchant_catalogue_items_active
  ON merchant_catalogue_items (merchant_id, active);

CREATE INDEX IF NOT EXISTS idx_merchant_catalogue_items_search
  ON merchant_catalogue_items (merchant_id, item_type, active, name, sku);

CREATE OR REPLACE FUNCTION update_merchant_catalogue_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merchant_catalogue_items_updated_at ON merchant_catalogue_items;
CREATE TRIGGER merchant_catalogue_items_updated_at
BEFORE UPDATE ON merchant_catalogue_items
FOR EACH ROW
EXECUTE FUNCTION update_merchant_catalogue_items_updated_at();
