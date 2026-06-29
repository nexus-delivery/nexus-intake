"use client";

import { useEffect, useState } from "react";
import {
  fetchCurrentProfile,
  fetchUploadedDocuments,
  requestMerchantDocumentSignedUrl,
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
  busy,
  onView,
  onDownload,
}: {
  document: UploadedDocumentRow;
  busy: boolean;
  onView: (document: UploadedDocumentRow) => void;
  onDownload: (document: UploadedDocumentRow) => void;
}) {
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
        </div>
      </div>
    </article>
  );
}

export default function MerchantDocumentsPage() {
  const [companyId, setCompanyId] = useState<string>("");
  const [documents, setDocuments] = useState<UploadedDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDocuments = async () => {
      setLoading(true);
      setErrorMessage(null);

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
      setErrorMessage(`Unable to access document: ${result.error}`);
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
          Merchant Portal
        </p>
        <h1 className="text-2xl font-semibold text-[var(--nexus-graphite)] sm:text-3xl">
          Documents
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
          View or download merchant documents stored in Supabase Storage.
        </p>
      </header>

      {errorMessage && (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

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