"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import { useState } from "react";

const mockProfile = {
  companyName: "Doorway Group Ltd",
  tradingName: "Doorway Interiors",
  primaryContact: "Sarah Mitchell",
  billingContact: "James Harrow",
  email: "accounts@doorwaygroup.co.uk",
  phone: "020 7946 0823",
  address: "14 Commerce Way, London, EC1A 2BB",
  defaultCollectionAddress: "14 Commerce Way, London, EC1A 2BB",
  brandColour: "#7C3AED",
  notifications: {
    deliveryConfirmation: true,
    collectionReminders: true,
    podAvailable: true,
    weeklyDigest: false,
  },
};

export default function CompanyProfilePage() {
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
          <span className="text-slate-700">Company Profile</span>
        </nav>

        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">Account IT</p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Company Profile</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Configure your company details, branding and notification preferences.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Company Details */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-[#111827]">Company details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Company name</label>
                <input
                  type="text"
                  defaultValue={mockProfile.companyName}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Trading name</label>
                <input
                  type="text"
                  defaultValue={mockProfile.tradingName}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Primary contact</label>
                <input
                  type="text"
                  defaultValue={mockProfile.primaryContact}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Billing contact</label>
                <input
                  type="text"
                  defaultValue={mockProfile.billingContact}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Email</label>
                <input
                  type="email"
                  defaultValue={mockProfile.email}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Phone</label>
                <input
                  type="tel"
                  defaultValue={mockProfile.phone}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Address</label>
                <input
                  type="text"
                  defaultValue={mockProfile.address}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Default collection address</label>
                <input
                  type="text"
                  defaultValue={mockProfile.defaultCollectionAddress}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Used as the default pickup location when creating new deliveries.
                </p>
              </div>
            </div>
          </section>

          {/* Branding */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-[#111827]">Branding</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Logo upload */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Logo</label>
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5 cursor-pointer">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Upload your logo</p>
                    <p className="text-xs text-slate-400">PNG, SVG or JPG — max 2 MB</p>
                  </div>
                  <span className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">
                    Choose file
                  </span>
                </div>
              </div>

              {/* Brand colour */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Brand colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    defaultValue={mockProfile.brandColour}
                    className="h-12 w-12 cursor-pointer rounded-xl border border-slate-200 bg-transparent p-1"
                  />
                  <input
                    type="text"
                    defaultValue={mockProfile.brandColour}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Used on branded PODs, delivery documents and customer communications.
                </p>
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Preview</p>
                  <div
                    className="h-8 w-full rounded-lg"
                    style={{ backgroundColor: mockProfile.brandColour }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Notification preferences */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-[#111827]">Notification preferences</h2>
            <p className="mb-5 text-xs text-slate-400">Control which notifications your team receives.</p>
            <div className="space-y-3">
              {[
                { key: "deliveryConfirmation", label: "Delivery confirmation", desc: "When a delivery is marked as complete" },
                { key: "collectionReminders", label: "Collection reminders", desc: "Reminder before scheduled collection windows" },
                { key: "podAvailable", label: "POD available", desc: "When a signed proof of delivery is ready" },
                { key: "weeklyDigest", label: "Weekly digest", desc: "Summary of activity sent every Monday morning" },
              ].map((pref) => (
                <label
                  key={pref.key}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 transition hover:border-[#7C3AED]/20 hover:bg-[#7C3AED]/5"
                >
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{pref.label}</p>
                    <p className="text-xs text-slate-400">{pref.desc}</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      defaultChecked={mockProfile.notifications[pref.key as keyof typeof mockProfile.notifications]}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-[#7C3AED] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition after:content-[''] peer-checked:after:translate-x-5" />
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center gap-4 pb-4">
            <button
              type="submit"
              className="rounded-2xl bg-[#7C3AED] px-8 py-3 text-sm font-semibold text-white shadow-sm shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9] active:scale-[0.98]"
            >
              Save changes
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Saved
              </span>
            )}
            <p className="text-xs text-slate-400">
              Placeholder — backend integration pending.
            </p>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
