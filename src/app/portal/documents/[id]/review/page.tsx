"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import UploadOcrReviewScreen from "@/components/UploadOcrReviewScreen";
import {
  confirmJob,
  fetchDraftJobById,
  fetchCurrentProfile,
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

  useEffect(() => {
    let cancelled = false;

    async function loadReview() {
      if (!documentId) {
        setError("Document ID is missing.");
        setLoading(false);
        return;
      }
      if (!draftJobId) {
        setError("Draft job ID is missing. Open this review from the Documents inbox.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setCreateError(null);

      const profileResult = await fetchCurrentProfile();
      if (!profileResult.success) {
        if (!cancelled) {
          setError(profileResult.error);
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
          setError(documentResult.success ? "Document not found." : documentResult.error);
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
          setError(draftJobResult.error);
          setLoading(false);
        }
        return;
      }
      if (!draftJobResult.data) {
        if (!cancelled) {
          setError("Draft job not found for this company.");
          setLoading(false);
        }
        return;
      }
      if (draftJobResult.data.primary_document_id !== documentId) {
        if (!cancelled) {
          setError("Draft job does not match the selected uploaded document.");
          setLoading(false);
        }
        return;
      }

      const builtMetadata = toMetadata(documentResult.data, draftJobResult.data.id);
      const extraction = await extractUploadToOcrReviewData(builtMetadata);

      if (!extraction.success) {
        if (!cancelled) {
          setError(extraction.error);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setMetadata(builtMetadata);
        setReviewData(extraction.data);
        setLoading(false);
      }
    }

    void loadReview();

    return () => {
      cancelled = true;
    };
  }, [documentId, draftJobId]);

  async function handleCreateJob() {
    if (!metadata || !reviewData) return;
    setIsCreating(true);
    setCreateError(null);

    const result = await confirmJob({
      draftJobId: metadata.jobId,
      documentId: metadata.documentId,
      trackPodMapping: mapToTrackPodPayload(reviewData),
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
        <Link href="/portal/intake" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Upload It</Link>
        <Link href="/portal/documents" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Documents</Link>
        <Link href="/process-it" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Process It</Link>
        <Link href="/" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Workspace</Link>
      </div>

      {createdRef && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
          Job created: {createdRef}
        </div>
      )}

      <UploadOcrReviewScreen
        data={reviewData}
        onChange={setReviewData}
        onBack={() => router.push("/portal/documents")}
        onCreateJob={() => void handleCreateJob()}
        isCreating={isCreating}
        error={createError}
      />
    </div>
  );
}
