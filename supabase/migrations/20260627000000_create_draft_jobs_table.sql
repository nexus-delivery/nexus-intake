-- draft_jobs table
-- - Stores job records linked to uploaded documents
-- - company_id enables multi-tenancy
-- - primary_document_id is FK to uploaded_documents
-- - status tracks job lifecycle: 'document_uploaded' → 'job_created'
CREATE TABLE IF NOT EXISTS draft_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  created_by_user_id UUID,
  primary_document_id UUID REFERENCES uploaded_documents(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('document_uploaded', 'job_created')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for company-scoped queries
CREATE INDEX IF NOT EXISTS idx_draft_jobs_company_id ON draft_jobs(company_id);

-- Automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_draft_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Idempotent trigger setup: ensure exactly one trigger definition exists.
DROP TRIGGER IF EXISTS draft_jobs_updated_at ON draft_jobs;

CREATE TRIGGER draft_jobs_updated_at
BEFORE UPDATE ON draft_jobs
FOR EACH ROW
EXECUTE FUNCTION update_draft_jobs_updated_at();

-- Future: Enable RLS when auth is implemented
-- ALTER TABLE draft_jobs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view/insert jobs from their company"
--   ON draft_jobs
--   USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
--   WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
