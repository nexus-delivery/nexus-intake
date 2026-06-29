"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DocumentStatusBadge from "@/components/DocumentStatusBadge";
import { fetchCompanyById } from "@/lib/authOnboarding";
import {
  formatDocumentFileSize,
  formatDocumentTimestamp,
  resolveDocumentPreviewType,
  toDocumentStatus,
} from "@/lib/merchantDocuments";
import {
  fetchCurrentProfile,
  fetchDraftJobForDocument,
  requestMerchantDocumentSignedUrl,
  fetchUploadedDocumentById,
  type DraftJobLinkRow,
  type UploadedDocumentRow,
} from "@/lib/supabaseClient";

function MetadataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-[var(--nexus-graphite)]">{value}</dd>
    </div>
  );
}

export default function MerchantDocumentViewerPage() {
  const params = useParams<{ id: string }>();
  const documentId = typeof params.id === "string" ? params.id : "";
  const [document, setDocument] = useState<UploadedDocumentRow | null>(null);
  const [draftJob, setDraftJob] = useState<DraftJobLinkRow | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      if (!documentId) {
        setPageError("Document not found or you do not have access.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError(null);
      setPreviewError(null);
      try {
        const profileResult = await fetchCurrentProfile();
        if (!profileResult.success) {
          if (!cancelled) {
            setPageError(profileResult.error);
            setLoading(false);
          }
          return;
        }

        const documentResult = await fetchUploadedDocumentById(
          documentId,
          profileResult.data.companyId
        );

        if (!documentResult.success) {
          if (!cancelled) {
            setPageError(documentResult.error);
            setLoading(false);
          }
          return;
        }

        if (!documentResult.data) {
          if (!cancelled) {
            setPageError("You do not have access to this document");
            setLoading(false);
          }
          return;
        }

        if (documentResult.data.company_id !== profileResult.data.companyId) {
          if (!cancelled) {
            setPageError("You do not have access to this document");
            setLoading(false);
          }
          return;
        }

        const [signedUrlResult, draftJobResult, companyResult] = await Promise.all([
          requestMerchantDocumentSignedUrl(documentResult.data.id),
          fetchDraftJobForDocument(documentResult.data.id),
          fetchCompanyById(documentResult.data.company_id),
        ]);

        if (!draftJobResult.success) {
          if (!cancelled) {
            setPageError(draftJobResult.error);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setDocument(documentResult.data);
          setDraftJob(draftJobResult.data);
          setCompanyName(companyResult?.name ?? null);
          setSignedUrl(signedUrlResult.success ? signedUrlResult.signedUrl : null);
          setPreviewError(signedUrlResult.success ? null : signedUrlResult.error);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setPageError(
            err instanceof Error ? err.message : "Failed to load the requested document"
          );
          setLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  async function handleDownload() {
    if (!document) {
      return;
    }

    setIsDownloading(true);

    const signedUrlResult = await requestMerchantDocumentSignedUrl(document.id, {
      download: true,
    });

    if (signedUrlResult.success) {
      window.open(signedUrlResult.signedUrl, "_blank", "noopener,noreferrer");
    } else {
      setPreviewError(signedUrlResult.error);
    }

    setIsDownloading(false);
  }
  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-sm text-slate-500 shadow-sm">
          Loading document...
        </div>
      </div>
    );
  }

  if (pageError || !document) {
    return (
      <div className="space-y-6 pb-8">
        <Link
          href="/portal/documents"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nexus-purple)] transition hover:text-violet-700"
        >
          <span aria-hidden="true">←</span>
          Back to documents
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-sm text-red-700 shadow-sm">
          {pageError ?? "Document not found or you do not have access."}
        </div>
      </div>
    );
  }

  const previewType = resolveDocumentPreviewType(document);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/portal/documents"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nexus-purple)] transition hover:text-violet-700"
          >
            <span aria-hidden="true">←</span>
            Back to documents
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--nexus-purple)]">
              Merchant Portal
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--nexus-graphite)] sm:text-3xl">
              {document.file_name}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={isDownloading}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--nexus-purple)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? "Preparing download..." : "Download"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--nexus-graphite)]">
            Document metadata
          </h2>
          <dl className="mt-4">
            <MetadataRow label="Status" value={<DocumentStatusBadge status={toDocumentStatus(document.status)} />} />
            <MetadataRow label="Uploaded" value={formatDocumentTimestamp(document.created_at)} />
            <MetadataRow label="File type" value={document.file_type.toUpperCase()} />
            <MetadataRow label="File size" value={formatDocumentFileSize(document.file_size)} />
            <MetadataRow label="Company" value={companyName ?? document.company_id} />
            <MetadataRow label="Company ID" value={document.company_id} />
            <MetadataRow label="File path" value={<span className="break-all">{document.file_path}</span>} />
            <MetadataRow
              label="Linked draft job"
              value={
                draftJob ? (
                  <div className="space-y-1">
                    <p>{draftJob.id}</p>
                    <p className="text-xs text-slate-500">{draftJob.status}</p>
                  </div>
                ) : (
                  "—"
                )
              }
            />
          </dl>

        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--nexus-graphite)]">
              Preview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Secure preview generated from the private merchant-documents bucket.
            </p>
          </div>

          {previewError && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {previewError}
            </div>
          )}

          {signedUrl && previewType === "pdf" && (
            <iframe
              title={document.file_name}
              src={signedUrl}
              className="h-[70vh] w-full rounded-xl border border-slate-200"
            />
          )}

          {signedUrl && previewType === "image" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={document.file_name}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
          )}

          {previewType === "unsupported" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-sm text-slate-600">
              Preview is not available for this file type. Use the download button to
              open the original document securely.
            </div>
          )}

          {!signedUrl && previewType !== "unsupported" && !previewError && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-sm text-slate-600">
              Preview is being prepared.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
