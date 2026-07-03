"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import UploadOcrReviewScreen from "@/components/UploadOcrReviewScreen";
import {
  confirmJob,
  fetchDraftJobById,
  fetchCurrentProfile,
  requestMerchantDocumentSignedUrl,
  fetchUploadedDocumentById,
  type UploadedDocumentMetadata,
} from "@/lib/supabaseClient";
import {
  extractUploadToOcrReviewData,
  mapToTrackPodPayload,
  type OcrReviewData,
} from "@/lib/uploadOcr";

function toMetadata(
  document: {
    id: string;
    company_id: string;
    file_name: string;
    file_type: string;
    file_size: number | null;
    file_path: string;
    created_at: string;
  },
  jobId: string
): UploadedDocumentMetadata {
  return {
    documentId: document.id,
    jobId,
    companyId: document.company_id,
    fileName: document.file_name,
    fileType: document.file_type,
    fileSize: document.file_size ?? 0,
    filePath: document.file_path,
    permanentUrl: `/portal/documents/${document.id}`,
    secureUrl: `/api/merchant-documents/signed-url?document_id=${encodeURIComponent(document.id)}`,
    uploadedAt: document.created_at,
  };
}

export default function DocumentReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = useMemo(
    () => (typeof params.id === "string" ? params.id : ""),
    [params.id]
  );
  const draftJobId = useMemo(
    () => (searchParams.get("draftJobId") ?? "").trim(),
    [searchParams]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<UploadedDocumentMetadata | null>(null);
  const [reviewData, setReviewData] = useState<OcrReviewData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdRef, setCreatedRef] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const REVIEW_LOAD_ERROR = "This upload could not be loaded.";

  useEffect(() => {
    let cancelled = false;

    async function loadReview() {
      if (!documentId) {
        setError(REVIEW_LOAD_ERROR);
        setLoading(false);
        return;
      }
      if (!draftJobId) {
        console.info("Review requested draft_job_id:", "<missing>");
        setError(REVIEW_LOAD_ERROR);
        setLoading(false);
        return;
      }

      console.info("Review requested draft_job_id:", draftJobId);

      setLoading(true);
      setError(null);
      setCreateError(null);

      const profileResult = await fetchCurrentProfile();
      if (!profileResult.success) {
        if (!cancelled) {
          setError(REVIEW_LOAD_ERROR);
          setLoading(false);
        }
        return;
      }

      const documentResult = await fetchUploadedDocumentById(
        documentId,
        profileResult.data.companyId
      );

      if (!documentResult.success || !documentResult.data) {
        if (!cancelled) {
          setError(REVIEW_LOAD_ERROR);
          setLoading(false);
        }
        return;
      }

      const draftJobResult = await fetchDraftJobById(
        draftJobId,
        profileResult.data.companyId
      );
      if (!draftJobResult.success) {
        if (!cancelled) {
          setError(REVIEW_LOAD_ERROR);
          setLoading(false);
        }
        return;
      }
      if (!draftJobResult.data) {
        if (!cancelled) {
          setError(REVIEW_LOAD_ERROR);
          setLoading(false);
        }
        return;
      }
      if (draftJobResult.data.primary_document_id !== documentId) {
        if (!cancelled) {
          setError(REVIEW_LOAD_ERROR);
          setLoading(false);
        }
        return;
      }

      console.info("Review loaded draft_job_id:", draftJobResult.data.id);

      const builtMetadata = toMetadata(documentResult.data, draftJobResult.data.id);
      const extraction = await extractUploadToOcrReviewData(builtMetadata);

      if (!extraction.success) {
        if (!cancelled) {
          setError(REVIEW_LOAD_ERROR);
          setLoading(false);
        }
        return;
      }

      const signedUrlResult = await requestMerchantDocumentSignedUrl(documentId);

      console.info("[review] loaded-fields", {
        draft_job_id: draftJobResult.data.id,
        document_id: documentId,
        loaded_fields: mapToTrackPodPayload(extraction.data),
      });

      if (!cancelled) {
        setMetadata(builtMetadata);
        setReviewData(extraction.data);
        setPreviewUrl(signedUrlResult.success ? signedUrlResult.signedUrl : null);
        setLoading(false);
      }
    }

    void loadReview();

    return () => {
      cancelled = true;
    };
  }, [documentId, draftJobId]);

  async function handleCreateJob(options: { readyForTrackPod: boolean }) {
    if (!metadata || !reviewData) return;
    setIsCreating(true);
    setCreateError(null);

    const result = await confirmJob({
      draftJobId: metadata.jobId,
      documentId: metadata.documentId,
      trackPodMapping: mapToTrackPodPayload(reviewData),
      readyForTrackPod: options.readyForTrackPod,
    });

    if (!result.success) {
      setCreateError(result.error ?? "Unable to create job from this document.");
      setIsCreating(false);
      return;
    }

    setCreatedRef(result.jobReference ?? null);
    setIsCreating(false);
    router.push("/process-it");
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-8">
        <Link
          href="/portal/documents"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nexus-purple)] hover:text-violet-700"
        >
          <span aria-hidden="true">←</span>
          Back to documents
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">
          Loading review...
        </div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="space-y-4 pb-8">
        <Link
          href="/portal/documents"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nexus-purple)] hover:text-violet-700"
        >
          <span aria-hidden="true">←</span>
          Back to documents
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-sm text-red-700">
          {error ?? "Unable to load review for this document."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <Link
        href="/portal/documents"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nexus-purple)] hover:text-violet-700"
      >
        <span aria-hidden="true">←</span>
        Back to documents
      </Link>
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600">
          Draft Job: {metadata?.jobId}
        </span>
        <Link href="/portal/documents" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Documents</Link>
        <Link href="/portal/documents" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Documents</Link>
        <Link href="/process-it" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Process It</Link>
        <Link href="/" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Workspace</Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Uploaded document</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">File:</span> {metadata?.fileName}</p>
            <p><span className="font-semibold text-slate-900">Document ID:</span> {metadata?.documentId}</p>
            <p><span className="font-semibold text-slate-900">Draft Job ID:</span> {metadata?.jobId}</p>
            {previewUrl ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open document preview
              </a>
            ) : (
              <p className="text-xs text-slate-500">Document preview link unavailable.</p>
            )}
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Extraction confidence</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-700">
            <p>
              Collection date: <span className={reviewData.collectionDateConfidence === "high" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{reviewData.collectionDateConfidence}</span>
            </p>
            <p>
              Delivery date: <span className={reviewData.deliveryDateConfidence === "high" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{reviewData.deliveryDateConfidence}</span>
            </p>
            <p className="text-xs text-slate-500">Low-confidence fields stay editable and are never replaced by another draft job.</p>
          </div>
        </article>
      </section>

      {createdRef && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
          Job created: {createdRef}
        </div>
      )}

      <UploadOcrReviewScreen
        data={reviewData}
        onChange={setReviewData}
        onBack={() => router.push("/portal/documents")}
        onCreateJob={(options) => void handleCreateJob(options)}
        isCreating={isCreating}
        error={createError}
      />
    </div>
  );
}
