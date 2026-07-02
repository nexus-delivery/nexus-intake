"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  toEmptyDefaultCollectionProfile,
  type DefaultCollectionProfile,
} from "@/lib/defaultCollectionProfiles";

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [profile, setProfile] = useState<DefaultCollectionProfile>(
    toEmptyDefaultCollectionProfile("")
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!supabase) return;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const response = await fetch("/api/reference/default-collection-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = (await response.json().catch(() => ({}))) as {
          companyName?: string;
          profile?: DefaultCollectionProfile | null;
          error?: string;
        };

        if (!response.ok) {
          if (!cancelled) setError(payload.error ?? "Failed to load profile");
          return;
        }

        if (cancelled) return;
        setCompanyName(payload.companyName ?? "");
        setProfile(payload.profile ?? toEmptyDefaultCollectionProfile(""));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      if (!supabase) throw new Error("Supabase is not configured");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Please sign in again");

      const response = await fetch("/api/reference/default-collection-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        profile?: DefaultCollectionProfile;
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.profile) {
        throw new Error(payload.error ?? "Save failed");
      }

      setProfile(payload.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
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
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-[#111827]">Default Collection Profile</h2>
            {loading ? (
              <p className="text-sm text-slate-500">Loading profile...</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Company name</label>
                <input
                  type="text"
                  value={profile.companyName || companyName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Profile name</label>
                <input
                  type="text"
                  value={profile.profileName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, profileName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Contact name</label>
                <input
                  type="text"
                  value={profile.contactName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, contactName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Postcode</label>
                <input
                  type="text"
                  value={profile.postcode}
                  onChange={(e) => setProfile((prev) => ({ ...prev, postcode: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Address line 1</label>
                <input
                  type="text"
                  value={profile.addressLine1}
                  onChange={(e) => setProfile((prev) => ({ ...prev, addressLine1: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Address line 2</label>
                <input
                  type="text"
                  value={profile.addressLine2}
                  onChange={(e) => setProfile((prev) => ({ ...prev, addressLine2: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Address line 3</label>
                <input
                  type="text"
                  value={profile.addressLine3}
                  onChange={(e) => setProfile((prev) => ({ ...prev, addressLine3: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Collection instructions</label>
                <textarea
                  rows={3}
                  value={profile.instructions}
                  onChange={(e) => setProfile((prev) => ({ ...prev, instructions: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
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
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
