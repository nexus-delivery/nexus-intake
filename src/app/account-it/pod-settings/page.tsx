"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import { useState } from "react";

const mockPodSettings = {
  podHeader: "Doorway Interiors — Proof of Delivery",
  podFooter: "Thank you for choosing Doorway Interiors. For queries contact accounts@doorwaygroup.co.uk",
  defaultProofWording:
    "I confirm that the above goods have been received in full and in good condition unless noted below.",
  customerTCs:
    "All deliveries are subject to Doorway Group Ltd standard terms and conditions. Full terms available at doorwaygroup.co.uk/terms.",
  deliveryDisclaimer:
    "Doorway Group Ltd accepts no liability for damage not reported at time of delivery and noted on this document.",
  collectionDisclaimer:
    "Items must be packaged and ready for collection at the agreed time. Additional charges may apply for failed collections.",
  damageDisclaimer:
    "Any damage must be noted on this POD at the time of delivery. Claims cannot be accepted after the driver has departed.",
  storageDisclaimer:
    "Goods held in storage are subject to our standard storage terms. Storage fees apply after the agreed free period.",
  returnsDisclaimer:
    "Returns must be pre-authorised. Unauthorised returns will not be accepted and may incur a handling charge.",
};

const fields = [
  { key: "podHeader", label: "POD header", desc: "Displayed at the top of every POD document", multiline: false },
  { key: "podFooter", label: "POD footer", desc: "Displayed at the bottom of every POD document", multiline: false },
  {
    key: "defaultProofWording",
    label: "Default proof wording",
    desc: "The recipient confirmation statement shown on the signature line",
    multiline: true,
  },
  {
    key: "customerTCs",
    label: "Customer-specific T&Cs",
    desc: "Your company-specific terms and conditions referenced on the POD",
    multiline: true,
  },
  {
    key: "deliveryDisclaimer",
    label: "Delivery disclaimer",
    desc: "Shown on all delivery PODs",
    multiline: true,
  },
  {
    key: "collectionDisclaimer",
    label: "Collection disclaimer",
    desc: "Shown on collection PODs",
    multiline: true,
  },
  {
    key: "damageDisclaimer",
    label: "Damage disclaimer",
    desc: "Displayed when damage is noted at delivery",
    multiline: true,
  },
  {
    key: "storageDisclaimer",
    label: "Storage disclaimer",
    desc: "Shown on storage-related PODs",
    multiline: true,
  },
  {
    key: "returnsDisclaimer",
    label: "Returns disclaimer",
    desc: "Shown when a return collection is arranged",
    multiline: true,
  },
] as const;

export default function PodSettingsPage() {
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/account-it" className="hover:text-[#7C3AED]">
            Account IT
          </Link>
          <span>›</span>
          <span className="text-slate-700">POD Settings</span>
        </nav>

        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">Account IT</p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">POD Settings</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Configure your branded proof of delivery documents — logos, wording, disclaimers and terms.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Logo section */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-[#111827]">POD logo</h2>
            <p className="mb-5 text-xs text-slate-400">
              Your logo will appear in the header of every branded POD. Use a high-resolution PNG or SVG.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5 cursor-pointer">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Upload POD logo</p>
                <p className="text-xs text-slate-400">PNG or SVG — recommended 300 × 100 px</p>
              </div>
              <span className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">
                Choose file
              </span>
            </div>
          </section>

          {/* Text fields */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-[#111827]">POD wording &amp; disclaimers</h2>
            <p className="mb-5 text-xs text-slate-400">
              These fields appear on your POD documents. Keep text concise and legally reviewed.
            </p>
            <div className="space-y-5">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</label>
                  <p className="mb-2 text-xs text-slate-400">{field.desc}</p>
                  {field.multiline ? (
                    <textarea
                      rows={3}
                      defaultValue={mockPodSettings[field.key]}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                  ) : (
                    <input
                      type="text"
                      defaultValue={mockPodSettings[field.key]}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* POD Preview notice */}
          <div className="rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-5 flex gap-4">
            <div className="shrink-0 mt-0.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-[#7C3AED]">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#7C3AED]">Live POD preview</p>
              <p className="text-xs text-slate-500 mt-1">
                A branded POD preview will appear here once the PDF generation service is connected.
                Your settings are saved and will apply to all new PODs automatically.
              </p>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-4 pb-4">
            <button
              type="submit"
              className="rounded-2xl bg-[#7C3AED] px-8 py-3 text-sm font-semibold text-white shadow-sm shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9] active:scale-[0.98]"
            >
              Save settings
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Saved
              </span>
            )}
            <p className="text-xs text-slate-400">Placeholder — backend integration pending.</p>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
