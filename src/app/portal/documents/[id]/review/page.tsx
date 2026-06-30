"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import UploadOcrReviewScreen from "@/components/UploadOcrReviewScreen";
import {
  confirmJob,
  createDraftJob,
  fetchCurrentProfile,
  fetchDraftJobForDocument,
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
  const documentId = useMemo(
    () => (typeof params.id === "string" ? params.id : ""),
    [params.id]
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

      let draftJobId: string | null = null;
      const draftJobResult = await fetchDraftJobForDocument(documentId);
      if (draftJobResult.success && draftJobResult.data?.id) {
        draftJobId = draftJobResult.data.id;
      } else {
        const createResult = await createDraftJob({
          primaryDocumentId: documentId,
          companyId: profileResult.data.companyId,
        });
        if (!createResult.success || !createResult.jobId) {
          if (!cancelled) {
            setError(createResult.error ?? "Unable to link document to a draft job.");
            setLoading(false);
          }
          return;
        }
        draftJobId = createResult.jobId;
      }

      const builtMetadata = toMetadata(documentResult.data, draftJobId);
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
  }, [documentId]);

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
