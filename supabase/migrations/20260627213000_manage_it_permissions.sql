CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_admin_bootstrap (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON public.audit_log (action);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx ON public.role_permissions (permission_id);

INSERT INTO public.platform_admin_bootstrap (email)
VALUES ('office@nexus.delivery')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.roles (slug, name, description)
VALUES
  ('super_admin', 'Super Admin', 'Platform operators with full NEXUS Operations Centre access.'),
  ('company_admin', 'Company Admin', 'Company-level operators with tenant-scoped access.'),
  ('user', 'User', 'Standard NEXUS user with least-privilege access.'),
  ('planner', 'Planner', 'Future route planning role.'),
  ('driver', 'Driver', 'Future delivery execution role.'),
  ('warehouse_operative', 'Warehouse Operative', 'Future warehouse operations role.'),
  ('customer_service', 'Customer Service', 'Future customer service role.'),
  ('finance', 'Finance', 'Future finance operations role.'),
  ('read_only_customer', 'Read-only Customer', 'Future customer observer role.'),
  ('api_user', 'API User', 'Future programmatic integration role.')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO public.permissions (slug, description, category)
VALUES
  ('view:manage_it', 'Access the Manage IT operations centre.', 'platform'),
  ('view:operations', 'View live platform operations.', 'operations'),
  ('manage:customers:view', 'View customer records.', 'customers'),
  ('manage:customers:suspend', 'Suspend customer accounts.', 'customers'),
  ('manage:customers:delete', 'Delete customer accounts.', 'customers'),
  ('manage:customers:impersonate', 'Impersonate customers for support.', 'customers'),
  ('manage:companies:view', 'View company records.', 'companies'),
  ('manage:companies:edit', 'Edit company settings.', 'companies'),
  ('manage:companies:manage_subscription', 'Manage company subscription settings.', 'companies'),
  ('manage:documents:view', 'View operational documents.', 'documents'),
  ('manage:documents:upload', 'Upload platform documents.', 'documents'),
  ('manage:settings:view', 'View platform settings.', 'settings'),
  ('manage:settings:edit', 'Edit platform settings.', 'settings'),
  ('manage:users:view', 'View users and roles.', 'users'),
  ('manage:users:invite', 'Invite platform users.', 'users'),
  ('manage:users:reset_password', 'Reset user passwords.', 'users'),
  ('manage:users:assign_roles', 'Assign roles to users.', 'users'),
  ('manage:users:disable', 'Disable user access.', 'users'),
  ('manage:integrations:view', 'View integration status.', 'integrations'),
  ('manage:integrations:edit', 'Edit integration settings.', 'integrations'),
  ('manage:integrations:connect', 'Connect or test integrations.', 'integrations'),
  ('manage:subscriptions:view', 'View subscription information.', 'subscriptions'),
  ('manage:subscriptions:edit', 'Manage subscription lifecycle.', 'subscriptions'),
  ('manage:platform:feature_flags', 'Manage platform feature flags.', 'platform'),
  ('manage:platform:audit_log', 'View and review audit log entries.', 'platform')
ON CONFLICT (slug) DO UPDATE
SET description = EXCLUDED.description,
    category = EXCLUDED.category;

WITH role_map AS (
  SELECT slug, id FROM public.roles
), permission_map AS (
  SELECT slug, id FROM public.permissions
), assignments AS (
  SELECT 'super_admin'::TEXT AS role_slug, permission_map.id AS permission_id
  FROM permission_map
  UNION ALL
  SELECT 'company_admin', permission_map.id
  FROM permission_map
  WHERE permission_map.slug IN (
    'manage:companies:view',
    'manage:companies:edit',
    'manage:companies:manage_subscription',
    'manage:documents:view',
    'manage:documents:upload',
    'manage:users:view',
    'manage:users:invite',
    'manage:users:reset_password',
    'manage:integrations:view',
    'manage:subscriptions:view'
  )
  UNION ALL
  SELECT 'user', permission_map.id
  FROM permission_map
  WHERE permission_map.slug IN ('manage:documents:view')
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT role_map.id, assignments.permission_id
FROM assignments
JOIN role_map ON role_map.slug = assignments.role_slug
ON CONFLICT (role_id, permission_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.has_permission(target_user_id UUID, required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = target_user_id
      AND p.slug = required_permission
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_access_profile()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'roles', COALESCE((
      SELECT jsonb_agg(DISTINCT r.slug ORDER BY r.slug)
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
    ), '[]'::JSONB),
    'permissions', COALESCE((
      SELECT jsonb_agg(DISTINCT p.slug ORDER BY p.slug)
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON rp.role_id = ur.role_id
      JOIN public.permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = auth.uid()
    ), '[]'::JSONB)
  );
$$;

CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_name TEXT,
  resource_type_name TEXT,
  resource_id_value TEXT DEFAULT NULL,
  details_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS public.audit_log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_row public.audit_log;
  actor_email_value TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT email INTO actor_email_value
  FROM auth.users
  WHERE id = auth.uid();

  INSERT INTO public.audit_log (
    actor_user_id,
    actor_email,
    action,
    resource_type,
    resource_id,
    details
  )
  VALUES (
    auth.uid(),
    actor_email_value,
    action_name,
    resource_type_name,
    resource_id_value,
    COALESCE(details_payload, '{}'::JSONB)
  )
  RETURNING * INTO inserted_row;

  RETURN inserted_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_default_role_to_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_role_id UUID;
BEGIN
  SELECT id INTO resolved_role_id
  FROM public.roles
  WHERE slug = CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.platform_admin_bootstrap bootstrap
      WHERE bootstrap.email ILIKE NEW.email
    ) THEN 'super_admin'
    ELSE 'user'
  END
  LIMIT 1;

  IF resolved_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, resolved_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_default_role_to_auth_user ON auth.users;
CREATE TRIGGER assign_default_role_to_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_default_role_to_auth_user();

INSERT INTO public.user_roles (user_id, role_id)
SELECT users.id, roles.id
FROM auth.users AS users
JOIN public.roles AS roles
  ON roles.slug = CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.platform_admin_bootstrap bootstrap
      WHERE bootstrap.email ILIKE users.email
    ) THEN 'super_admin'
    ELSE 'user'
  END
ON CONFLICT (user_id, role_id) DO NOTHING;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.roles;
CREATE POLICY "Authenticated users can read roles"
ON public.roles
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can read permissions" ON public.permissions;
CREATE POLICY "Authenticated users can read permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can read role permissions" ON public.role_permissions;
CREATE POLICY "Authenticated users can read role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS "Users can read own role assignments" ON public.user_roles;
CREATE POLICY "Users can read own role assignments"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'manage:users:assign_roles'));

DROP POLICY IF EXISTS "Super admins can manage role assignments" ON public.user_roles;
CREATE POLICY "Super admins can manage role assignments"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'manage:users:assign_roles'))
WITH CHECK (public.has_permission(auth.uid(), 'manage:users:assign_roles'));

DROP POLICY IF EXISTS "Super admins can read audit log" ON public.audit_log;
CREATE POLICY "Super admins can read audit log"
ON public.audit_log
FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'manage:platform:audit_log'));

GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_access_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(TEXT, TEXT, TEXT, JSONB) TO authenticated;
