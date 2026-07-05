-- Core schema bootstrap for environments that only have auth/storage schemas.
-- This migration is intentionally idempotent.

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trading_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  business_type TEXT
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  full_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'company_admin' CHECK (role IN ('super_admin', 'company_admin', 'operations', 'customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.uploaded_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  merchant_id UUID,
  customer_id UUID,
  order_id UUID,
  consignment_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  document_type TEXT NOT NULL DEFAULT 'delivery_note' CHECK (document_type IN ('delivery_note', 'purchase_order', 'invoice', 'manifest', 'label', 'other')),
  extracted_text TEXT,
  extracted_data JSONB,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'extracted', 'needs_review', 'confirmed', 'failed')),
  error_message TEXT,
  created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_size BIGINT,
  ai_status TEXT DEFAULT 'pending',
  ai_error TEXT,
  ai_confidence NUMERIC,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles (company_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_company_id ON public.uploaded_documents (company_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_status ON public.uploaded_documents (status);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_document_type ON public.uploaded_documents (document_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_created_at ON public.uploaded_documents (created_at);

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS companies_set_updated_at ON public.companies;
CREATE TRIGGER companies_set_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS uploaded_documents_set_updated_at ON public.uploaded_documents;
CREATE TRIGGER uploaded_documents_set_updated_at
BEFORE UPDATE ON public.uploaded_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_select_by_profile ON public.companies;
CREATE POLICY companies_select_by_profile
ON public.companies
FOR SELECT
USING (
  id IN (
    SELECT company_id
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS companies_insert_authenticated ON public.companies;
CREATE POLICY companies_insert_authenticated
ON public.companies
FOR INSERT
WITH CHECK (TRUE);

DROP POLICY IF EXISTS companies_update_by_profile ON public.companies;
CREATE POLICY companies_update_by_profile
ON public.companies
FOR UPDATE
USING (
  id IN (
    SELECT company_id
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT company_id
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS profiles_select_self_or_same_company ON public.profiles;
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
CREATE POLICY profiles_select_self
ON public.profiles
FOR SELECT
USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self
ON public.profiles
FOR INSERT
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self
ON public.profiles
FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS uploaded_documents_company_scope_read ON public.uploaded_documents;
CREATE POLICY uploaded_documents_company_scope_read
ON public.uploaded_documents
FOR SELECT
USING (
  company_id IN (
    SELECT company_id
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS uploaded_documents_company_scope_write ON public.uploaded_documents;
CREATE POLICY uploaded_documents_company_scope_write
ON public.uploaded_documents
FOR ALL
USING (
  company_id IN (
    SELECT company_id
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
  )
);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.companies, public.profiles, public.uploaded_documents TO authenticated;
GRANT INSERT, UPDATE ON public.companies, public.profiles, public.uploaded_documents TO authenticated;
GRANT ALL ON public.companies, public.profiles, public.uploaded_documents TO service_role;

NOTIFY pgrst, 'reload schema';