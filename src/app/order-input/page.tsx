"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import DocumentUploadCard from "@/components/DocumentUploadCard";

const methods = [
  {
    id: "pdf",
    title: "Upload PDF",
    description: "Send us a PDF invoice, delivery note or purchase order.",
    action: "Upload PDF",
    status: "Available now",
  },
  {
    id: "email",
    title: "Email Booking",
    description: "Use your unique NEXUS booking email to submit bookings automatically.",
    action: "View email address",
    status: "Coming soon",
  },
  {
    id: "manual",
    title: "Enter Manually",
    description: "Fill a simple booking request form with one clear step.",
    action: "Start manual entry",
    status: "Available now",
  },
  {
    id: "webform",
    title: "Website Form",
    description: "Open the customer booking form for online order entry.",
    action: "Open booking form",
    status: "Coming soon",
  },
  {
    id: "woocommerce",
    title: "WooCommerce",
    description: "Import orders directly from your WooCommerce store.",
    action: "View integration",
    status: "Coming soon",
  },
  {
    id: "api",
    title: "API Integration",
    description: "Connect your systems and send booking requests programmatically.",
    action: "View API details",
    status: "Coming soon",
  },
];

export default function BookingInputPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [uploadActive, setUploadActive] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const selectedMethod = methods.find((method) => method.id === selected);

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Order Input</p>
            <h1 className="text-3xl font-semibold text-slate-950">Submit a booking request</h1>
            <p className="max-w-3xl text-base text-slate-600">
              Choose how you want to send your booking. All inputs are converted into one standard NEXUS booking.
            </p>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {methods.map((method) => {
            const active = selected === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelected(method.id)}
                className={`group flex flex-col justify-between rounded-[28px] border p-6 text-left shadow-sm transition ${
                  active
                    ? "border-[#7C3AED] bg-white shadow-lg shadow-[#7C3AED]/10"
                    : "border-slate-200 bg-white hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/10"
                }`}
              >
                  <div className="space-y-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                      {method.id === "pdf" && (
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7C3AED]" fill="none" stroke="#7C3AED" strokeWidth="1.8">
                          <path d="M7 3h8l4 4v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3z" />
                          <path d="M13 3v5h5" />
                        </svg>
                      )}
                      {method.id === "email" && (
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7C3AED]" fill="none" stroke="#7C3AED" strokeWidth="1.8">
                          <path d="M3 8l8 5 8-5" />
                          <path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
                        </svg>
                      )}
                      {method.id === "manual" && (
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7C3AED]" fill="none" stroke="#7C3AED" strokeWidth="1.8">
                          <path d="M3 21v-3l11-11 3 3L6 21H3z" />
                          <path d="M14 7l3 3" />
                        </svg>
                      )}
                      {method.id === "webform" && (
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7C3AED]" fill="none" stroke="#7C3AED" strokeWidth="1.8">
                          <rect x="3" y="4" width="18" height="14" rx="2" />
                          <path d="M7 8h10M7 12h10" />
                        </svg>
                      )}
                      {method.id === "woocommerce" && (
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7C3AED]" fill="none" stroke="#7C3AED" strokeWidth="1.8">
                          <path d="M3 7h18v10H3z" />
                          <path d="M7 7v10" />
                        </svg>
                      )}
                      {method.id === "api" && (
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7C3AED]" fill="none" stroke="#7C3AED" strokeWidth="1.8">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19 12h2M3 12H1M12 19v2M12 3v2" />
                        </svg>
                      )}
                    </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-950">{method.title}</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {method.status}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{method.description}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-[#7C3AED]">{method.action}</span>
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3F4F6] text-[#7C3AED] ${active ? "ring-2 ring-[#7C3AED]" : ""}`}>
                    →
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {selectedMethod && (
          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Selected method</p>
                    <h2 className="text-2xl font-semibold text-slate-950">{selectedMethod.title}</h2>
                  </div>
                  <span className="rounded-full bg-[#EDE9FE] px-3 py-1 text-sm font-semibold text-[#6D28D9]">
                    {selectedMethod.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{selectedMethod.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-2xl bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6d28d9]"
                  onClick={() => {
                    if (selectedMethod.id === "pdf") {
                      setUploadActive(true);
                      setUploadComplete(false);
                    }
                  }}
                >
                  {selectedMethod.action}
                </button>

                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-[#7C3AED] hover:text-[#7C3AED]"
                >
                  Learn more
                </button>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[#F8FAFC] p-6">
                <p className="text-sm font-semibold text-slate-900">How NEXUS handles your booking</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>1. Capture your booking details from any document or entry method.</li>
                  <li>2. Process customer, address, goods, quantity and reference details automatically.</li>
                  <li>3. Show a review screen before you submit the booking.</li>
                </ul>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Document Processing</p>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">Document Preview</h3>
                <p className="mt-2 text-sm text-slate-600">
                  When a PDF upload completes successfully, NEXUS will extract delivery details and ask you to review them.
                </p>

                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  <div className="mb-4 h-36 rounded-3xl bg-white p-4 text-slate-400 shadow-sm">
                    <p className="font-medium text-slate-900">Document processing coming in v0.3</p>
                    <p className="mt-2">The extracted delivery preview will appear here after upload.</p>
                  </div>
                  <div className="grid gap-3 text-xs text-slate-500">
                    <div className="flex justify-between gap-4">
                      <span>Customer</span>
                      <span className="text-slate-400">Example</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Collection address</span>
                      <span className="text-slate-400">Example</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Delivery address</span>
                      <span className="text-slate-400">Example</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Goods, qty, notes</span>
                      <span className="text-slate-400">Example</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Future workflow</p>
                <ol className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>• Upload PDF or connect another order source.</li>
                  <li>• NEXUS processes your document automatically.</li>
                  <li>• Review and edit anything incorrect.</li>
                  <li>• Create Booking and continue to tracking.</li>
                </ol>
              </div>
            </aside>
          </section>
        )}

        {uploadActive && (
          <section className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Upload PDF</p>
              <h2 className="text-2xl font-semibold text-slate-950">Upload your delivery document</h2>
              <p className="text-sm text-slate-600">
                This links into the Document Centre. When upload succeeds, you&apos;ll see the document preview.
              </p>
            </div>

            <DocumentUploadCard
              onUploadComplete={() => {
                setUploadComplete(true);
                setUploadActive(false);
              }}
            />

            {uploadComplete && (
              <div className="rounded-[24px] border border-[#7C3AED] bg-[#F5F3FF] p-6 text-slate-900">
                <p className="font-semibold text-[#5B21B6]">Upload complete</p>
                <p className="mt-2 text-sm text-slate-700">
                  Your PDF is in the Document Centre now. Document processing coming in v0.3.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
