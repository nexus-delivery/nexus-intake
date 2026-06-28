-- ─────────────────────────────────────────────────────────────────────────────
-- PR #2 – Nexus it. Platform Experience
-- Additive migration: document workflow tables
--
-- These tables extend the existing uploaded_documents / draft_jobs schema
-- without modifying any existing columns, constraints or RLS policies.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── document_workflow_status: extended status enum values ─────────────────────
-- The uploaded_documents.status column accepts text; this table documents
-- the canonical status values used by Document it. so the UI and any future
-- server-side queue can stay in sync.  It is informational only.
CREATE TABLE IF NOT EXISTS document_workflow_statuses (
  status       TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  sort_order   INT  NOT NULL DEFAULT 0
);

INSERT INTO document_workflow_statuses (status, display_name, sort_order) VALUES
  ('uploaded',        'Uploaded',         1),
  ('queued',          'Queued',           2),
  ('processing',      'AI Processing',    3),
  ('needs_review',    'Needs Review',     4),
  ('validated',       'Validated',        5),
  ('ready',           'Ready to Create',  6),
  ('job_created',     'Job Created',      7),
  ('route_allocated', 'Route Allocated',  8),
  ('completed',       'Completed',        9),
  ('failed',          'Failed',          10)
ON CONFLICT (status) DO NOTHING;

-- ── document_timeline: permanent audit trail per uploaded document ─────────────
-- Every state transition and operator action is appended here.
-- The original uploaded document is never deleted automatically.
CREATE TABLE IF NOT EXISTS document_timeline (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL,
  event           TEXT NOT NULL,
  actor           TEXT,            -- email / system label
  actor_profile_id UUID,           -- FK to profiles.id when available
  metadata        JSONB,           -- arbitrary extra fields (old/new values etc.)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_timeline_document_id
  ON document_timeline (document_id);

CREATE INDEX IF NOT EXISTS idx_document_timeline_company_id
  ON document_timeline (company_id);

-- ── document_extracted_fields: AI-extracted key/value pairs per document ───────
CREATE TABLE IF NOT EXISTS document_extracted_fields (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL,
  field_name      TEXT NOT NULL,
  field_value     TEXT,
  confidence      NUMERIC(5,2),    -- 0.00 – 100.00
  is_edited       BOOLEAN NOT NULL DEFAULT FALSE,
  edited_by_profile_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_extracted_fields_document_id
  ON document_extracted_fields (document_id);

-- Automatic updated_at
CREATE OR REPLACE FUNCTION update_document_extracted_fields_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS document_extracted_fields_updated_at ON document_extracted_fields;
CREATE TRIGGER document_extracted_fields_updated_at
  BEFORE UPDATE ON document_extracted_fields
  FOR EACH ROW EXECUTE FUNCTION update_document_extracted_fields_updated_at();

-- ── document_templates: mapping templates (Track-POD first, extensible) ────────
CREATE TABLE IF NOT EXISTS document_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID,            -- NULL = system-wide template
  name            TEXT NOT NULL,
  transport_adapter TEXT NOT NULL DEFAULT 'trackpod',  -- trackpod | maxoptra | onfleet | custom
  field_mappings  JSONB NOT NULL DEFAULT '{}',         -- nexus_field -> adapter_field
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the default Track-POD template (system-wide, company_id NULL)
INSERT INTO document_templates (id, name, transport_adapter, field_mappings, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Track-POD Standard',
  'trackpod',
  '{
    "order_reference":      "reference",
    "collection_name":      "shipper",
    "collection_address":   "collection_address",
    "delivery_name":        "delivery_name",
    "delivery_address":     "delivery_address",
    "delivery_postcode":    "delivery_postcode",
    "phone":                "phone",
    "email":                "email",
    "goods_description":    "goods_description",
    "quantity":             "quantity",
    "delivery_date":        "delivery_date",
    "collection_date":      "collection_date",
    "notes":                "notes"
  }'::JSONB,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ── document_ai_runs: record of each AI/OCR processing attempt ────────────────
CREATE TABLE IF NOT EXISTS document_ai_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL,
  run_number      INT  NOT NULL DEFAULT 1,
  status          TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed')),
  confidence      NUMERIC(5,2),
  extracted_text  TEXT,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_ai_runs_document_id
  ON document_ai_runs (document_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: Enable row-level security so each company only sees its own rows.
-- Policies use the same pattern as the rest of the schema (company_id scoping).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE document_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_extracted_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_ai_runs ENABLE ROW LEVEL SECURITY;

-- document_timeline policies
DROP POLICY IF EXISTS "company_read_document_timeline" ON document_timeline;
CREATE POLICY "company_read_document_timeline" ON document_timeline
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_insert_document_timeline" ON document_timeline;
CREATE POLICY "company_insert_document_timeline" ON document_timeline
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- document_extracted_fields policies
DROP POLICY IF EXISTS "company_read_document_extracted_fields" ON document_extracted_fields;
CREATE POLICY "company_read_document_extracted_fields" ON document_extracted_fields
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_write_document_extracted_fields" ON document_extracted_fields;
CREATE POLICY "company_write_document_extracted_fields" ON document_extracted_fields
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- document_ai_runs policies
DROP POLICY IF EXISTS "company_read_document_ai_runs" ON document_ai_runs;
CREATE POLICY "company_read_document_ai_runs" ON document_ai_runs
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_insert_document_ai_runs" ON document_ai_runs;
CREATE POLICY "company_insert_document_ai_runs" ON document_ai_runs
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- document_templates: all authenticated users may read; inserts restricted to manage-it
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_document_templates" ON document_templates;
CREATE POLICY "authenticated_read_document_templates" ON document_templates
  FOR SELECT USING (
    company_id IS NULL   -- system templates are visible to all
    OR company_id IN (
      SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );
