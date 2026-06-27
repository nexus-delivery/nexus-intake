"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import { useState } from "react";

type Term = {
  id: string;
  title: string;
  body: string;
  status: "active" | "inactive" | "pending";
  appearsOnGenericPod: boolean;
};

const mockTerms: Term[] = [
  {
    id: "t1",
    title: "Standard delivery terms",
    body: "All deliveries are subject to our standard carrier terms. The recipient must inspect goods upon delivery and note any damage on the POD before the driver departs.",
    status: "active",
    appearsOnGenericPod: true,
  },
  {
    id: "t2",
    title: "Collection disclaimer",
    body: "Items must be packaged and ready for collection at the agreed time. Failed collections due to customer unavailability may incur an additional charge.",
    status: "active",
    appearsOnGenericPod: true,
  },
  {
    id: "t3",
    title: "Damage liability waiver",
    body: "Doorway Group Ltd accepts no liability for pre-existing damage or damage not noted at the time of delivery on the signed proof of delivery.",
    status: "active",
    appearsOnGenericPod: false,
  },
  {
    id: "t4",
    title: "Extended storage terms",
    body: "Goods held beyond the agreed free storage period will attract a daily storage fee as per the current tariff schedule available on request.",
    status: "inactive",
    appearsOnGenericPod: false,
  },
  {
    id: "t5",
    title: "Returns policy (draft)",
    body: "Returns must be pre-authorised in writing. Unauthorised returns will not be accepted at the warehouse and may be returned to the sender at their cost.",
    status: "pending",
    appearsOnGenericPod: false,
  },
];

const statusStyles: Record<Term["status"], string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  pending: "bg-amber-50 text-amber-700",
};

const statusLabels: Record<Term["status"], string> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending approval",
};

export default function TermsLibraryPage() {
  const [terms, setTerms] = useState<Term[]>(mockTerms);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  function togglePodVisibility(id: string) {
    setTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, appearsOnGenericPod: !t.appearsOnGenericPod } : t))
    );
  }

  function toggleStatus(id: string) {
    setTerms((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "active" ? "inactive" : "active" } : t
      )
    );
  }

  function approveTerm(id: string) {
    setTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "active" } : t))
    );
  }

  function addTerm() {
    if (!newTitle.trim() || !newBody.trim()) return;
    const newTerm: Term = {
      id: `t${Date.now()}`,
      title: newTitle.trim(),
      body: newBody.trim(),
      status: "pending",
      appearsOnGenericPod: false,
    };
    setTerms((prev) => [...prev, newTerm]);
    setNewTitle("");
    setNewBody("");
    setShowAddForm(false);
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/account-it" className="hover:text-[#7C3AED]">
            Account IT
          </Link>
          <span>›</span>
          <span className="text-slate-700">Terms Library</span>
        </nav>

        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                  <path d="M9 12h6M9 16h6M9 8h6M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">Account IT</p>
                <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Terms Library</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Manage your company T&Cs, disclaimers and POD terms in one place.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href="/account-it/terms-library/upload"
                className="flex items-center gap-2 rounded-2xl border border-[#7C3AED]/30 bg-[#7C3AED]/5 px-4 py-2.5 text-sm font-medium text-[#7C3AED] transition hover:bg-[#7C3AED]/10"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                Upload &amp; extract
              </Link>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 rounded-2xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9]"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Add terms
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active terms", value: terms.filter((t) => t.status === "active").length, colour: "emerald" },
            { label: "On generic POD", value: terms.filter((t) => t.appearsOnGenericPod).length, colour: "purple" },
            { label: "Pending approval", value: terms.filter((t) => t.status === "pending").length, colour: "amber" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center"
            >
              <p className="text-2xl font-bold text-[#111827]">{stat.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Add terms form */}
        {showAddForm && (
          <div className="rounded-[24px] border border-[#7C3AED]/30 bg-[#7C3AED]/5 p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-[#111827]">Add new terms</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Standard delivery terms"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Terms text</label>
                <textarea
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Enter the full terms text..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addTerm}
                  className="rounded-2xl bg-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#6D28D9]"
                >
                  Save for approval
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Terms list */}
        <div className="space-y-3">
          {terms.map((term) => (
            <div
              key={term.id}
              className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusStyles[term.status]}`}
                    >
                      {statusLabels[term.status]}
                    </span>
                    {term.appearsOnGenericPod && (
                      <span className="rounded-full bg-[#7C3AED]/10 px-3 py-0.5 text-xs font-semibold text-[#7C3AED]">
                        On generic POD
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[#111827]">{term.title}</h3>
                  {editingId === term.id ? (
                    <textarea
                      rows={3}
                      defaultValue={term.body}
                      className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#111827] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                  ) : (
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{term.body}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-col gap-2">
                  {term.status === "pending" && (
                    <button
                      onClick={() => approveTerm(term.id)}
                      className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      Approve
                    </button>
                  )}
                  {editingId === term.id ? (
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-xl bg-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9] transition"
                    >
                      Done
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingId(term.id)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => toggleStatus(term.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                      term.status === "active"
                        ? "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {term.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>

              {/* POD toggle */}
              <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Appears on generic PODs</p>
                  <p className="text-xs text-slate-400">
                    When enabled, this term is included on all generic POD documents.
                  </p>
                </div>
                <button
                  onClick={() => togglePodVisibility(term.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    term.appearsOnGenericPod ? "bg-[#7C3AED]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      term.appearsOnGenericPod ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {terms.length === 0 && (
          <div className="rounded-[24px] border-2 border-dashed border-slate-200 p-12 text-center">
            <p className="text-sm font-medium text-slate-500">No terms yet</p>
            <p className="mt-1 text-xs text-slate-400">Add terms manually or upload a document to extract them.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
