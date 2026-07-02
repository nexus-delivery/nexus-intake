-- Integrate-it: provider catalog + merchant-scoped connections

CREATE TABLE IF NOT EXISTS integration_providers (
  provider_key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  capabilities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_providers_category
  ON integration_providers (category, sort_order, display_name);

CREATE OR REPLACE FUNCTION update_integration_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS integration_providers_updated_at
  ON integration_providers;

CREATE TRIGGER integration_providers_updated_at
BEFORE UPDATE ON integration_providers
FOR EACH ROW
EXECUTE FUNCTION update_integration_providers_updated_at();

CREATE TABLE IF NOT EXISTS merchant_integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  provider_key TEXT NOT NULL REFERENCES integration_providers(provider_key),
  connected BOOLEAN NOT NULL DEFAULT FALSE,
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  credentials_ciphertext TEXT,
  credentials_iv TEXT,
  credentials_tag TEXT,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synchronised_at TIMESTAMPTZ,
  last_tested_at TIMESTAMPTZ,
  last_error TEXT,
  created_by_user_id UUID,
  updated_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, provider_key)
);

CREATE INDEX IF NOT EXISTS idx_merchant_integrations_company
  ON merchant_integration_connections (company_id, provider_key);

CREATE INDEX IF NOT EXISTS idx_merchant_integrations_connected
  ON merchant_integration_connections (company_id, connected);

CREATE OR REPLACE FUNCTION update_merchant_integration_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merchant_integration_connections_updated_at
  ON merchant_integration_connections;

CREATE TRIGGER merchant_integration_connections_updated_at
BEFORE UPDATE ON merchant_integration_connections
FOR EACH ROW
EXECUTE FUNCTION update_merchant_integration_connections_updated_at();

INSERT INTO integration_providers (provider_key, category, display_name, capabilities, sort_order)
VALUES
  ('xero', 'accounting', 'Xero', ARRAY['invoice_export'], 10),
  ('quickfile', 'accounting', 'QuickFile', ARRAY['invoice_export'], 20),
  ('quickbooks', 'accounting', 'QuickBooks', ARRAY['invoice_export'], 30),
  ('sage', 'accounting', 'Sage', ARRAY['invoice_export'], 40),
  ('freeagent', 'accounting', 'FreeAgent', ARRAY['invoice_export'], 50),
  ('kashflow', 'accounting', 'KashFlow', ARRAY['invoice_export'], 60),
  ('woocommerce', 'commerce', 'WooCommerce', ARRAY['order_ingest'], 10),
  ('shopify', 'commerce', 'Shopify', ARRAY['order_ingest'], 20),
  ('magento', 'commerce', 'Magento', ARRAY['order_ingest'], 30),
  ('bigcommerce', 'commerce', 'BigCommerce', ARRAY['order_ingest'], 40),
  ('amazon', 'commerce', 'Amazon', ARRAY['order_ingest'], 50),
  ('ebay', 'commerce', 'eBay', ARRAY['order_ingest'], 60),
  ('trackpod', 'operations', 'Track-POD', ARRAY['operational_execution'], 10),
  ('circleloop', 'communications', 'CircleLoop', ARRAY['customer_communications'], 5),
  ('resend', 'communications', 'Resend', ARRAY['customer_notifications'], 10),
  ('twilio', 'communications', 'Twilio', ARRAY['customer_notifications'], 20),
  ('stripe', 'payments', 'Stripe', ARRAY['payment_collection'], 10),
  ('paypal', 'payments', 'PayPal', ARRAY['payment_collection'], 20),
  ('gocardless', 'payments', 'GoCardless', ARRAY['payment_collection'], 30),
  ('sumup', 'payments', 'SumUp', ARRAY['payment_collection'], 40)
ON CONFLICT (provider_key) DO UPDATE
SET
  category = EXCLUDED.category,
  display_name = EXCLUDED.display_name,
  capabilities = EXCLUDED.capabilities,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  updated_at = NOW();

NOTIFY pgrst, 'reload schema';
