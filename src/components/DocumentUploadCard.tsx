"use client";

import { useState } from "react";
import { uploadMultiFormatDocument, type UploadedDocumentMetadata } from "@/lib/supabaseClient";

type UploadState = "idle" | "uploading" | "success" | "error";

type DocumentUploadCardProps = {
  onUploadComplete?: (fileName: string) => void;
  onUploadError?: (error: string) => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  png: "PNG",
  jpg: "JPG",
  jpeg: "JPEG",
};

export default function DocumentUploadCard({
  onUploadComplete,
  onUploadError,
}: DocumentUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [metadata, setMetadata] = useState<UploadedDocumentMetadata | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (uploadState !== "uploading") {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setUploadState("uploading");
    setErrorMessage("");
    setMetadata(null);

    const result = await uploadMultiFormatDocument(file);

    if (result.success && result.metadata) {
      setUploadState("success");
      setMetadata(result.metadata);
      onUploadComplete?.(result.metadata.fileName);
    } else {
      setUploadState("error");
      const error = result.error || "Upload failed";
      setErrorMessage(error);
      onUploadError?.(error);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleReset = () => {
    setUploadState("idle");
    setErrorMessage("");
    setMetadata(null);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-[24px] border-2 border-dashed p-8 transition ${
        isDragging && uploadState !== "uploading"
          ? "border-sky-500 bg-sky-50"
          : uploadState === "success"
            ? "border-emerald-300 bg-emerald-50"
            : uploadState === "error"
              ? "border-red-300 bg-red-50"
              : "border-slate-300 bg-white hover:border-sky-400 hover:bg-slate-50"
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {uploadState === "uploading" && (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          </div>
        )}

        {uploadState !== "uploading" && uploadState !== "success" && (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
            <svg
              className="h-8 w-8 text-sky-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
        )}

        {uploadState === "success" && (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}

        <div className="text-center">
          {uploadState === "idle" && (
            <>
              <p className="text-base font-semibold text-slate-900">
                Drag and drop your document here
              </p>
              <p className="mt-1 text-sm text-slate-500">
                or use the button below to browse
              </p>
            </>
          )}

          {uploadState === "uploading" && (
            <>
              <p className="text-base font-semibold text-slate-900">
                Uploading your document...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while we store your file
              </p>
            </>
          )}

          {uploadState === "success" && metadata && (
            <div className="space-y-3 text-left">
              <p className="text-center text-base font-semibold text-emerald-900">
                Document Uploaded
              </p>
              <div className="rounded-xl border border-emerald-200 bg-white p-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-slate-900 truncate" title={metadata.fileName}>{metadata.fileName}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {FILE_TYPE_LABELS[metadata.fileType] ?? metadata.fileType.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    <span>{formatFileSize(metadata.fileSize)}</span>
                    <span>·</span>
                    <span>{formatTimestamp(metadata.uploadedAt)}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2">
                    <span className="text-xs text-slate-400">Draft Job: </span>
                    <span className="font-mono text-xs text-slate-600">{metadata.jobId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {uploadState === "error" && (
            <>
              <p className="text-base font-semibold text-red-900">
                Upload failed
              </p>
              <p className="mt-1 text-sm text-red-700">
                {errorMessage}
              </p>
            </>
          )}
        </div>

        {uploadState === "idle" && (
          <>
            <button
              type="button"
              className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:bg-sky-800"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Choose File
            </button>

            <input
              id="file-upload"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <p className="text-xs text-slate-400">Supported formats: PDF, PNG, JPG, JPEG</p>
          </>
        )}

        {(uploadState === "success" || uploadState === "error") && (
          <>
            <button
              type="button"
              className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:bg-sky-800"
              onClick={() => {
                handleReset();
                document.getElementById("file-upload-retry")?.click();
              }}
            >
              {uploadState === "success" ? "Upload Another" : "Try Again"}
            </button>

            <input
              id="file-upload-retry"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </>
        )}
      </div>
    </div>
  );
}
