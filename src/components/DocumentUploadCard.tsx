"use client";

import { useState } from "react";
import { uploadDocument } from "@/lib/supabaseClient";

type UploadState = "idle" | "uploading" | "success" | "error";

type DocumentUploadCardProps = {
  onUploadComplete?: (fileName: string) => void;
  onUploadError?: (error: string) => void;
};

export default function DocumentUploadCard({
  onUploadComplete,
  onUploadError,
}: DocumentUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

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
    if (file.type !== "application/pdf") {
      const error = "Only PDF files are supported";
      setErrorMessage(error);
      setUploadState("error");
      onUploadError?.(error);
      return;
    }

    setUploadState("uploading");
    setErrorMessage("");

    const result = await uploadDocument(file);

    if (result.success) {
      setUploadState("success");
      setUploadedFileName(file.name);
      onUploadComplete?.(file.name);
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setUploadState("idle");
        setUploadedFileName("");
      }, 3000);
    } else {
      setUploadState("error");
      setErrorMessage(result.error || "Upload failed");
      onUploadError?.(result.error || "Upload failed");
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
                Drag and drop your PDF here
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
                Please wait while we process your file
              </p>
            </>
          )}

          {uploadState === "success" && (
            <>
              <p className="text-base font-semibold text-emerald-900">
                Upload successful!
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                {uploadedFileName} has been uploaded
              </p>
            </>
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
            <label htmlFor="file-upload" className="cursor-pointer">
              <button
                type="button"
                className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:bg-sky-800"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Upload PDF
              </button>
            </label>

            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <p className="text-xs text-slate-400">Supported format: PDF</p>
          </>
        )}

        {uploadState !== "idle" && uploadState !== "uploading" && (
          <label htmlFor="file-upload-retry" className="cursor-pointer">
            <button
              type="button"
              className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:bg-sky-800"
              onClick={() => {
                setUploadState("idle");
                setErrorMessage("");
                setUploadedFileName("");
                document.getElementById("file-upload-retry")?.click();
              }}
            >
              {uploadState === "success" ? "Upload Another" : "Try Again"}
            </button>
          </label>
        )}

        <input
          id="file-upload-retry"
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
