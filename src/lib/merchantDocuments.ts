import type { UploadedDocumentRow } from "@/lib/supabaseClient";

export type DocumentStatus =
  | "Uploaded"
  | "Processing"
  | "Processed"
  | "Needs Review"
  | "Confirmed"
  | "Failed";

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;

export function formatDocumentFileSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < BYTES_PER_KB) return `${bytes} B`;
  if (bytes < BYTES_PER_MB) return `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
  return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
}

export function formatDocumentTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDocumentFileType(value: string): string {
  return value ? value.toUpperCase() : "—";
}

export function toDocumentStatus(value: string): DocumentStatus {
  const normalized = value.trim().toLowerCase();

  switch (normalized) {
    case "uploaded":
    case "document_uploaded":
      return "Uploaded";
    case "processing":
      return "Processing";
    case "processed":
      return "Processed";
    case "needs_review":
    case "needs review":
      return "Needs Review";
    case "confirmed":
    case "job_created":
      return "Confirmed";
    case "failed":
      return "Failed";
    default:
      return "Uploaded";
  }
}

export function resolveDocumentPreviewType(
  document: UploadedDocumentRow
): "pdf" | "image" | "unsupported" {
  const normalizedType = document.file_type.toLowerCase();

  if (normalizedType === "pdf" || normalizedType === "application/pdf") {
    return "pdf";
  }

  if (
    normalizedType === "png" ||
    normalizedType === "image/png" ||
    normalizedType === "jpg" ||
    normalizedType === "jpeg" ||
    normalizedType === "image/jpg" ||
    normalizedType === "image/jpeg" ||
    normalizedType === "webp" ||
    normalizedType === "image/webp"
  ) {
    return "image";
  }

  const value = `${document.file_name} ${document.file_path}`.toLowerCase();

  if (value.includes("pdf")) {
    return "pdf";
  }

  if (
    value.includes("png") ||
    value.includes("jpg") ||
    value.includes("jpeg") ||
    value.includes("webp")
  ) {
    return "image";
  }

  return "unsupported";
}
