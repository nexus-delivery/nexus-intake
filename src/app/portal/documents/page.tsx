"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchCurrentProfile,
  fetchDraftJobsForDocuments,
  fetchUploadedDocuments,
  requestMerchantDocumentSignedUrl,
  type DraftJobLinkRow,
  type UploadedDocumentRow,
} from "@/lib/supabaseClient";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DocumentCard({
  document,
  draftJob,
  busy,
  onView,
  onDownload,
}: {
  document: UploadedDocumentRow;
  draftJob: DraftJobLinkRow | null;
  busy: boolean;
  onView: (document: UploadedDocumentRow) => void;
  onDownload: (document: UploadedDocumentRow) => void;
}) {
  const reviewHref = draftJob
    ? `/portal/documents/${document.id}/review?draftJobId=${encodeURIComponent(draftJob.id)}`
    : "";

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--nexus-graphite)]">
              {document.file_name}
            </h2>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {document.file_type.toUpperCase()}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {document.status}
            </span>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              {draftJob ? draftJob.status : "draft_pending"}
            </span>
          </div>

          <div className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
            <p>Company: {document.company_id}</p>
            <p>Uploaded: {formatDateTime(document.created_at)}</p>
          </div>

          <p className="break-all rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
            {document.file_path}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => onView(document)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            View
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDownload(document)}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--nexus-purple)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Download
          </button>
          {draftJob ? (
            <Link
              href={reviewHref}
              className="inline-flex items-center justify-center rounded-lg border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              {draftJob.status === "job_created" ? "Continue Processing" : "Review / Extract"}
            </Link>
          ) : (
            <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-500">
              Draft job unavailable
            </span>
          )}
          {draftJob?.status === "job_created" && (
            <Link
              href="/process-it"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Create Job Ready
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MerchantDocumentsPage() {
  const [companyId, setCompanyId] = useState<string>("");
  const [documents, setDocuments] = useState<UploadedDocumentRow[]>([]);
  const [draftJobByDocumentId, setDraftJobByDocumentId] = useState<Record<string, DraftJobLinkRow>>({});
  const [loading, setLoading] = useState(true);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<{
    error?: string;
    details?: string;
    userId?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDocuments = async () => {
      setLoading(true);
      setErrorMessage(null);
      setApiError(null);

      const profileResult = await fetchCurrentProfile();
      if (!profileResult.success) {
        if (!cancelled) {
          setDocuments([]);
          setErrorMessage(profileResult.error);
          setLoading(false);
        }
        return;
      }

      if (!profileResult.data.companyId) {
        if (!cancelled) {
          setDocuments([]);
          setErrorMessage("No company is linked to this user");
          setLoading(false);
        }
        return;
      }

      setCompanyId(profileResult.data.companyId);

      const result = await fetchUploadedDocuments(profileResult.data.companyId);
      if (cancelled) {
        return;
      }

      if (result.success) {
        setDocuments(result.data);
        const draftJobsResult = await fetchDraftJobsForDocuments(result.data.map((doc) => doc.id));
        if (!cancelled && draftJobsResult.success) {
          const links = draftJobsResult.data.reduce<Record<string, DraftJobLinkRow>>((acc, draftJob) => {
            const documentId = draftJob.primary_document_id;
            if (!documentId) {
              return acc;
            }
            if (!acc[documentId]) {
              acc[documentId] = draftJob;
            }
            return acc;
          }, {});
          setDraftJobByDocumentId(links);
        }
      } else {
        setErrorMessage(result.error);
      }

      setLoading(false);
    };

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  const openDocument = async (document: UploadedDocumentRow, download: boolean) => {
    setBusyDocumentId(document.id);
    setErrorMessage(null);
    setApiError(null);

    if (!companyId) {
      setErrorMessage("No company is linked to this user");
      setBusyDocumentId(null);
      return;
    }

    if (document.company_id !== companyId) {
      setErrorMessage("You do not have access to this document");
      setBusyDocumentId(null);
      return;
    }

    const result = await requestMerchantDocumentSignedUrl(document.id, {
      download,
    });

    if (!result.success) {
      if (result.apiError) {
        setApiError(result.apiError);
      } else {
        setErrorMessage(`Unable to access document: ${result.error}`);
      }
      setBusyDocumentId(null);
      return;
    }

    window.open(result.signedUrl, "_blank", "noopener,noreferrer");
    setBusyDocumentId(null);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--nexus-purple)]">
          Workspace access
        </p>
        <h1 className="text-2xl font-semibold text-[var(--nexus-graphite)] sm:text-3xl">
          Documents
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
          Upload inbox for review and job creation. Documents remain accessible until you choose to process them.
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Link href="/create-it" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Create It</Link>
          <Link href="/portal/intake" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Upload It</Link>
          <Link href="/process-it" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Process It</Link>
          <Link href="/" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Workspace</Link>
        </div>
      </header>

      {apiError ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Unable to load documents right now. Please try again or contact support if the issue continues.
        </div>
      ) : errorMessage ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500 shadow-sm">
          Loading documents...
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-4">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              draftJob={draftJobByDocumentId[document.id] ?? null}
              busy={busyDocumentId === document.id}
              onView={(selectedDocument) => {
                void openDocument(selectedDocument, false);
              }}
              onDownload={(selectedDocument) => {
                void openDocument(selectedDocument, true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500 shadow-sm">
          No documents found for this merchant.
        </div>
      )}
    </div>
  );
}