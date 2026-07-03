import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SIGN_IN_ERROR = "Please sign in to access merchant documents";
const NO_COMPANY_ERROR = "No company is linked to this user";
const ACCESS_DENIED_ERROR = "You do not have access to this document";

export function getSupabaseProjectRefFromUrl(): string | null {
  if (!supabaseUrl) {
    return null;
  }

  try {
    const host = new URL(supabaseUrl).host;
    return host.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Whether Supabase env vars are present and the client is usable.
 * When false, upload functions return graceful errors and confirmJob uses mock data,
 * allowing the merchant journey to work visually in preview/local dev environments.
 */
export const SUPABASE_AVAILABLE = Boolean(supabaseUrl && supabaseAnonKey);

// Only create the client when env vars are present – never throw at module load.
export const supabase: SupabaseClient | null = SUPABASE_AVAILABLE
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

const MERCHANT_DOCUMENTS_BUCKET = "merchant-documents";

// Supported MIME types mapped to their normalised file_type values
const SUPPORTED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

function getFileTypeFromMime(mimeType: string): string | null {
  return SUPPORTED_MIME_TYPES[mimeType] ?? null;
}

type AuthenticatedProfileContext = {
  authUserId: string;
  profileId: string;
  companyId: string;
};

export type CurrentProfile = AuthenticatedProfileContext;

async function fetchAuthenticatedProfileContext(
  userId?: string
): Promise<AuthenticatedProfileContext> {
  if (!supabase) {
    throw new Error("Supabase configuration not available in preview");
  }

  let authUserId = userId;

  if (!authUserId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Failed to get authenticated user for merchant documents", {
        error: userError,
      });
      throw new Error(SIGN_IN_ERROR);
    }

    authUserId = user?.id;
  }

  if (!authUserId) {
    throw new Error(SIGN_IN_ERROR);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch upload profile context", { authUserId, error });
    throw new Error("Unable to load your profile for document upload. Please try again.");
  }

  if (!profile) {
    throw new Error(NO_COMPANY_ERROR);
  }

  if (!profile.company_id) {
    throw new Error(NO_COMPANY_ERROR);
  }

  return {
    authUserId,
    profileId: profile.id,
    companyId: profile.company_id,
  };
}

export async function fetchCurrentProfile(
  userId?: string
): Promise<
  | { success: true; data: CurrentProfile }
  | { success: false; error: string }
> {
  try {
    const profile = await fetchAuthenticatedProfileContext(userId);
    return { success: true, data: profile };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load your profile";
    return { success: false, error: message };
  }
}

