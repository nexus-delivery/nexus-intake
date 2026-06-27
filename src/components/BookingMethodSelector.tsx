"use client";

import type { ReactNode } from "react";

export type BookingMethod = "upload" | "enter_details";

type BookingMethodSelectorProps = {
  onSelectMethod: (method: BookingMethod) => void;
};

const activeMethods: { id: BookingMethod; title: string; description: string; icon: ReactNode }[] = [
  {
    id: "upload",
    title: "Upload Document",
    description: "Upload a PDF, PNG, JPG, or JPEG delivery document to create a job.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: "enter_details",
    title: "Enter Job Details",
    description: "Manually enter all job details to create a delivery booking.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
];

const comingSoonMethods = [
  {
    id: "webform",
    title: "Online Booking Form",
    description: "Accept bookings via a public web form.",
  },
  {
    id: "email",
    title: "Email Orders",
    description: "Import bookings from incoming emails.",
  },
  {
    id: "woocommerce",
    title: "WooCommerce",
    description: "Sync orders from your WooCommerce store.",
  },
  {
    id: "shopify",
    title: "Shopify",
    description: "Sync orders from your Shopify store.",
  },
  {
    id: "api",
    title: "API Integration",
    description: "Connect your systems via REST API.",
  },
  {
    id: "csv",
    title: "CSV Import",
    description: "Bulk import jobs from a CSV file.",
  },
];

export default function BookingMethodSelector({
  onSelectMethod,
}: BookingMethodSelectorProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {activeMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelectMethod(method.id)}
            className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-[var(--nexus-purple)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--nexus-purple)]/30"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--nexus-purple)]/10 text-[var(--nexus-purple)] transition group-hover:bg-[var(--nexus-purple)] group-hover:text-white">
              {method.icon}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-[var(--nexus-graphite)]">
                {method.title}
              </p>
              <p className="mt-1 text-sm text-slate-500">{method.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Coming Soon
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoonMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-60"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-700">{method.title}</p>
                  <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">
                    Coming Soon
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{method.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
