-- Merchant goods catalogue for learned goods descriptions from bookings
CREATE TABLE IF NOT EXISTS merchant_goods_catalogue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  raw_description TEXT NOT NULL,
  normalised_description TEXT NOT NULL,
  product_code TEXT,
  first_seen_order_id UUID NOT NULL,
  last_seen_order_id UUID NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_goods_catalogue_unique
  ON merchant_goods_catalogue (
    merchant_id,
    normalised_description,
    COALESCE(product_code, '')
  );

CREATE INDEX IF NOT EXISTS idx_merchant_goods_catalogue_merchant_id
  ON merchant_goods_catalogue (merchant_id);

CREATE OR REPLACE FUNCTION update_merchant_goods_catalogue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merchant_goods_catalogue_updated_at ON merchant_goods_catalogue;
CREATE TRIGGER merchant_goods_catalogue_updated_at
BEFORE UPDATE ON merchant_goods_catalogue
FOR EACH ROW
EXECUTE FUNCTION update_merchant_goods_catalogue_updated_at();