function normalizeMerchantDocumentStoragePath(filePath: string): string {
  const trimmedPath = filePath.trim().replace(/^\/+/, "");

  const storageUrlMatch = trimmedPath.match(
    /^https?:\/\/[^/]+\/storage\/v1\/(?:object\/(?:sign|public|authenticated)\/)?(.+)$/
  );
  const pathWithoutStoragePrefix = storageUrlMatch ? storageUrlMatch[1] : trimmedPath;

  const bucketPrefixMatch = pathWithoutStoragePrefix.match(
    new RegExp(`(?:^|/)${MERCHANT_DOCUMENTS_BUCKET}/(.+)$`)
  );

  if (bucketPrefixMatch) {
    return bucketPrefixMatch[1];
  }

  return pathWithoutStoragePrefix.replace(new RegExp(`^${MERCHANT_DOCUMENTS_BUCKET}/`), "");
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
 * Upload a multi-format document (PDF, images, Word, Excel) to the
 * merchant-documents Supabase Storage bucket.
 *
 * Path structure: /{company_id}/uploads/{timestamp}-{filename}
 */
export async function uploadMultiFormatFile(
  file: File,
  companyId: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: "Supabase configuration not available in preview" };
  }

  if (!companyId) {
    return { success: false, error: "Missing company ID for document upload" };
  }

  const fileType = getFileTypeFromMime(file.type);
  if (!fileType) {
    return {
      success: false,
      error: "Unsupported file type. Please upload PDF, image, Word, or Excel files.",
    };
  }

  const timestamp = Date.now();
  const filePath = `${companyId}/uploads/${timestamp}-${file.name}`;

  try {
    const { data, error } = await supabase.storage
      .from(MERCHANT_DOCUMENTS_BUCKET)
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
 * Uses the authenticated profile context so RLS receives company_id and
 * created_by_profile_id from the matching profiles row.
 */
export async function insertUploadedDocument(params: {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  companyId: string;
  userId?: string;
}): Promise<{ success: boolean; documentId?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: "Supabase configuration not available in preview" };
  }

  try {
    const profile = await fetchAuthenticatedProfileContext(params.userId);
    if (profile.companyId !== params.companyId) {
      return {
        success: false,
        error: ACCESS_DENIED_ERROR,
      };
    }

    const { data, error } = await supabase
      .from("uploaded_documents")
      .insert({
        company_id: params.companyId,
        created_by_profile_id: profile.profileId,
        file_name: params.fileName,
        file_path: params.filePath,
        file_type: params.fileType,
        file_size: params.fileSize,
        status: "uploaded",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error on uploaded_documents", { error });
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
 * TODO: When profiles table exists with company_id + user_id link, enable RLS:
 *   ALTER TABLE draft_jobs ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users can view/insert jobs from their company"
 *     ON draft_jobs
 *     USING (company_id IN (SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()))
 *     WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE auth_user_id = auth.uid()));
 */
export async function createDraftJob(params: {
  primaryDocumentId: string;
  companyId: string;
  userId?: string;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: "Supabase configuration not available in preview" };
  }

  try {
    const profile = await fetchAuthenticatedProfileContext(params.userId);
    if (profile.companyId !== params.companyId) {
      return {
        success: false,
        error: "Your profile company does not match the selected company for this upload.",
      };
    }

    const { data, error } = await supabase
      .from("draft_jobs")
      .insert({
        company_id: params.companyId,
        created_by_user_id: profile.profileId,
        primary_document_id: params.primaryDocumentId,
        status: "document_uploaded",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error on draft_jobs", { error });
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
  companyId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  permanentUrl: string;
  secureUrl: string;
  uploadedAt: string;
};

/**
 * Complete multi-format document upload flow:
 * 1. Validate file type (PDF, image, Word, Excel)
 * 2. Upload file to merchant-documents storage bucket
 * 3. Create uploaded_documents record
 * 4. Create draft_jobs record linked to the document
 *
 * Returns full metadata including document ID, job ID, and file details.
 */
export async function uploadMultiFormatDocument(
  file: File,
  companyId: string
): Promise<{ success: boolean; error?: string; metadata?: UploadedDocumentMetadata }> {
  if (!supabase) {
    return { success: false, error: "Supabase configuration not available in preview" };
  }

  if (!companyId) {
    return { success: false, error: "Missing company ID for document upload" };
  }

  const fileType = getFileTypeFromMime(file.type);
  if (!fileType) {
    return {
      success: false,
      error: "Unsupported file type. Please upload PDF, image, Word, or Excel files.",
    };
  }

  const uploadedAt = new Date().toISOString();
  let profile: AuthenticatedProfileContext;

  try {
    profile = await fetchAuthenticatedProfileContext();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to prepare your upload";
    return { success: false, error: message };
  }

  if (profile.companyId !== companyId) {
    return {
      success: false,
      error: ACCESS_DENIED_ERROR,
    };
  }

  // Step 1: Upload to storage
  const storageResult = await uploadMultiFormatFile(file, companyId);
  if (!storageResult.success) {
    return { success: false, error: storageResult.error };
  }

  // Step 2: Create uploaded_documents record
  const docResult = await insertUploadedDocument({
    fileName: file.name,
    filePath: storageResult.filePath!,
    fileType,
    fileSize: file.size,
    companyId,
    userId: profile.authUserId,
  });
  if (!docResult.success) {
    return { success: false, error: docResult.error };
  }

  // Step 3: Create draft_jobs record
  const jobResult = await createDraftJob({
    primaryDocumentId: docResult.documentId!,
    companyId,
    userId: profile.authUserId,
  });
  if (!jobResult.success) {
    return { success: false, error: jobResult.error };
  }

  return {
    success: true,
    metadata: {
      documentId: docResult.documentId!,
      jobId: jobResult.jobId!,
      companyId,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      filePath: storageResult.filePath!,
      permanentUrl: `/portal/documents/${docResult.documentId!}`,
      secureUrl: `/api/merchant-documents/signed-url?document_id=${encodeURIComponent(docResult.documentId!)}`,
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
  documentId?: string;
  companyId?: string;
  userId?: string;
  trackPodMapping?: Record<string, string | null> | null;
  readyForTrackPod?: boolean;
}): Promise<{
  success: boolean;
  jobId?: string;
  jobReference?: string;
  trackPodCollectionOrderId?: string;
  trackPodDeliveryOrderId?: string;
  trackPodCollectionTrackingUrl?: string;
  trackPodDeliveryTrackingUrl?: string;
  xeroDraftInvoiceId?: string;
  documentUrl?: string | null;
  error?: string;
}> {
  // Graceful fallback for preview/local dev without Supabase env vars
  if (!supabase) {
    const mockId = generateMockJobId();
    return { success: true, jobId: mockId, jobReference: generateJobReference(mockId) };
  }

  let companyId = params.companyId;
  let createdByUserId: string | null = null;

  if (!companyId) {
    try {
      const profile = await fetchAuthenticatedProfileContext(params.userId);
      companyId = profile.companyId;
      createdByUserId = profile.profileId;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to prepare your booking";
      return { success: false, error: message };
    }
  }

  try {
    let jobId: string;

    if (params.draftJobId && params.trackPodMapping) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        return { success: false, error: SIGN_IN_ERROR };
      }

      const response = await fetch("/api/process-it/confirm-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          draftJobId: params.draftJobId,
          documentId: params.documentId,
          trackPodMapping: params.trackPodMapping,
          readyForTrackPod: params.readyForTrackPod !== false,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        return {
          success: false,
          error: typeof payload.error === "string" ? payload.error : "Failed to confirm job",
        };
      }

      return {
        success: true,
        jobId: typeof payload.jobId === "string" ? payload.jobId : params.draftJobId,
        jobReference: typeof payload.jobReference === "string" ? payload.jobReference : undefined,
        trackPodCollectionOrderId:
          typeof payload.trackPodCollectionOrderId === "string"
            ? payload.trackPodCollectionOrderId
            : undefined,
        trackPodDeliveryOrderId:
          typeof payload.trackPodDeliveryOrderId === "string"
            ? payload.trackPodDeliveryOrderId
            : undefined,
        trackPodCollectionTrackingUrl:
          typeof payload.trackPodCollectionTrackingUrl === "string"
            ? payload.trackPodCollectionTrackingUrl
            : undefined,
        trackPodDeliveryTrackingUrl:
          typeof payload.trackPodDeliveryTrackingUrl === "string"
            ? payload.trackPodDeliveryTrackingUrl
            : undefined,
        xeroDraftInvoiceId:
          typeof payload.xeroDraftInvoiceId === "string"
            ? payload.xeroDraftInvoiceId
            : undefined,
        documentUrl:
          typeof payload.documentUrl === "string" || payload.documentUrl === null
            ? (payload.documentUrl as string | null)
            : undefined,
      };
    }

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
          created_by_user_id: createdByUserId,
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
  file_size: number | null;
  status: string;
  created_at: string;
};

export type DraftJobLinkRow = {
  id: string;
  primary_document_id: string | null;
  status: string;
  created_at: string;
};

export type DraftJobIdentityRow = {
  id: string;
  company_id: string;
  primary_document_id: string | null;
  status: string;
  created_at: string;
};

export type MerchantSignedUrlDebug = {
  supabaseProjectUrl: string | null;
  supabaseProjectRef: string | null;
  bucket: string;
  uploadedDocumentFilePath: string;
  objectKeyPassedToCreateSignedUrl: string;
  expiresIn: number;
  downloadOption: string | boolean | null;
  sdkError: Record<string, unknown> | null;
};

export async function requestMerchantDocumentSignedUrl(
  documentId: string,
  options?: { download?: boolean }
): Promise<
  | { success: true; signedUrl: string }
  | {
      success: false;
      error: string;
      apiError?: Record<string, unknown>;
    }
> {
  if (!supabase) {
    return { success: false, error: SIGN_IN_ERROR };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.access_token) {
    return { success: false, error: SIGN_IN_ERROR };
  }

  try {
    const response = await fetch("/api/merchant-documents/signed-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({
        documentId,
        download: Boolean(options?.download),
      }),
    });

    const payload = (await response.json()) as unknown;
    const payloadObject =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};
    const signedUrl =
      typeof payloadObject.signedUrl === "string" ? payloadObject.signedUrl : undefined;
    const payloadError =
      typeof payloadObject.error === "string" ? payloadObject.error : undefined;

    if (!response.ok || !signedUrl) {
      return {
        success: false,
        error: payloadError ?? "Failed to generate a signed URL",
        apiError: payloadObject,
      };
    }

    return {
      success: true,
      signedUrl,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate a signed URL",
    };
  }
}

