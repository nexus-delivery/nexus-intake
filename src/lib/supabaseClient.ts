import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Whether Supabase env vars are present and the client is usable.
 * When false, upload functions return graceful errors and confirmJob uses mock data,
 * allowing the merchant journey to work visually in preview/local dev environments.
 */
export const SUPABASE_AVAILABLE = Boolean(supabaseUrl && supabaseAnonKey);
const SUPABASE_UNAVAILABLE_ERROR =
  "Supabase is not configured. Please set the required environment variables and try again.";

// Only create the client when env vars are present – never throw at module load.
export const supabase: SupabaseClient | null = SUPABASE_AVAILABLE
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * TEMPORARY: Placeholder company ID used for preview/local dev only.
 * TODO: Replace with authenticated company_id when auth is implemented.
 */
const DEFAULT_COMPANY_ID = "724ef0a7-4371-4350-9e59-ab93a960183f";

// Supported MIME types mapped to their normalised file_type values
const SUPPORTED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

const SESSION_REQUIRED_ERROR = "You must be signed in to upload documents.";
const PROFILE_LOOKUP_ERROR =
  "We couldn't load your company profile. Please try again or contact support.";
const PROFILE_NOT_FOUND_ERROR =
  "We couldn't find your company profile for this account. Please complete onboarding or contact support before uploading documents.";
const PROFILE_COMPANY_REQUIRED_ERROR =
  "Your account is missing a company assignment. Please contact support before uploading documents.";

function getFileTypeFromMime(mimeType: string): string | null {
  return SUPPORTED_MIME_TYPES[mimeType] ?? null;
}

async function getAuthenticatedUploadContext(expectedUserId?: string): Promise<
  | { success: true; userId: string; companyId: string }
  | { success: false; error: string }
> {
  if (!supabase) {
    return { success: false, error: SUPABASE_UNAVAILABLE_ERROR };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Supabase session lookup failed", { error: sessionError });
    return {
      success: false,
      error: "Failed to verify your session. Please refresh the page and try again.",
    };
  }

  const sessionUserId = sessionData.session?.user?.id;

  if (!sessionUserId) {
    return { success: false, error: SESSION_REQUIRED_ERROR };
  }

  if (expectedUserId && expectedUserId !== sessionUserId) {
    console.error("Supabase session user mismatch during upload", {
      expectedUserId,
      sessionUserId,
    });
    return {
      success: false,
      error: "Your session changed while uploading. Please try again.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("auth_user_id", sessionUserId)
    .maybeSingle();

  if (profileError) {
    console.error("Supabase select failed", {
      table: "profiles",
      authUserId: sessionUserId,
      error: profileError,
    });
    return { success: false, error: PROFILE_LOOKUP_ERROR };
  }

  if (!profile) {
    return { success: false, error: PROFILE_NOT_FOUND_ERROR };
  }

  if (!profile.company_id) {
    return { success: false, error: PROFILE_COMPANY_REQUIRED_ERROR };
  }

  return { success: true, userId: sessionUserId, companyId: profile.company_id };
}

/**
 * Generate a random UUID v4 for use as a mock job ID in preview/local dev.
 * Falls back to a manual implementation when crypto.randomUUID is unavailable.
 */
export function generateMockJobId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
  if (!supabase) {
    return { success: false, error: SUPABASE_UNAVAILABLE_ERROR };
  }

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
  userId?: string;
}): Promise<{ success: boolean; documentId?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: SUPABASE_UNAVAILABLE_ERROR };
  }

  const authContext = await getAuthenticatedUploadContext(params.userId);
  if (!authContext.success) {
    return { success: false, error: authContext.error };
  }

  try {
    const { data, error } = await supabase
      .from("uploaded_documents")
      .insert({
        company_id: authContext.companyId,
        uploaded_by_user_id: authContext.userId,
        file_name: params.fileName,
        file_path: params.filePath,
        file_type: params.fileType,
        file_size: params.fileSize,
        status: "uploaded",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert failed", { table: "uploaded_documents", error });
      return { success: false, error: error.message };
    }

    return { success: true, documentId: data?.id };
  } catch (err) {
    console.error("Supabase insert failed", { table: "uploaded_documents", error: err });
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
  userId?: string;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: SUPABASE_UNAVAILABLE_ERROR };
  }

  const authContext = await getAuthenticatedUploadContext(params.userId);
  if (!authContext.success) {
    return { success: false, error: authContext.error };
  }

  try {
    const { data, error } = await supabase
      .from("draft_jobs")
      .insert({
        company_id: authContext.companyId,
        created_by_user_id: authContext.userId,
        primary_document_id: params.primaryDocumentId,
        status: "document_uploaded",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert failed", { table: "draft_jobs", error });
      return { success: false, error: error.message };
    }

    return { success: true, jobId: data?.id };
  } catch (err) {
    console.error("Supabase insert failed", { table: "draft_jobs", error: err });
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
  userId?: string
): Promise<{ success: boolean; error?: string; metadata?: UploadedDocumentMetadata }> {
  if (!supabase) {
    return { success: false, error: SUPABASE_UNAVAILABLE_ERROR };
  }

  const fileType = getFileTypeFromMime(file.type);
  if (!fileType) {
    return {
      success: false,
      error: "Unsupported file type. Please upload a PDF, PNG, JPG, or JPEG.",
    };
  }

  const uploadedAt = new Date().toISOString();
  const authContext = await getAuthenticatedUploadContext(userId);
  if (!authContext.success) {
    return { success: false, error: authContext.error };
  }

  // Step 1: Upload to storage
  const storageResult = await uploadMultiFormatFile(file, authContext.companyId);
  if (!storageResult.success) {
    return { success: false, error: storageResult.error };
  }

  // Step 2: Create uploaded_documents record
  const docResult = await insertUploadedDocument({
    fileName: file.name,
    filePath: storageResult.filePath!,
    fileType,
    fileSize: file.size,
    userId: authContext.userId,
  });
  if (!docResult.success) {
    return { success: false, error: docResult.error };
  }

  // Step 3: Create draft_jobs record
  const jobResult = await createDraftJob({
    primaryDocumentId: docResult.documentId!,
    userId: authContext.userId,
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
  // Graceful fallback for preview/local dev without Supabase env vars
  if (!supabase) {
    const mockId = generateMockJobId();
    return { success: true, jobId: mockId, jobReference: generateJobReference(mockId) };
  }

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
  if (!supabase) {
    return { success: false, error: "Supabase configuration not available in preview" };
  }

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
