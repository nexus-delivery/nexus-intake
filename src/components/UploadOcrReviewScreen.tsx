"use client";

import { useMemo, useState } from "react";

import {
  formatDocumentTypeLabel,
  mapToTrackPodPayload,
  type OcrReviewData,
  type PriorityLevel,
} from "@/lib/uploadOcr";

type UploadOcrReviewScreenProps = {
  data: OcrReviewData;
  onChange: (next: OcrReviewData) => void;
  onBack: () => void;
  onCreateJob: (options: { readyForTrackPod: boolean }) => void;
  isCreating: boolean;
  error?: string | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const HOLD_RELEASE_THRESHOLD_DAYS = 10;

function parseDateOnly(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateLabel(value: Date | null): string {
  if (!value) return "";
  return value.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const priorityOptions: PriorityLevel[] = ["Not Set", "High", "Normal", "Low"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-[var(--nexus-graphite)]">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-[var(--nexus-graphite)]"
    >
      {label}
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </label>
  );
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[var(--nexus-graphite)] placeholder-slate-400 focus:border-[var(--nexus-purple)] focus:outline-none focus:ring-2 focus:ring-[var(--nexus-purple)]/20";

const textareaClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[var(--nexus-graphite)] placeholder-slate-400 focus:border-[var(--nexus-purple)] focus:outline-none focus:ring-2 focus:ring-[var(--nexus-purple)]/20 resize-y";

export default function UploadOcrReviewScreen({
  data,
  onChange,
  onBack,
  onCreateJob,
  isCreating,
  error,
}: UploadOcrReviewScreenProps) {
  const trackPodPreview = mapToTrackPodPayload(data);
  const [trackPodReleaseDecision, setTrackPodReleaseDecision] = useState<"send_now" | "hold_for_date">("send_now");
  const needsCollectionDateInput = !data.collectionDate || data.collectionDateConfidence === "low";
  const needsDeliveryDateInput = !data.deliveryDate || data.deliveryDateConfidence === "low";

  const deliveryDate = useMemo(() => parseDateOnly(data.deliveryDate), [data.deliveryDate]);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const daysUntilDelivery = useMemo(() => {
    if (!deliveryDate) return 0;
    return Math.floor((deliveryDate.getTime() - today.getTime()) / MS_PER_DAY);
  }, [deliveryDate, today]);
  const hasFutureDateWarning = deliveryDate !== null && daysUntilDelivery > HOLD_RELEASE_THRESHOLD_DAYS;
  const holdReleaseDate = useMemo(() => {
    if (!deliveryDate) return null;
    return new Date(deliveryDate.getTime() - HOLD_RELEASE_THRESHOLD_DAYS * MS_PER_DAY);
  }, [deliveryDate]);

  const setField = <K extends keyof OcrReviewData>(field: K, value: OcrReviewData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Extracted Document
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--nexus-graphite)]">
              {formatDocumentTypeLabel(data.documentType)}
            </p>
          </div>
          <span className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600">
            Nexus it review
          </span>
        </div>
      </div>

      <Section title="Required">
        <div>
          <FieldLabel htmlFor="orderReference" label="Order Reference" required />
          <input
            id="orderReference"
            value={data.orderReference}
            onChange={(e) => setField("orderReference", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="orderType" label="Order Type" required />
          <select
            id="orderType"
            value={data.orderType}
            onChange={(e) => setField("orderType", e.target.value as OcrReviewData["orderType"])}
            className={inputClass}
          >
            <option value="Collection">Collection</option>
            <option value="Delivery">Delivery</option>
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="collectionDate" label="Collection Date" required />
          <input
            id="collectionDate"
            type="date"
            value={data.collectionDate}
            onChange={(e) => {
              setField("collectionDate", e.target.value);
              setField("collectionDateConfidence", e.target.value ? "high" : "low");
            }}
            className={inputClass}
          />
          {needsCollectionDateInput ? (
            <p className="mt-1 text-xs text-amber-700">
              Enter collection date before creating the job. OCR could not confirm this date.
            </p>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="deliveryDate" label="Delivery Date" required />
          <input
            id="deliveryDate"
            type="date"
            value={data.deliveryDate}
            onChange={(e) => {
              setField("deliveryDate", e.target.value);
              setField("deliveryDateConfidence", e.target.value ? "high" : "low");
            }}
            className={inputClass}
          />
          {needsDeliveryDateInput ? (
            <p className="mt-1 text-xs text-amber-700">
              Enter delivery date before creating the job. OCR could not confirm this date.
            </p>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="merchantShipper" label="Merchant / Shipper" required />
          <input
            id="merchantShipper"
            value={data.merchantShipper}
            onChange={(e) => setField("merchantShipper", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="customer" label="Customer" required />
          <input
            id="customer"
            value={data.customer}
            onChange={(e) => setField("customer", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="collectionName" label="Collection Name" required />
          <input
            id="collectionName"
            value={data.collectionName}
            onChange={(e) => setField("collectionName", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="collectionAddress" label="Collection Address" required />
          <textarea
            id="collectionAddress"
            rows={3}
            value={data.collectionAddress}
            onChange={(e) => setField("collectionAddress", e.target.value)}
            className={textareaClass}
          />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="deliveryAddress" label="Delivery Address" required />
          <textarea
            id="deliveryAddress"
            rows={3}
            value={data.deliveryAddress}
            onChange={(e) => setField("deliveryAddress", e.target.value)}
            className={textareaClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="contactName" label="Contact Name" required />
          <input
            id="contactName"
            value={data.contactName}
            onChange={(e) => setField("contactName", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="telephone" label="Telephone" required />
          <input
            id="telephone"
            value={data.telephone}
            onChange={(e) => setField("telephone", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="email" label="Email" required />
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => setField("email", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="goodsDescription" label="Goods Description" required />
          <textarea
            id="goodsDescription"
            rows={3}
            value={data.goodsDescription}
            onChange={(e) => setField("goodsDescription", e.target.value)}
            className={textareaClass}
          />
        </div>
      </Section>

      <Section title="Operational">
        <div>
          <FieldLabel htmlFor="packages" label="Packages" />
          <input
            id="packages"
            value={data.packages}
            onChange={(e) => setField("packages", e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">Maps internally to Track-POD PLT/PKG.</p>
        </div>

        <div>
          <FieldLabel htmlFor="quantity" label="Quantity" />
          <input
            id="quantity"
            value={data.quantity}
            onChange={(e) => setField("quantity", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="weight" label="Weight (optional)" />
          <input
            id="weight"
            value={data.weight}
            onChange={(e) => setField("weight", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="volume" label="Volume (optional)" />
          <input
            id="volume"
            value={data.volume}
            onChange={(e) => setField("volume", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="priority" label="Priority" />
          <select
            id="priority"
            value={data.priority}
            onChange={(e) => setField("priority", e.target.value as PriorityLevel)}
            className={inputClass}
          >
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section title="Commercial">
        <div>
          <FieldLabel htmlFor="cod" label="Cash On Delivery (COD)" />
          <input
            id="cod"
            value={data.cashOnDelivery}
            onChange={(e) => setField("cashOnDelivery", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="netAmount" label="Net Amount" />
          <input
            id="netAmount"
            value={data.netAmount}
            onChange={(e) => setField("netAmount", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="vatAmount" label="VAT Amount" />
          <input
            id="vatAmount"
            value={data.vatAmount}
            onChange={(e) => setField("vatAmount", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="grossTotal" label="Gross Total" />
          <input
            id="grossTotal"
            value={data.grossTotal}
            onChange={(e) => setField("grossTotal", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="vatRate" label="VAT Rate" />
          <input
            id="vatRate"
            value={data.vatRate}
            onChange={(e) => setField("vatRate", e.target.value)}
            className={inputClass}
          />
        </div>
      </Section>

      <Section title="Notes">
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="notes" label="Delivery Notes / Special Instructions" />
          <textarea
            id="notes"
            rows={4}
            value={data.notes}
            onChange={(e) => setField("notes", e.target.value)}
            className={textareaClass}
          />
        </div>
      </Section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--nexus-graphite)]">Track-POD Mapping Preview</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.16em] text-slate-500">
                <th className="py-2 pr-4">Nexus Field</th>
                <th className="py-2 pr-4">Mapped Key</th>
                <th className="py-2">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2 pr-4">Packages</td>
                <td className="py-2 pr-4 font-mono text-xs">plt_pkg</td>
                <td className="py-2">{trackPodPreview.plt_pkg || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Cash On Delivery</td>
                <td className="py-2 pr-4 font-mono text-xs">cod</td>
                <td className="py-2">{trackPodPreview.cod || "£0.00"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Order Type</td>
                <td className="py-2 pr-4 font-mono text-xs">order_type</td>
                <td className="py-2">{trackPodPreview.order_type}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Collection Date Confidence</td>
                <td className="py-2 pr-4 font-mono text-xs">collection_date_confidence</td>
                <td className="py-2">{trackPodPreview.collection_date_confidence}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Delivery Date Confidence</td>
                <td className="py-2 pr-4 font-mono text-xs">delivery_date_confidence</td>
                <td className="py-2">{trackPodPreview.delivery_date_confidence}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Net Amount</td>
                <td className="py-2 pr-4 font-mono text-xs">net_amount</td>
                <td className="py-2">{trackPodPreview.net_amount || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">VAT Amount</td>
                <td className="py-2 pr-4 font-mono text-xs">vat_amount</td>
                <td className="py-2">{trackPodPreview.vat_amount || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Gross Total</td>
                <td className="py-2 pr-4 font-mono text-xs">gross_total</td>
                <td className="py-2">{trackPodPreview.gross_total || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">VAT Rate</td>
                <td className="py-2 pr-4 font-mono text-xs">vat_rate</td>
                <td className="py-2">{trackPodPreview.vat_rate || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--nexus-graphite)]">Track-POD Release Check</h2>
        {hasFutureDateWarning ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">
              Delivery date is far in the future. This order will not be released until 10 days prior to that date.
            </p>
            <p className="mt-1">
              Planned release date: {formatDateLabel(holdReleaseDate)}. Reminder: notify the customer to update Track-POD when that date approaches.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            No date warning detected. This order can move to Track-POD immediately.
          </p>
        )}

        <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <span className="flex items-start gap-2">
              <input
                type="radio"
                name="upload_trackpod_release"
                checked={trackPodReleaseDecision === "send_now"}
                onChange={() => setTrackPodReleaseDecision("send_now")}
              />
              <span>
                <span className="font-semibold text-slate-900">Ready to send to Track-POD now</span>
                <span className="mt-1 block text-xs text-slate-500">Use when date checks are complete and operations can proceed immediately.</span>
              </span>
            </span>
          </label>
          <label className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <span className="flex items-start gap-2">
              <input
                type="radio"
                name="upload_trackpod_release"
                checked={trackPodReleaseDecision === "hold_for_date"}
                onChange={() => setTrackPodReleaseDecision("hold_for_date")}
              />
              <span>
                <span className="font-semibold text-slate-900">Hold for date-related warning</span>
                <span className="mt-1 block text-xs text-slate-500">Keeps the order in review until the planned release window.</span>
              </span>
            </span>
          </label>
        </fieldset>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isCreating}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--nexus-graphite)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onCreateJob({ readyForTrackPod: trackPodReleaseDecision === "send_now" })}
          disabled={isCreating}
          className="rounded-lg bg-[var(--nexus-purple)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-[var(--nexus-purple)]/40 disabled:opacity-60"
        >
          {isCreating ? "Creating…" : "Create Job"}
        </button>
      </div>
    </div>
  );
}