function serializeSdkError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { value: String(error) };
  }

  const typedError = error as Record<string, unknown>;
  const serialized: Record<string, unknown> = {
    message:
      typeof typedError.message === "string"
        ? typedError.message
        : String(typedError.message ?? "Unknown error"),
    name: typeof typedError.name === "string" ? typedError.name : null,
    status: typedError.status ?? null,
    code: typedError.code ?? null,
    error: typedError.error ?? null,
    details: typedError.details ?? null,
    hint: typedError.hint ?? null,
  };

  for (const [key, value] of Object.entries(typedError)) {
    if (!(key in serialized)) {
      serialized[key] = value ?? null;
    }
  }

  return serialized;
}

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
        "id, company_id, file_name, file_path, file_type, file_size, status, created_at"
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

export async function fetchUploadedDocumentById(
  documentId: string,
  companyId?: string
): Promise<
  | { success: true; data: UploadedDocumentRow | null }
  | { success: false; error: string }
> {
  if (!supabase) {
    return { success: false, error: "Supabase configuration not available in preview" };
  }

  try {
    let query = supabase
      .from("uploaded_documents")
      .select(
        "id, company_id, file_name, file_path, file_type, file_size, status, created_at"
      )
      .eq("id", documentId);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch document";
    return { success: false, error: message };
  }
}

