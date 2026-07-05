-- NEXUS TEST ENVIRONMENT RESET (company-scoped)
-- Purpose: remove operational test/dev data while preserving schema, migrations, auth tables, and code.
--
-- Usage:
-- 1) Set your target company UUID.
-- 2) Run in Supabase SQL editor.
-- 3) Review affected row counts before COMMIT.

BEGIN;

-- Replace with your merchant/company UUID
-- Example: '00000000-0000-0000-0000-000000000000'
DO $$
DECLARE
  target_company UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  RAISE NOTICE 'Resetting company_id=%', target_company;

  -- Core operational rows
  DELETE FROM document_extracted_fields
  WHERE document_id IN (
    SELECT id FROM uploaded_documents WHERE company_id = target_company
  );

  DELETE FROM notifications WHERE company_id = target_company;
  DELETE FROM merchant_customer_booking_profiles WHERE company_id = target_company;
  DELETE FROM merchant_customer_addresses WHERE company_id = target_company;
  DELETE FROM merchant_collection_profiles WHERE company_id = target_company;
  DELETE FROM merchant_customers WHERE company_id = target_company;

  -- Products / catalogue
  DELETE FROM catalogue_items WHERE merchant_id = target_company;

  -- Jobs and documents
  DELETE FROM draft_jobs WHERE company_id = target_company;
  DELETE FROM uploaded_documents WHERE company_id = target_company;
END $$;

-- Verify tables are empty for that company
-- SELECT count(*) FROM merchant_customers WHERE company_id = '...';
-- SELECT count(*) FROM merchant_customer_addresses WHERE company_id = '...';
-- SELECT count(*) FROM draft_jobs WHERE company_id = '...';
-- SELECT count(*) FROM uploaded_documents WHERE company_id = '...';
-- SELECT count(*) FROM catalogue_items WHERE merchant_id = '...';

COMMIT;

-- Storage cleanup (run separately in storage UI/CLI):
-- Remove objects in bucket merchant-documents under prefix: <company_id>/
