"use client";

import { type JobFormData, JOB_REQUIREMENTS } from "@/components/JobDetailsForm";
import { type UploadedDocumentMetadata } from "@/lib/supabaseClient";

type ReviewJobScreenProps = {
  method: "upload" | "enter_details";
  uploadData?: UploadedDocumentMetadata;
  formData?: JobFormData;
  onBack: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
  confirmError?: string | null;
};

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== false) return null;
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="min-w-[180px] shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-[var(--nexus-graphite)]">{value}</dd>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-[var(--nexus-graphite)]">
        {title}
      </h2>
      <dl className="mt-3 divide-y divide-slate-100">{children}</dl>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReviewJobScreen({
  method,
  uploadData,
  formData,
  onBack,
  onConfirm,
  isConfirming,
  confirmError,
}: ReviewJobScreenProps) {
  return (
    <div className="space-y-6">
      {/* Upload path review */}
      {method === "upload" && uploadData && (
        <ReviewSection title="Document">
          <ReviewRow label="File Name" value={uploadData.fileName} />
          <ReviewRow
            label="File Type"
            value={uploadData.fileType.toUpperCase()}
          />
          <ReviewRow
            label="File Size"
            value={formatFileSize(uploadData.fileSize)}
          />
          <ReviewRow
            label="Uploaded At"
            value={new Date(uploadData.uploadedAt).toLocaleString("en-GB")}
          />
          <ReviewRow label="Draft Job ID" value={uploadData.jobId} />
        </ReviewSection>
      )}

      {/* Manual entry path review */}
      {method === "enter_details" && formData && (
        <>
          <ReviewSection title="Customer">
            <ReviewRow label="Customer Name" value={formData.customerName} />
            <ReviewRow
              label="Collection Address"
              value={
                formData.collectionAddress ? (
                  <span className="whitespace-pre-wrap">
                    {formData.collectionAddress}
                  </span>
                ) : null
              }
            />
            <ReviewRow
              label="Delivery Address"
              value={
                formData.deliveryAddress ? (
                  <span className="whitespace-pre-wrap">
                    {formData.deliveryAddress}
                  </span>
                ) : null
              }
            />
            <ReviewRow
              label="Collection Contact"
              value={formData.collectionContact || null}
            />
            <ReviewRow
              label="Delivery Contact"
              value={formData.deliveryContact || null}
            />
          </ReviewSection>

          <ReviewSection title="Goods">
            <ReviewRow
              label="Description"
              value={
                formData.goodsDescription ? (
                  <span className="whitespace-pre-wrap">
                    {formData.goodsDescription}
                  </span>
                ) : null
              }
            />
            <ReviewRow label="Boxes" value={formData.boxes || null} />
            <ReviewRow label="Pallets" value={formData.pallets || null} />
            <ReviewRow label="Weight" value={formData.weight || null} />
            <ReviewRow label="Dimensions" value={formData.dimensions || null} />
            <ReviewRow
              label="Declared Value"
              value={formData.declaredValue || null}
            />
          </ReviewSection>

          <ReviewSection title="Transport">
            <ReviewRow
              label="Collection Date"
              value={
                formData.collectionDate
                  ? new Date(formData.collectionDate).toLocaleDateString(
                      "en-GB"
                    )
                  : null
              }
            />
            <ReviewRow
              label="Delivery Date"
              value={
                formData.deliveryDate
                  ? new Date(formData.deliveryDate).toLocaleDateString("en-GB")
                  : null
              }
            />
            {JOB_REQUIREMENTS.filter(({ key }) => formData[key]).map(
              ({ key, label }) => (
                <ReviewRow key={key} label={label} value="Required" />
              )
            )}
            <ReviewRow
              label="Special Instructions"
              value={
                formData.specialInstructions ? (
                  <span className="whitespace-pre-wrap">
                    {formData.specialInstructions}
                  </span>
                ) : null
              }
            />
          </ReviewSection>
        </>
      )}

      {/* Error */}
      {confirmError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {confirmError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isConfirming}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className="rounded-lg bg-[var(--nexus-purple)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-[var(--nexus-purple)]/40 disabled:opacity-60"
        >
          {isConfirming ? "Confirming…" : "Confirm Job"}
        </button>
      </div>
    </div>
  );
}