export async function fetchDraftJobsForDocuments(
  documentIds: string[]
): Promise<
  | { success: true; data: DraftJobLinkRow[] }
  | { success: false; error: string }
> {
  if (!supabase) {
    return { success: false, error: "Supabase configuration not available in preview" };
  }

  if (documentIds.length === 0) {
    return { success: true, data: [] };
  }

  try {
    const { data, error } = await supabase
      .from("draft_jobs")
      .select("id, primary_document_id, status, created_at")
      .in("primary_document_id", documentIds)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data ?? [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch linked draft jobs";
    return { success: false, error: message };
  }
}

export async function fetchDraftJobForDocument(
  documentId: string
): Promise<
  | { success: true; data: DraftJobLinkRow | null }
  | { success: false; error: string }
> {
  const result = await fetchDraftJobsForDocuments([documentId]);

  if (!result.success) {
    return result;
  }

  const draftJob = result.data.find((job) => job.primary_document_id === documentId) ?? null;
  return { success: true, data: draftJob };
}

export async function fetchDraftJobById(
  draftJobId: string,
  companyId?: string
): Promise<
  | { success: true; data: DraftJobIdentityRow | null }
  | { success: false; error: string }
> {
  if (!supabase) {
    return { success: false, error: "Supabase configuration not available in preview" };
  }

  try {
    let query = supabase
      .from("draft_jobs")
      .select("id, company_id, primary_document_id, status, created_at")
      .eq("id", draftJobId);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch draft job";
    return { success: false, error: message };
  }
}

/**
 * Generate a secure signed URL for accessing a document in the merchant-documents bucket.
 * The signed URL uses the file_path exactly as stored in uploaded_documents.
 * No path manipulation, prefixing, or encoding is performed.
 *
 * @param filePath - The exact file path from uploaded_documents.file_path
 *   Example: "3fc46433-2dbc-43e1-9fa5-8ed68957d746/uploads/1782662657399-Nook purchase order UKLH 402D.pdf"
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL for secure file access
 */
export async function createMerchantDocumentSignedUrl(
  filePath: string,
  expiresIn = 60 * 10,
  options?: { download?: string | boolean }
): Promise<
  | {
      success: true;
      signedUrl: string;
      debug: MerchantSignedUrlDebug;
    }
  | {
      success: false;
      error: string;
      debug: MerchantSignedUrlDebug;
    }
> {
  const debugBase: MerchantSignedUrlDebug = {
    supabaseProjectUrl: supabaseUrl ?? null,
    supabaseProjectRef: getSupabaseProjectRefFromUrl(),
    bucket: MERCHANT_DOCUMENTS_BUCKET,
    uploadedDocumentFilePath: filePath,
    objectKeyPassedToCreateSignedUrl: filePath,
    expiresIn,
    downloadOption: options?.download ?? null,
    sdkError: null,
  };

  if (!supabase) {
    return {
      success: false,
      error: "Supabase configuration not available in preview",
      debug: {
        ...debugBase,
        sdkError: { message: "Supabase configuration not available in preview" },
      },
    };
  }

  try {
    console.info("[documents:signed-url] createSignedUrl request", {
      supabaseProjectUrl: debugBase.supabaseProjectUrl,
      supabaseProjectRef: debugBase.supabaseProjectRef,
      bucket: debugBase.bucket,
      uploadedDocumentFilePath: debugBase.uploadedDocumentFilePath,
      objectKeyPassedToCreateSignedUrl: debugBase.objectKeyPassedToCreateSignedUrl,
      expiresIn: debugBase.expiresIn,
      downloadOption: debugBase.downloadOption,
    });

    const { data, error } = await supabase.storage
      .from(MERCHANT_DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, expiresIn, options);

    if (error) {
      const sdkError = serializeSdkError(error);
      const trimmedPath = filePath.trim();
      const separatorIndex = trimmedPath.lastIndexOf("/");
      const folderPath = separatorIndex >= 0 ? trimmedPath.slice(0, separatorIndex) : "";
      const objectName = separatorIndex >= 0 ? trimmedPath.slice(separatorIndex + 1) : trimmedPath;

      const { data: folderObjects, error: listError } = await supabase.storage
        .from(MERCHANT_DOCUMENTS_BUCKET)
        .list(folderPath, { limit: 1000 });

      const existingObjectKeys = (folderObjects ?? []).map((item) =>
        folderPath ? `${folderPath}/${item.name}` : item.name
      );
      const objectExists = existingObjectKeys.includes(trimmedPath);

      console.error("[documents:signed-url] createSignedUrl failed", {
        supabaseProjectUrl: debugBase.supabaseProjectUrl,
        supabaseProjectRef: debugBase.supabaseProjectRef,
        bucket: debugBase.bucket,
        uploadedDocumentFilePath: debugBase.uploadedDocumentFilePath,
        objectKeyPassedToCreateSignedUrl: debugBase.objectKeyPassedToCreateSignedUrl,
        expiresIn: debugBase.expiresIn,
        downloadOption: debugBase.downloadOption,
        sdkError,
        storageComparison: {
          listFolderPath: folderPath,
          targetObjectName: objectName,
          listError: listError?.message ?? null,
          objectExists,
          existingObjectKeys,
        },
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
        debug: {
          ...debugBase,
          sdkError,
        },
      };
    }

    console.info("[documents:signed-url] createSignedUrl success", {
      supabaseProjectUrl: debugBase.supabaseProjectUrl,
      supabaseProjectRef: debugBase.supabaseProjectRef,
      bucket: debugBase.bucket,
      objectKeyPassedToCreateSignedUrl: debugBase.objectKeyPassedToCreateSignedUrl,
    });

      if (data?.signedUrl) {
        return {
          success: true,
          signedUrl: data.signedUrl,
          debug: debugBase,
        };
      }

      return {
        success: false,
        error: "Signed URL was not returned by Supabase",
        debug: {
          ...debugBase,
          sdkError: { message: "Signed URL was not returned by Supabase" },
        },
      };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create signed URL";
    const sdkError = serializeSdkError(err);
    console.error("[documents:signed-url] createSignedUrl exception", {
      supabaseProjectUrl: debugBase.supabaseProjectUrl,
      supabaseProjectRef: debugBase.supabaseProjectRef,
      bucket: debugBase.bucket,
      objectKeyPassedToCreateSignedUrl: debugBase.objectKeyPassedToCreateSignedUrl,
      sdkError,
      error: message,
    });
    return {
      success: false,
      error: message,
      debug: {
        ...debugBase,
        sdkError,
      },
    };
  }
}
