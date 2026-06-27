import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// TODO: replace with authenticated company_id from session when auth is implemented
const DEFAULT_COMPANY_ID = "724ef0a7-4371-4350-9e59-ab93a960183f";

// Supported MIME types mapped to their normalised file_type values
const SUPPORTED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

function getFileTypeFromMime(mimeType: string): string | null {
  return SUPPORTED_MIME_TYPES[mimeType] ?? null;
}

/**
 * Upload a multi-format document (PDF, PNG, JPG, JPEG) to the
 * merchant-documents Supabase Storage bucket.
 *
 * Path structure: /{company_id}/uploads/{timestamp}-{filename}
 */
export async function uploadMultiFormatFile(
  file: File,
  companyId: string = DEFAULT_COMPANY_ID
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const fileType = getFileTypeFromMime(file.type);
  if (!fileType) {
    return {
      success: false,
      error: "Unsupported file type. Please upload a PDF, PNG, JPG, or JPEG.",
    };
  }

  const timestamp = Date.now();
  const filePath = `${companyId}/uploads/${timestamp}-${file.name}`;

  try {
    const { data, error } = await supabase.storage
      .from("merchant-documents")
      .upload(filePath, file);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, filePath: data?.path };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { success: false, error: message };
  }
}

/**
 * Insert a record into the uploaded_documents table.
 *
 * Schema: uploaded_documents
 *   id, company_id, uploaded_by_user_id, file_name, file_path,
 *   file_type, file_size, status, created_at, updated_at
 *
 * TODO: When profiles table exists with company_id + user_id link, enable RLS:
 *   ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users can view/insert documents from their company"
 *     ON uploaded_documents
 *     USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
 *     WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
 */
