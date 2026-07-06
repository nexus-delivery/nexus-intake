-- Organisation foundation for the NEXUS SaaS platform.
-- This keeps the current company-scoped app working while promoting
-- organisations to the canonical tenant root.

CREATE TABLE IF NOT EXISTS public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  trading_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  source_system TEXT NOT NULL DEFAULT 'seed',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organisation_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (
    role IN (
      'super_admin',
      'company_admin',
      'operations_admin',
      'operations',
      'merchant_user',
      'driver',
      'customer',
      'viewer'
    )
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'disabled')),
  source_system TEXT NOT NULL DEFAULT 'app',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, user_id)
);

DROP TRIGGER IF EXISTS organisations_set_updated_at ON public.organisations;
CREATE TRIGGER organisations_set_updated_at
BEFORE UPDATE ON public.organisations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS organisation_users_set_updated_at ON public.organisation_users;
CREATE TRIGGER organisation_users_set_updated_at
BEFORE UPDATE ON public.organisation_users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE public.uploaded_documents
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE public.draft_jobs
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE public.merchant_customers
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE public.merchant_customer_invitations
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE public.merchant_price_it_commercial
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.merchant_collection_profiles
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE public.sales_channels
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.notify_it_conversations
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.discuss_it_timeline
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.operations_notifications
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.model_it_workspaces
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.model_it_artifacts
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.model_it_artifact_versions
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.model_it_audit_log
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.document_timeline
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.document_extracted_fields
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

ALTER TABLE IF EXISTS public.document_ai_runs
  ADD COLUMN IF NOT EXISTS organisation_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'app';

