"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DocumentStatusBadge from "@/components/DocumentStatusBadge";
import { fetchCompanyById } from "@/lib/authOnboarding";
import {
  createMerchantDocumentSignedUrl,
  fetchCurrentProfile,
  fetchDraftJobsForDocuments,
  fetchUploadedDocuments,
  type DraftJobLinkRow,
  type UploadedDocumentRow,
} from "@/lib/supabaseClient";

type DocumentStatus =
  | "Uploaded"
  | "Processing"
  | "Processed"
  | "Needs Review"
  | "Confirmed"
  | "Failed";

type PortalDocumentRow = UploadedDocumentRow & {
  draftJob: DraftJobLinkRow | null;
};

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileType(value: string): string {
  return value ? value.toUpperCase() : "—";
}

function toDocumentStatus(value: string): DocumentStatus {
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

function mergeDocumentsWithDraftJobs(
  documents: UploadedDocumentRow[],
  draftJobs: DraftJobLinkRow[]
): PortalDocumentRow[] {
  return documents.map((document) => ({
    ...document,
    draftJob:
      draftJobs.find((job) => job.primary_document_id === document.id) ?? null,
  }));
}

export default function MerchantDocumentsPage() {
  const [documents, setDocuments] = useState<PortalDocumentRow[]>([]);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setLoading(true);
      setError(null);
      try {
        const profileResult = await fetchCurrentProfile();
        if (!profileResult.success) {
          if (!cancelled) {
            setError(profileResult.error);
            setLoading(false);
          }
          return;
        }

        const { companyId } = profileResult.data;

        const [documentsResult, companyResult] = await Promise.all([
          fetchUploadedDocuments(companyId),
          fetchCompanyById(companyId),
        ]);

        if (!documentsResult.success) {
          if (!cancelled) {
            setError(documentsResult.error);
            setLoading(false);
          }
          return;
        }

        const draftJobsResult = await fetchDraftJobsForDocuments(
          documentsResult.data.map((document) => document.id)
        );

        if (!draftJobsResult.success) {
          if (!cancelled) {
            setError(draftJobsResult.error);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setCompanyName(companyResult?.name ?? null);
          setDocuments(
            mergeDocumentsWithDraftJobs(documentsResult.data, draftJobsResult.data)
          );
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load documents");
          setLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDownload(document: PortalDocumentRow) {
    setDownloadingId(document.id);

    const signedUrlResult = await createMerchantDocumentSignedUrl(document.file_path);

    if (signedUrlResult.success) {
      window.open(signedUrlResult.data.signedUrl, "_blank", "noopener,noreferrer");
    } else {
      setError(signedUrlResult.error);
    }

    setDownloadingId(null);
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--nexus-purple)]">
          Merchant Portal
        </p>
        <h1 className="text-2xl font-semibold text-[var(--nexus-graphite)] sm:text-3xl">
          Documents
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          View uploaded documents for your company, open secure previews, and
          download original files.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-6 py-12 text-sm text-slate-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="px-6 py-12 text-sm text-slate-500">
            Uploaded documents will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Draft job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((document) => (
                  <tr key={document.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 align-top">
                      <div>
                        <p className="text-sm font-semibold text-[var(--nexus-graphite)]">
                          {document.file_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{document.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-slate-600">
                      {formatFileType(document.file_type)}
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-slate-600">
                      {formatFileSize(document.file_size)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <DocumentStatusBadge status={toDocumentStatus(document.status)} />
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-slate-600">
                      {formatTimestamp(document.created_at)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-sm text-slate-700">
                        {companyName ?? document.company_id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{document.company_id}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {document.draftJob ? (
                        <div className="text-sm text-slate-700">
                          <p className="font-medium">{document.draftJob.id}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {document.draftJob.status}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/portal/documents/${document.id}`}
                          className="text-sm font-medium text-[var(--nexus-purple)] transition hover:text-violet-700"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDownload(document)}
                          disabled={downloadingId === document.id}
                          className="text-sm font-medium text-sky-600 transition hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {downloadingId === document.id ? "Preparing..." : "Download"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
