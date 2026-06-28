"use client";

import { useState } from "react";
import BookingMethodSelector, {
  type BookingMethod,
} from "@/components/BookingMethodSelector";
import DocumentUploadCard from "@/components/DocumentUploadCard";
import JobDetailsForm, { type JobFormData } from "@/components/JobDetailsForm";
import ReviewJobScreen from "@/components/ReviewJobScreen";
import {
  type UploadedDocumentMetadata,
  confirmJob,
} from "@/lib/supabaseClient";
import { useRuntimeCompanyId } from "@/lib/useRuntimeCompanyId";

type Step = "select_method" | "upload" | "enter_details" | "review" | "confirmed";

export default function MerchantIntakePage() {
  const companyId = useRuntimeCompanyId();
  const [step, setStep] = useState<Step>("select_method");
  const [method, setMethod] = useState<BookingMethod | null>(null);
  const [uploadData, setUploadData] = useState<UploadedDocumentMetadata | null>(null);
  const [jobFormData, setJobFormData] = useState<JobFormData | null>(null);
  const [jobReference, setJobReference] = useState<string | null>(null);
  const [confirmedJobId, setConfirmedJobId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleSelectMethod = (selected: BookingMethod) => {
    setMethod(selected);
    setStep(selected);
  };

  const handleUploadSuccess = (metadata: UploadedDocumentMetadata) => {
    setUploadData(metadata);
  };

  const handleProceedToReview = () => {
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
    }
    setConfirmError(null);
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    setConfirmError(null);

    const result = await confirmJob(
      method === "upload"
        ? { draftJobId: uploadData?.jobId }
        : {}
    );

    if (result.success) {
      setJobReference(result.jobReference ?? null);
      setConfirmedJobId(result.jobId ?? null);
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
    setJobFormData(null);
    setJobReference(null);
    setConfirmedJobId(null);
    setConfirmError(null);
  };

  // ── Step labels for breadcrumb ──────────────────────────────────────────
  const stepLabel: Record<Step, string> = {
    select_method: "Create Job",
    upload: "Upload Document",
    enter_details: "Enter Job Details",
    review: "Review Job",
    confirmed: "Job Created",
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--nexus-purple)]">
          NEXUS Booking
        </p>
        <h1 className="text-2xl font-semibold text-[var(--nexus-graphite)] sm:text-3xl">
          {stepLabel[step]}
        </h1>
        {step === "select_method" && (
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Choose how you would like to create a job.
          </p>
        )}
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
            onUploadSuccess={handleUploadSuccess}
          />

          {uploadData && (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleProceedToReview}
                className="rounded-lg bg-[var(--nexus-purple)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-[var(--nexus-purple)]/40"
              >
                Review Job
              </button>
            </div>
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
      {step === "review" && method && (
        <ReviewJobScreen
          method={method}
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
            </div>
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