CREATE INDEX IF NOT EXISTS idx_organisations_slug ON public.organisations (slug);
CREATE INDEX IF NOT EXISTS idx_organisation_users_organisation_id ON public.organisation_users (organisation_id);
CREATE INDEX IF NOT EXISTS idx_organisation_users_user_id ON public.organisation_users (user_id);
CREATE INDEX IF NOT EXISTS idx_companies_organisation_id ON public.companies (organisation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organisation_id ON public.profiles (organisation_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_organisation_id ON public.uploaded_documents (organisation_id);
CREATE INDEX IF NOT EXISTS idx_draft_jobs_organisation_id ON public.draft_jobs (organisation_id);
CREATE INDEX IF NOT EXISTS idx_customers_organisation_id ON public.customers (organisation_id);
CREATE INDEX IF NOT EXISTS idx_merchant_customers_organisation_id ON public.merchant_customers (organisation_id);
CREATE INDEX IF NOT EXISTS idx_merchant_customer_invitations_organisation_id ON public.merchant_customer_invitations (organisation_id);
CREATE INDEX IF NOT EXISTS idx_merchant_price_it_commercial_organisation_id ON public.merchant_price_it_commercial (organisation_id);
CREATE INDEX IF NOT EXISTS idx_sales_channels_organisation_id ON public.sales_channels (organisation_id);

UPDATE public.companies
SET organisation_id = COALESCE(organisation_id, id)
WHERE organisation_id IS NULL;

UPDATE public.profiles
SET organisation_id = COALESCE(organisation_id, company_id)
WHERE organisation_id IS NULL;

UPDATE public.uploaded_documents
SET organisation_id = COALESCE(organisation_id, company_id)
WHERE organisation_id IS NULL;

UPDATE public.draft_jobs
SET organisation_id = COALESCE(organisation_id, company_id)
WHERE organisation_id IS NULL;

UPDATE public.customers
SET organisation_id = COALESCE(organisation_id, company_id)
WHERE organisation_id IS NULL;

UPDATE public.merchant_customers
SET organisation_id = COALESCE(organisation_id, company_id)
WHERE organisation_id IS NULL;

UPDATE public.merchant_customer_invitations
SET organisation_id = COALESCE(organisation_id, company_id)
WHERE organisation_id IS NULL;

UPDATE public.merchant_price_it_commercial
SET organisation_id = COALESCE(organisation_id, merchant_id)
WHERE organisation_id IS NULL;

UPDATE public.sales_channels
SET organisation_id = COALESCE(organisation_id, company_id)
WHERE organisation_id IS NULL;

UPDATE public.organisations o
SET name = c.name,
    trading_name = c.trading_name,
    status = COALESCE(c.status, 'active'),
    source_system = COALESCE(c.source_system, 'legacy'),
    created_by = NULL
FROM public.companies c
WHERE c.organisation_id = o.id;

INSERT INTO public.organisations (slug, name, trading_name, status, source_system)
VALUES
  ('nexus-delivery-solutions', 'Nexus Delivery Solutions', 'Nexus Delivery Solutions', 'active', 'seed'),
  ('the-home-delivery-guys', 'The Home Delivery Guys', 'The Home Delivery Guys', 'active', 'seed')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    trading_name = EXCLUDED.trading_name,
    status = EXCLUDED.status,
    source_system = EXCLUDED.source_system,
    updated_at = NOW();

CREATE OR REPLACE FUNCTION public.sync_organisation_company_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.organisation_id := COALESCE(NEW.organisation_id, NEW.company_id, NEW.id);
  NEW.company_id := COALESCE(NEW.company_id, NEW.organisation_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_company_organisation_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.organisation_id := COALESCE(NEW.organisation_id, NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_merchant_price_organisation_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.organisation_id := COALESCE(NEW.organisation_id, NEW.merchant_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_company_to_organisation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organisations (id, slug, name, trading_name, status, source_system, created_by)
  VALUES (
    NEW.organisation_id,
    COALESCE(NULLIF(lower(regexp_replace(COALESCE(NEW.trading_name, NEW.name), '[^a-zA-Z0-9]+', '-', 'g')), ''), 'company-' || substr(NEW.id::text, 1, 8)),
    NEW.name,
    NEW.trading_name,
    COALESCE(NEW.status, 'active'),
    COALESCE(NEW.source_system, 'legacy'),
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      trading_name = EXCLUDED.trading_name,
      status = EXCLUDED.status,
      source_system = EXCLUDED.source_system,
      updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_organisation_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_organisation_id UUID;
BEGIN
  resolved_organisation_id := COALESCE(NEW.organisation_id, NEW.company_id);
  NEW.organisation_id := resolved_organisation_id;
  NEW.company_id := COALESCE(NEW.company_id, resolved_organisation_id);

  IF resolved_organisation_id IS NOT NULL AND NEW.auth_user_id IS NOT NULL THEN
    INSERT INTO public.organisation_users (organisation_id, user_id, role, status, source_system, created_by)
    VALUES (
      resolved_organisation_id,
      NEW.auth_user_id,
      COALESCE(NULLIF(lower(NEW.role), ''), 'viewer'),
      COALESCE(NEW.status, 'active'),
      COALESCE(NEW.source_system, 'app'),
      NEW.auth_user_id
    )
    ON CONFLICT (organisation_id, user_id) DO UPDATE
    SET status = EXCLUDED.status,
      role = EXCLUDED.role,
        source_system = EXCLUDED.source_system,
        updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles',
    'uploaded_documents',
    'draft_jobs',
    'customers',
    'merchant_customers',
    'merchant_customer_invitations',
    'sales_channels',
    'merchant_collection_profiles',
    'notify_it_conversations',
    'discuss_it_timeline',
    'operations_notifications',
    'model_it_workspaces',
    'model_it_artifacts',
    'model_it_artifact_versions',
    'model_it_audit_log',
    'document_timeline',
    'document_extracted_fields',
    'document_ai_runs'
  ] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I_sync_org_ids ON public.%I', table_name, table_name);
      EXECUTE format('CREATE TRIGGER %I_sync_org_ids BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.sync_organisation_company_ids()', table_name, table_name);
    END IF;
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS companies_sync_org_id ON public.companies;
CREATE TRIGGER companies_sync_org_id
BEFORE INSERT OR UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.sync_company_organisation_id();

DROP TRIGGER IF EXISTS merchant_price_it_commercial_sync_org_id ON public.merchant_price_it_commercial;
CREATE TRIGGER merchant_price_it_commercial_sync_org_id
BEFORE INSERT OR UPDATE ON public.merchant_price_it_commercial
FOR EACH ROW
EXECUTE FUNCTION public.sync_merchant_price_organisation_id();

DROP TRIGGER IF EXISTS companies_sync_organisation ON public.companies;
CREATE TRIGGER companies_sync_organisation
AFTER INSERT OR UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.sync_company_to_organisation();

DROP TRIGGER IF EXISTS profiles_sync_organisation_membership ON public.profiles;
CREATE TRIGGER profiles_sync_organisation_membership
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_organisation_membership();

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND lower(COALESCE(p.role, '')) IN ('super_admin', 'platform_admin', 'admin', 'owner')
  )
  OR EXISTS (
    SELECT 1
    FROM public.organisation_users ou
    WHERE ou.user_id = auth.uid()
      AND lower(ou.role) = 'super_admin'
      AND ou.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_organisation(target_organisation_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND COALESCE(p.organisation_id, p.company_id) = target_organisation_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.organisation_users ou
    WHERE ou.user_id = auth.uid()
      AND ou.organisation_id = target_organisation_id
      AND ou.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_organisation(target_organisation_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND COALESCE(p.organisation_id, p.company_id) = target_organisation_id
      AND lower(COALESCE(p.role, '')) IN ('company_admin', 'operations_admin', 'operations', 'super_admin', 'platform_admin', 'admin', 'owner')
  )
  OR EXISTS (
    SELECT 1
    FROM public.organisation_users ou
    WHERE ou.user_id = auth.uid()
      AND ou.organisation_id = target_organisation_id
      AND ou.status = 'active'
      AND lower(ou.role) IN ('company_admin', 'operations_admin', 'operations', 'super_admin')
  );
$$;

DROP POLICY IF EXISTS organisations_select_own ON public.organisations;
CREATE POLICY organisations_select_own
ON public.organisations
FOR SELECT
USING (public.can_access_organisation(id));

DROP POLICY IF EXISTS organisations_write_manage ON public.organisations;
CREATE POLICY organisations_write_manage
ON public.organisations
FOR INSERT
WITH CHECK (public.can_manage_organisation(id));

DROP POLICY IF EXISTS organisations_update_manage ON public.organisations;
CREATE POLICY organisations_update_manage
ON public.organisations
FOR UPDATE
USING (public.can_manage_organisation(id))
WITH CHECK (public.can_manage_organisation(id));

DROP POLICY IF EXISTS organisation_users_select_own ON public.organisation_users;
CREATE POLICY organisation_users_select_own
ON public.organisation_users
FOR SELECT
USING (public.can_access_organisation(organisation_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS organisation_users_write_manage ON public.organisation_users;
CREATE POLICY organisation_users_write_manage
ON public.organisation_users
FOR INSERT
WITH CHECK (public.can_manage_organisation(organisation_id));

DROP POLICY IF EXISTS organisation_users_update_manage ON public.organisation_users;
CREATE POLICY organisation_users_update_manage
ON public.organisation_users
FOR UPDATE
USING (public.can_manage_organisation(organisation_id))
WITH CHECK (public.can_manage_organisation(organisation_id));

DROP POLICY IF EXISTS organisation_users_delete_manage ON public.organisation_users;
CREATE POLICY organisation_users_delete_manage
ON public.organisation_users
FOR DELETE
USING (public.can_manage_organisation(organisation_id));

INSERT INTO storage.buckets (id, name, public)
VALUES ('merchant-documents', 'merchant-documents', FALSE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS merchant_documents_select_org ON storage.objects;
CREATE POLICY merchant_documents_select_org
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'merchant-documents'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND split_part(name, '/', 1) = COALESCE(p.organisation_id::TEXT, p.company_id::TEXT)
  )
);

DROP POLICY IF EXISTS merchant_documents_write_org ON storage.objects;
CREATE POLICY merchant_documents_write_org
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'merchant-documents'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND split_part(name, '/', 1) = COALESCE(p.organisation_id::TEXT, p.company_id::TEXT)
  )
);

DROP POLICY IF EXISTS merchant_documents_update_org ON storage.objects;
CREATE POLICY merchant_documents_update_org
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'merchant-documents'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND split_part(name, '/', 1) = COALESCE(p.organisation_id::TEXT, p.company_id::TEXT)
  )
)
WITH CHECK (
  bucket_id = 'merchant-documents'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND split_part(name, '/', 1) = COALESCE(p.organisation_id::TEXT, p.company_id::TEXT)
  )
);

DROP POLICY IF EXISTS merchant_documents_delete_org ON storage.objects;
CREATE POLICY merchant_documents_delete_org
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'merchant-documents'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND split_part(name, '/', 1) = COALESCE(p.organisation_id::TEXT, p.company_id::TEXT)
  )
);

ALTER TABLE public.organisations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_users FORCE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisations, public.organisation_users TO authenticated;
GRANT ALL ON public.organisations, public.organisation_users TO service_role;

NOTIFY pgrst, 'reload schema';