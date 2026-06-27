import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const missingSupabaseEnvError =
  "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY";

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(missingSupabaseEnvError);
  }

  return createClient(supabaseUrl, supabaseAnonKey) as SupabaseClient;
}

/**
 * Upload a PDF file to Supabase Storage
 * @param file - The PDF file to upload
 * @param companyId - The company ID for the file path
 * @returns Object with success status and file path or error message
 */
export async function uploadPdfToStorage(
  file: File,
  companyId: string = "724ef0a7-4371-4350-9e59-ab93a960183f"
) {
  if (file.type !== "application/pdf") {
    return { success: false, error: "Only PDF files are supported" };
  }

  const timestamp = Date.now();
  const rawFileName = file.name.replace(/\.pdf$/i, "");
  const fileName = `${rawFileName}.pdf`;
  const filePath = `${companyId}/uploads/${timestamp}-${fileName}`;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
      .from("delivery-notes")
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
 * Insert a document record into the uploaded_documents table
 * @param params - Document metadata
 * @returns Object with success status and inserted row or error message
 */
export async function insertUploadedDocument(params: {
  fileName: string;
  filePath: string;
  companyId?: string;
}) {
  const companyId = params.companyId || "724ef0a7-4371-4350-9e59-ab93a960183f"; // TODO: replace with authenticated company_id when available

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("uploaded_documents").insert({
      company_id: companyId,
      file_name: params.fileName,
      file_path: params.filePath,
      file_type: "pdf",
      document_type: "delivery_note",
      status: "uploaded",
      created_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database insert failed";
    return { success: false, error: message };
  }
}

export type UploadedDocumentRow = {
  id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  document_type: string;
  status: string;
  created_at: string;
};

export async function fetchUploadedDocuments(companyId?: string): Promise<
  | { success: true; data: UploadedDocumentRow[] }
  | { success: false; error: string }
> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from("uploaded_documents")
      .select(
        "id, company_id, file_name, file_path, file_type, document_type, status, created_at"
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

/**
 * Handle complete document upload flow: storage + database
 */
export async function uploadDocument(
  file: File,
  companyId?: string
): Promise<{
  success: boolean;
  error?: string;
  filePath?: string;
}> {
  const storageResult = await uploadPdfToStorage(file, companyId || "724ef0a7-4371-4350-9e59-ab93a960183f");

  if (!storageResult.success) {
    return { success: false, error: storageResult.error };
  }

  const dbResult = await insertUploadedDocument({
    fileName: file.name,
    filePath: storageResult.filePath!,
    companyId,
  });

  if (!dbResult.success) {
    return { success: false, error: dbResult.error };
  }

  return { success: true, filePath: storageResult.filePath };
}
