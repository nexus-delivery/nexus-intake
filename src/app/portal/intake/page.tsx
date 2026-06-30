"use client";

import { useState } from "react";
import Link from "next/link";
import BookingMethodSelector, {
  type BookingMethod,
} from "@/components/BookingMethodSelector";
import DocumentUploadCard from "@/components/DocumentUploadCard";
import JobDetailsForm, { type JobFormData } from "@/components/JobDetailsForm";
import ReviewJobScreen from "@/components/ReviewJobScreen";
import UploadOcrReviewScreen from "@/components/UploadOcrReviewScreen";
import {
  type UploadedDocumentMetadata,
  confirmJob,
} from "@/lib/supabaseClient";
import { useRuntimeCompanyId } from "@/lib/useRuntimeCompanyId";
import {
  extractUploadToOcrReviewData,
  mapToTrackPodPayload,
  type OcrReviewData,
} from "@/lib/uploadOcr";

type Step = "select_method" | "upload" | "enter_details" | "review" | "confirmed";

export default function MerchantIntakePage() {
  const companyId = useRuntimeCompanyId();
  const [step, setStep] = useState<Step>("select_method");
  const [method, setMethod] = useState<BookingMethod | null>(null);
  const [uploadData, setUploadData] = useState<UploadedDocumentMetadata | null>(null);
  const [ocrReviewData, setOcrReviewData] = useState<OcrReviewData | null>(null);
  const [ocrExtracting, setOcrExtracting] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [jobFormData, setJobFormData] = useState<JobFormData | null>(null);
  const [jobReference, setJobReference] = useState<string | null>(null);
  const [confirmedJobId, setConfirmedJobId] = useState<string | null>(null);
  const [trackPodCollectionOrderId, setTrackPodCollectionOrderId] = useState<string | null>(null);
  const [trackPodOrderId, setTrackPodOrderId] = useState<string | null>(null);
  const [trackPodCollectionTrackingUrl, setTrackPodCollectionTrackingUrl] = useState<string | null>(null);
  const [trackPodDeliveryTrackingUrl, setTrackPodDeliveryTrackingUrl] = useState<string | null>(null);
  const [xeroInvoiceId, setXeroInvoiceId] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<string>("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Intentionally ignore clipboard failures so the workflow remains usable.
    }
  };

  const shareLink = async (value: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Tracking link", url: value });
        return;
      }
      await copyToClipboard(value);
    } catch {
      // Ignore share cancellation/errors and keep the page responsive.
    }
  };

  const emailLink = (value: string) => {
    window.location.href = `mailto:?subject=NEXUS Tracking Link&body=${encodeURIComponent(value)}`;
  };

  const sendNexusEmail = async (kind: "collection" | "delivery" | "documents" | "pod") => {
    if (!emailRecipient) {
      setEmailStatus("Enter recipient email to send from NEXUS.");
      return;
    }

    setEmailStatus("Sending...");

    try {
      const response = await fetch("/api/jobs/send-tracking-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: emailRecipient,
          kind,
          jobReference,
          collectionTrackingUrl: trackPodCollectionTrackingUrl,
          deliveryTrackingUrl: trackPodDeliveryTrackingUrl,
          documentUrl,
          podUrl: trackPodDeliveryTrackingUrl,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        setEmailStatus(
          typeof payload.error === "string" ? payload.error : "Failed to send email from NEXUS."
        );
        return;
      }

      setEmailStatus("Email sent from NEXUS.");
    } catch {
      setEmailStatus("Failed to send email from NEXUS.");
    }
  };

  const handleSelectMethod = (selected: BookingMethod) => {
    setMethod(selected);
    setStep(selected);
  };

  const handleUploadSuccess = (metadata: UploadedDocumentMetadata) => {
    setUploadData(metadata);
    setOcrReviewData(null);
    setOcrError(null);
    setEmailStatus(null);
  };

  const handleUploadStart = () => {
    setUploadData(null);
    setOcrReviewData(null);
    setOcrError(null);
    setConfirmError(null);
  };

  const handleProceedToReview = async () => {
    if (!uploadData) {
      return;
    }
    if (!uploadData.jobId || !uploadData.documentId) {
      setOcrError("Uploaded draft job identity is missing. Please upload again.");
      return;
    }

    setOcrExtracting(true);
    setOcrError(null);

    const extraction = await extractUploadToOcrReviewData(uploadData);

    if (!extraction.success) {
      setOcrError(extraction.error);
      setOcrExtracting(false);
      return;
    }

    setOcrReviewData(extraction.data);
    setOcrExtracting(false);
    setStep("review");
  };

  const handleFormReview = (data: JobFormData) => {
    setJobFormData(data);
    setStep("review");
  };

  const handleBack = () => {
    if (step === "review") {
      setStep(method as Step);
    } else {
      setStep("select_method");
      setMethod(null);
      setUploadData(null);
      setOcrReviewData(null);
    }
    setConfirmError(null);
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    setConfirmError(null);

    if (method === "upload" && !uploadData) {
      setConfirmError("No uploaded document is selected for this review.");
      setIsConfirming(false);
      return;
    }

    if (method === "upload" && (!uploadData?.jobId || !uploadData?.documentId)) {
      setConfirmError("Draft job identity is missing for this upload. Please upload again.");
      setIsConfirming(false);
      return;
    }

    const mappedPayload =
      method === "upload" && ocrReviewData ? mapToTrackPodPayload(ocrReviewData) : null;

    const result = await confirmJob(
      method === "upload"
        ? {
            draftJobId: uploadData?.jobId,
            documentId: uploadData?.documentId,
            trackPodMapping: mappedPayload,
          }
        : {}
    );

    if (result.success) {
      setJobReference(result.jobReference ?? null);
      setConfirmedJobId(result.jobId ?? null);
      setTrackPodCollectionOrderId(result.trackPodCollectionOrderId ?? null);
      setTrackPodOrderId(result.trackPodDeliveryOrderId ?? null);
      setTrackPodCollectionTrackingUrl(result.trackPodCollectionTrackingUrl ?? null);
      setTrackPodDeliveryTrackingUrl(result.trackPodDeliveryTrackingUrl ?? null);
      setXeroInvoiceId(result.xeroDraftInvoiceId ?? null);
      setDocumentUrl(result.documentUrl ?? null);
      setEmailRecipient(ocrReviewData?.email ?? "");
      setEmailStatus(null);
      setStep("confirmed");
    } else {
      setConfirmError(result.error ?? "An error occurred. Please try again.");
    }

    setIsConfirming(false);
  };

  const handleNewBooking = () => {
    setStep("select_method");
    setMethod(null);
    setUploadData(null);
    setOcrReviewData(null);
    setOcrExtracting(false);
    setOcrError(null);
    setJobFormData(null);
    setJobReference(null);
    setConfirmedJobId(null);
    setTrackPodCollectionOrderId(null);
    setTrackPodOrderId(null);
    setTrackPodCollectionTrackingUrl(null);
    setTrackPodDeliveryTrackingUrl(null);
    setXeroInvoiceId(null);
    setDocumentUrl(null);
    setEmailRecipient("");
    setEmailStatus(null);
    setConfirmError(null);
  };

  // ── Step labels for breadcrumb ──────────────────────────────────────────
  const stepLabel: Record<Step, string> = {
    select_method: "Create Job",
    upload: "Upload Document",
    enter_details: "Enter Job Details",
    review: method === "upload" ? "Review Extracted Job" : "Review Job",
    confirmed: "Job Created",
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--nexus-purple)]">
          Upload it
        </p>
        <h1 className="text-2xl font-semibold text-[var(--nexus-graphite)] sm:text-3xl">
          {stepLabel[step]}
        </h1>
        {step === "select_method" && (
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Choose how you would like to create a job.
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Link href="/create-it" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Create It</Link>
          <Link href="/portal/documents" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Documents</Link>
          <Link href="/process-it" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Process It</Link>
          <Link href="/" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Workspace</Link>
        </div>
      </header>

      {/* ── Step 1: Method selector ──────────────────────────────────── */}
      {step === "select_method" && (
        <BookingMethodSelector onSelectMethod={handleSelectMethod} />
      )}

      {/* ── Step 2a: Upload Document ─────────────────────────────────── */}
      {step === "upload" && (
        <div className="space-y-4">
          <DocumentUploadCard
            companyId={companyId}
            onUploadStart={handleUploadStart}
            onUploadSuccess={handleUploadSuccess}
          />

          {uploadData && (
            <>
              {ocrError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {ocrError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={ocrExtracting}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedToReview}
                  disabled={ocrExtracting}
                  className="rounded-lg bg-[var(--nexus-purple)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-[var(--nexus-purple)]/40 disabled:opacity-60"
                >
                  {ocrExtracting ? "Extracting…" : "Review Job"}
                </button>
              </div>
            </>
          )}

          {!uploadData && (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Back
            </button>
          )}
        </div>
      )}

      {/* ── Step 2b: Enter Job Details ───────────────────────────────── */}
      {step === "enter_details" && (
        <JobDetailsForm
          initialData={jobFormData ?? undefined}
          onReview={handleFormReview}
          onSaveDraft={(data) => setJobFormData(data)}
          onBack={handleBack}
        />
      )}

      {/* ── Step 3: Review Job ───────────────────────────────────────── */}
      {step === "review" && method === "upload" && ocrReviewData && (
        <UploadOcrReviewScreen
          key={uploadData?.jobId ?? "upload-review"}
          data={ocrReviewData}
          onChange={setOcrReviewData}
          onBack={handleBack}
          onCreateJob={handleConfirm}
          isCreating={isConfirming}
          error={confirmError}
        />
      )}

      {step === "review" && method === "enter_details" && (
        <ReviewJobScreen
          method="enter_details"
          uploadData={uploadData ?? undefined}
          formData={jobFormData ?? undefined}
          onBack={handleBack}
          onConfirm={handleConfirm}
          isConfirming={isConfirming}
          confirmError={confirmError}
        />
      )}

      {/* ── Step 4: Confirmed ────────────────────────────────────────── */}
      {step === "confirmed" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workflow Status</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Book it",
                "Check it",
                "Process it",
                "Ready for Process It",
                "Job Created",
                "Documents Stored",
                "Continue from Documents",
              ].map((state) => (
                <div key={state} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                  {state}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-5 w-5 text-emerald-600"
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
              <div className="space-y-1">
                <p className="text-lg font-semibold text-emerald-900">
                  Job Created
                </p>
                <p className="text-sm text-emerald-700">
                  NEXUS Transport will now prepare your Job.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-emerald-200 bg-white px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Job Reference
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-[var(--nexus-graphite)]">
                {jobReference}
              </p>
              {confirmedJobId && (
                <p className="mt-1 font-mono text-xs text-slate-400">
                  {confirmedJobId}
                </p>
              )}
              {(trackPodOrderId || xeroInvoiceId) && (
                <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  {trackPodCollectionOrderId && (
                    <p>
                      Track-POD Collection Order ID: <span className="font-mono">{trackPodCollectionOrderId}</span>
                    </p>
                  )}
                  {trackPodOrderId && (
                    <p>
                      Track-POD Delivery Order ID: <span className="font-mono">{trackPodOrderId}</span>
                    </p>
                  )}
                  {xeroInvoiceId && (
                    <p>
                      Xero Draft Invoice ID: <span className="font-mono">{xeroInvoiceId}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {documentUrl && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Document Link</p>
              <p className="mt-2 break-all text-xs text-slate-600">{documentUrl}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/portal/documents"
              className="rounded-lg bg-[var(--nexus-purple)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Documents
            </Link>
            <Link
              href="/process-it"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50"
            >
              Process It
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50"
            >
              Workspace
            </Link>
          </div>

          <button
            type="button"
            onClick={handleNewBooking}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Create Another Job
          </button>
        </div>
      )}
    </div>
  );
}

