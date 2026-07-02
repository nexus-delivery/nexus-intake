"use client";

import { useState } from "react";

type TimelineItem = {
  timestamp: string;
  label: string;
  detail: string;
  kind: "event" | "error" | "system";
};

type PublicDetail = {
  job: {
    internalOrderNumber: string;
    externalOrderReference: string;
    lifecycleStatus: string;
    currentStatus: string;
    trackPodDeliveryTrackingUrl: string | null;
    trackPodCollectionTrackingUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  collection: {
    company: string;
    postcode: string;
  };
  delivery: {
    company: string;
    postcode: string;
  };
  documents: {
    url: string;
  };
  timeline: TimelineItem[];
};

function toLocale(value: string): string {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : "-";
}

export default function PublicOrderStatusPage() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PublicDetail | null>(null);

  async function handleLookup(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setDetail(null);

    try {
      const params = new URLSearchParams({
        ref: reference.trim(),
        email: email.trim(),
      });

      const response = await fetch(`/api/orders/public-status?${params.toString()}`);
      const payload = (await response.json()) as { detail?: PublicDetail; error?: string };
      if (!response.ok || !payload.detail) {
        throw new Error(payload.error ?? `Lookup failed (${response.status})`);
      }

      setDetail(payload.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Customer Portal</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Track your order</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your order reference and email to view the latest status synchronized from Track-POD into NEXUS.
          </p>

          <form className="mt-5 grid gap-3 md:grid-cols-3" onSubmit={handleLookup}>
            <input
              required
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Order reference"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Checking..." : "Check status"}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        {detail && (
          <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Order</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{detail.job.internalOrderNumber || "-"}</p>
                <p className="text-sm text-slate-700">External ref: {detail.job.externalOrderReference || "-"}</p>
                <p className="mt-2 text-sm text-slate-700">Lifecycle: {detail.job.lifecycleStatus || "-"}</p>
                <p className="text-sm text-slate-700">Current status: {detail.job.currentStatus || "-"}</p>
                <p className="mt-2 text-xs text-slate-500">Created: {toLocale(detail.job.createdAt)}</p>
                <p className="text-xs text-slate-500">Updated: {toLocale(detail.job.updatedAt)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tracking</p>
                <div className="mt-2 space-y-2 text-sm">
                  {detail.job.trackPodCollectionTrackingUrl ? (
                    <a
                      href={detail.job.trackPodCollectionTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-700 underline"
                    >
                      Collection tracking
                    </a>
                  ) : (
                    <p className="text-slate-600">Collection tracking not yet available</p>
                  )}
                  {detail.job.trackPodDeliveryTrackingUrl ? (
                    <a
                      href={detail.job.trackPodDeliveryTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-700 underline"
                    >
                      Delivery tracking
                    </a>
                  ) : (
                    <p className="text-slate-600">Delivery tracking not yet available</p>
                  )}
                  {detail.documents.url ? (
                    <a
                      href={detail.documents.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-700 underline"
                    >
                      POD / document link
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Timeline</p>
              {detail.timeline.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">No timeline events yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {detail.timeline.map((item, index) => (
                    <div key={`${item.timestamp}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{toLocale(item.timestamp)}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