export async function insertUploadedDocument(params: {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  companyId?: string;
  uploadedByUserId?: string;
}): Promise<{ success: boolean; documentId?: string; error?: string }> {
  const companyId = params.companyId || DEFAULT_COMPANY_ID; // TODO: replace with authenticated company_id

  try {
    const { data, error } = await supabase
      .from("uploaded_documents")
      .insert({
        company_id: companyId,
        uploaded_by_user_id: params.uploadedByUserId ?? null, // TODO: replace with authenticated user_id when available
        file_name: params.fileName,
        file_path: params.filePath,
        file_type: params.fileType,
        file_size: params.fileSize,
        status: "uploaded",
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, documentId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database insert failed";
    return { success: false, error: message };
  }
}

/**
 * Create a draft_jobs record linked to an uploaded document.
 *
 * Schema: draft_jobs
 *   id, company_id, created_by_user_id, primary_document_id, status,
 *   created_at, updated_at
 *
 * TODO: When profiles table exists with company_id + user_id link, enable RLS:
 *   ALTER TABLE draft_jobs ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users can view/insert jobs from their company"
 *     ON draft_jobs
 *     USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
 *     WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
 */
export async function createDraftJob(params: {
  primaryDocumentId: string;
  companyId?: string;
  createdByUserId?: string;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const companyId = params.companyId || DEFAULT_COMPANY_ID; // TODO: replace with authenticated company_id

  try {
    const { data, error } = await supabase
      .from("draft_jobs")
      .insert({
        company_id: companyId,
        created_by_user_id: params.createdByUserId ?? null, // TODO: replace with authenticated user_id when available
        primary_document_id: params.primaryDocumentId,
        status: "document_uploaded",
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, jobId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create draft job";
    return { success: false, error: message };
  }
}

export type UploadedDocumentMetadata = {
  documentId: string;
  jobId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: string;
};

/**
 * Complete multi-format document upload flow:
 * 1. Validate file type (PDF, PNG, JPG, JPEG)
 * 2. Upload file to merchant-documents storage bucket
 * 3. Create uploaded_documents record
 * 4. Create draft_jobs record linked to the document
 *
 * Returns full metadata including document ID, job ID, and file details.
 */
export async function uploadMultiFormatDocument(
  file: File,
  companyId?: string
): Promise<{ success: boolean; error?: string; metadata?: UploadedDocumentMetadata }> {
  const fileType = getFileTypeFromMime(file.type);
  if (!fileType) {
    return {
      success: false,
      error: "Unsupported file type. Please upload a PDF, PNG, JPG, or JPEG.",
    };
  }

  const uploadedAt = new Date().toISOString();
  const effectiveCompanyId = companyId || DEFAULT_COMPANY_ID;

  // Step 1: Upload to storage
  const storageResult = await uploadMultiFormatFile(file, effectiveCompanyId);
  if (!storageResult.success) {
    return { success: false, error: storageResult.error };
  }

  // Step 2: Create uploaded_documents record
  const docResult = await insertUploadedDocument({
    fileName: file.name,
    filePath: storageResult.filePath!,
    fileType,
    fileSize: file.size,
    companyId: effectiveCompanyId,
  });
  if (!docResult.success) {
    return { success: false, error: docResult.error };
  }

  // Step 3: Create draft_jobs record
  const jobResult = await createDraftJob({
    primaryDocumentId: docResult.documentId!,
    companyId: effectiveCompanyId,
  });
  if (!jobResult.success) {
    return { success: false, error: jobResult.error };
  }

  return {
    success: true,
    metadata: {
      documentId: docResult.documentId!,
      jobId: jobResult.jobId!,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      filePath: storageResult.filePath!,
      uploadedAt,
    },
  };
}

/**
 * Generate a human-readable job reference from a job UUID.
 * Format: NEX-YYYYMMDD-XXXXX (last 5 chars of UUID, uppercased)
 *
 * @param jobId - A valid UUID string (e.g. "724ef0a7-4371-4350-9e59-ab93a960183f").
 *   The function assumes the input is a non-empty UUID; the last 5 alphanumeric
 *   characters (dashes excluded) are used as the unique suffix.
 */
export function generateJobReference(jobId: string): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = jobId.replace(/-/g, "").slice(-5).toUpperCase();
  return `NEX-${dateStr}-${suffix}`;
}

/**
 * Confirm a job: create or update a draft_jobs record with status = "job_created".
 * - Upload path: update existing draft_jobs record by draftJobId.
 * - Manual entry path: create a new draft_jobs record (no document).
 * Returns the job ID and a human-readable job reference.
 */
export async function confirmJob(params: {
  draftJobId?: string;
  companyId?: string;
}): Promise<{ success: boolean; jobId?: string; jobReference?: string; error?: string }> {
  const companyId = params.companyId || DEFAULT_COMPANY_ID; // TODO: replace with authenticated company_id

  try {
    let jobId: string;

    if (params.draftJobId) {
      // Upload path: update existing draft job to job_created status
      const { error } = await supabase
        .from("draft_jobs")
        .update({ status: "job_created" })
        .eq("id", params.draftJobId);

      if (error) {
        return { success: false, error: error.message };
      }
      jobId = params.draftJobId;
    } else {
      // Manual entry path: create a new draft job with no primary document
      const { data, error } = await supabase
        .from("draft_jobs")
        .insert({
          company_id: companyId,
          created_by_user_id: null, // TODO: replace with authenticated user_id
          primary_document_id: null,
          status: "job_created",
        })
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      jobId = data.id;
    }

    const jobReference = generateJobReference(jobId);
    return { success: true, jobId, jobReference };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm job";
    return { success: false, error: message };
  }
}

export type UploadedDocumentRow = {
  id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  status: string;
  created_at: string;
};

export async function fetchUploadedDocuments(companyId?: string): Promise<
  | { success: true; data: UploadedDocumentRow[] }
  | { success: false; error: string }
> {
  try {
    let query = supabase
      .from("uploaded_documents")
      .select(
        "id, company_id, file_name, file_path, file_type, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data ?? [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch documents";
    return { success: false, error: message };
  }
}
