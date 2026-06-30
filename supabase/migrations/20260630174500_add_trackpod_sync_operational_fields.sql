ALTER TABLE draft_jobs
  ADD COLUMN IF NOT EXISTS document_url TEXT,
  ADD COLUMN IF NOT EXISTS document_filename TEXT,
  ADD COLUMN IF NOT EXISTS document_file_type TEXT,
  ADD COLUMN IF NOT EXISTS document_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS current_status TEXT,
  ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_api_response JSONB;
