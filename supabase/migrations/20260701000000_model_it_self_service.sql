-- ─────────────────────────────────────────────────────────────────────────────
-- Model It: self-service modelling platform foundations
-- Additive migration for workspace-scoped templates, rules, versioning and audit.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS model_it_workspaces (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL,
  merchant_key            TEXT NOT NULL,
  customer_key            TEXT,
  workspace_name          TEXT NOT NULL,
  is_global_workspace     BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_profile_id   UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT model_it_workspace_unique UNIQUE (company_id, merchant_key, customer_key)
);

CREATE TABLE IF NOT EXISTS model_it_artifacts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL,
  workspace_id            UUID NOT NULL REFERENCES model_it_workspaces(id) ON DELETE CASCADE,
  artifact_kind           TEXT NOT NULL CHECK (
    artifact_kind IN (
      'document_template',
      'ocr_mapping_rule',
      'booking_form',
      'public_web_form',
      'workflow_rule',
      'validation_rule',
      'pricing_rule',
      'collection_rule',
      'delivery_rule',
      'warehouse_rule',
      'notification_rule',
      'api_mapping_rule',
      'trackpod_mapping',
      'xero_mapping',
      'status_mapping',
      'business_rule'
    )
  ),
  artifact_key            TEXT NOT NULL,
  artifact_name           TEXT NOT NULL,
  active_version          INT,
  created_by_profile_id   UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT model_it_artifact_unique UNIQUE (workspace_id, artifact_kind, artifact_key)
);

CREATE TABLE IF NOT EXISTS model_it_artifact_versions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL,
  workspace_id            UUID NOT NULL REFERENCES model_it_workspaces(id) ON DELETE CASCADE,
  artifact_id             UUID NOT NULL REFERENCES model_it_artifacts(id) ON DELETE CASCADE,
  version_number          INT NOT NULL,
  version_state           TEXT NOT NULL CHECK (version_state IN ('draft', 'published', 'archived')),
  schema_version          TEXT NOT NULL DEFAULT '1.0.0',
  definition              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_profile_id   UUID,
  published_by_profile_id UUID,
  published_at            TIMESTAMPTZ,
  rollback_from_version   INT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT model_it_artifact_version_unique UNIQUE (artifact_id, version_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS model_it_artifact_one_published_version
  ON model_it_artifact_versions (artifact_id)
  WHERE version_state = 'published';

CREATE TABLE IF NOT EXISTS model_it_audit_log (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL,
  workspace_id            UUID REFERENCES model_it_workspaces(id) ON DELETE SET NULL,
  artifact_id             UUID REFERENCES model_it_artifacts(id) ON DELETE SET NULL,
  artifact_version_id     UUID REFERENCES model_it_artifact_versions(id) ON DELETE SET NULL,
  action                  TEXT NOT NULL CHECK (
    action IN ('create', 'edit', 'publish', 'rollback', 'test', 'submit_suggestion')
  ),
  actor_profile_id        UUID,
  actor_role              TEXT,
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_it_workspaces_company_id
  ON model_it_workspaces (company_id);

CREATE INDEX IF NOT EXISTS idx_model_it_artifacts_workspace_id
  ON model_it_artifacts (workspace_id);

CREATE INDEX IF NOT EXISTS idx_model_it_artifact_versions_artifact_id
  ON model_it_artifact_versions (artifact_id);

CREATE INDEX IF NOT EXISTS idx_model_it_audit_log_workspace_id
  ON model_it_audit_log (workspace_id);

CREATE OR REPLACE FUNCTION update_model_it_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS model_it_workspaces_updated_at ON model_it_workspaces;
CREATE TRIGGER model_it_workspaces_updated_at
  BEFORE UPDATE ON model_it_workspaces
  FOR EACH ROW EXECUTE FUNCTION update_model_it_updated_at();

DROP TRIGGER IF EXISTS model_it_artifacts_updated_at ON model_it_artifacts;
CREATE TRIGGER model_it_artifacts_updated_at
  BEFORE UPDATE ON model_it_artifacts
  FOR EACH ROW EXECUTE FUNCTION update_model_it_updated_at();

DROP TRIGGER IF EXISTS model_it_artifact_versions_updated_at ON model_it_artifact_versions;
CREATE TRIGGER model_it_artifact_versions_updated_at
  BEFORE UPDATE ON model_it_artifact_versions
  FOR EACH ROW EXECUTE FUNCTION update_model_it_updated_at();

ALTER TABLE model_it_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_it_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_it_artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_it_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_read_model_it_workspaces ON model_it_workspaces;
CREATE POLICY company_read_model_it_workspaces ON model_it_workspaces
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS company_write_model_it_workspaces ON model_it_workspaces;
CREATE POLICY company_write_model_it_workspaces ON model_it_workspaces
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  ) WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS company_read_model_it_artifacts ON model_it_artifacts;
CREATE POLICY company_read_model_it_artifacts ON model_it_artifacts
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS company_write_model_it_artifacts ON model_it_artifacts;
CREATE POLICY company_write_model_it_artifacts ON model_it_artifacts
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  ) WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS company_read_model_it_artifact_versions ON model_it_artifact_versions;
CREATE POLICY company_read_model_it_artifact_versions ON model_it_artifact_versions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS company_write_model_it_artifact_versions ON model_it_artifact_versions;
CREATE POLICY company_write_model_it_artifact_versions ON model_it_artifact_versions
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  ) WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS company_read_model_it_audit_log ON model_it_audit_log;
CREATE POLICY company_read_model_it_audit_log ON model_it_audit_log
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS company_insert_model_it_audit_log ON model_it_audit_log;
CREATE POLICY company_insert_model_it_audit_log ON model_it_audit_log
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );
