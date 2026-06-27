-- customers table for customer auth/onboarding
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_logo_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  business_type TEXT CHECK (business_type IN ('merchant', 'shipper', 'logistics_partner', 'other')),
  business_address TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_onboarding_requires_fields CHECK (
    onboarding_complete = FALSE
    OR (
      company_name IS NOT NULL
      AND company_name <> ''
      AND company_logo_url IS NOT NULL
      AND company_logo_url <> ''
      AND contact_name IS NOT NULL
      AND contact_name <> ''
      AND contact_email IS NOT NULL
      AND contact_email <> ''
      AND contact_phone IS NOT NULL
      AND contact_phone <> ''
      AND business_type IS NOT NULL
      AND business_address IS NOT NULL
      AND business_address <> ''
      AND terms_accepted = TRUE
    )
  )
);

CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_customers_updated_at();

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own customer record" ON customers;
CREATE POLICY "Users can read own customer record"
ON customers
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own customer record" ON customers;
CREATE POLICY "Users can insert own customer record"
ON customers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own customer record" ON customers;
CREATE POLICY "Users can update own customer record"
ON customers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public can view company logos" ON storage.objects;
CREATE POLICY "Public can view company logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Users can upload own company logo" ON storage.objects;
CREATE POLICY "Users can upload own company logo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own company logo" ON storage.objects;
CREATE POLICY "Users can update own company logo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own company logo" ON storage.objects;
CREATE POLICY "Users can delete own company logo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
