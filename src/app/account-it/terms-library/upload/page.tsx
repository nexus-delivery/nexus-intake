"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import { useState } from "react";

type Step = "upload" | "preview" | "approve";

type ExtractedTerm = {
  id: string;
  title: string;
  body: string;
  selected: boolean;
};

const mockExtractedTerms: ExtractedTerm[] = [
  {
    id: "e1",
    title: "Liability limitation",
    body: "The carrier's liability for loss or damage shall not exceed £500 per consignment unless a higher value is declared and agreed in writing prior to collection.",
    selected: true,
  },
  {
    id: "e2",
    title: "Force majeure",
    body: "The carrier shall not be liable for any failure or delay caused by circumstances beyond its reasonable control including but not limited to acts of God, strikes or government action.",
    selected: true,
  },
  {
    id: "e3",
    title: "Claims procedure",
    body: "All claims for loss or damage must be submitted in writing within 7 days of delivery. Claims submitted after this period will not be considered.",
    selected: false,
  },
  {
    id: "e4",
    title: "Prohibited goods",
    body: "The following goods are excluded from carriage: cash, jewellery, live animals, hazardous materials and items exceeding published weight or dimension limits.",
    selected: true,
  },
];

export default function TermsUploadPage() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [terms, setTerms] = useState<ExtractedTerm[]>(mockExtractedTerms);
  const [saved, setSaved] = useState(false);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  }

  function simulateExtract() {
    if (!fileName) return;
    setStep("preview");
  }

  function toggleTerm(id: string) {
    setTerms((prev) => prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)));
  }

  function saveToLibrary() {
    setSaved(true);
    setStep("approve");
  }

  const selectedCount = terms.filter((t) => t.selected).length;

  return (
    <AppShell>
      <div className="space-y-8 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/account-it" className="hover:text-[#7C3AED]">Account IT</Link>
          <span>›</span>
          <Link href="/account-it/terms-library" className="hover:text-[#7C3AED]">Terms Library</Link>
          <span>›</span>
          <span className="text-slate-700">Upload &amp; Extract</span>
        </nav>

        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">Terms Library</p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Upload &amp; Extract</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Upload a document and IT will extract suggested T&Cs for review and approval.
              </p>
            </div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-0">
          {(["upload", "preview", "approve"] as Step[]).map((s, i) => {
            const labels: Record<Step, string> = {
              upload: "Upload document",
              preview: "Review extracted terms",
              approve: "Save to library",
            };
            const isComplete =
              (s === "upload" && (step === "preview" || step === "approve")) ||
              (s === "preview" && step === "approve");
            const isActive = step === s;

            return (
              <div key={s} className="flex items-center">
                {i > 0 && (
                  <div
                    className={`h-px w-16 transition-colors ${
                      isComplete || (s === "preview" && step === "approve") ? "bg-[#7C3AED]" : "bg-slate-200"
                    }`}
                  />
                )}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isComplete
                        ? "bg-[#7C3AED] text-white"
                        : isActive
                        ? "border-2 border-[#7C3AED] text-[#7C3AED]"
                        : "border-2 border-slate-200 text-slate-400"
                    }`}
                  >
                    {isComplete ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-[#7C3AED]" : isComplete ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {labels[s]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-[#111827]">Upload your document</h2>
            <p className="mb-5 text-xs text-slate-400">
              Supported formats: PDF, DOCX, TXT. IT will scan the document and suggest relevant T&Cs.
            </p>

            <label
              htmlFor="file-upload"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center transition hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5 cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              {fileName ? (
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{fileName}</p>
                  <p className="text-xs text-slate-400">File selected — click extract to continue</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-700">Drag &amp; drop your document here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse — PDF, DOCX, TXT up to 10 MB</p>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.txt"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-700">Future-ready placeholder</p>
              <p className="mt-1 text-xs text-amber-600">
                The automated extraction engine is not yet connected. In the next sprint, uploading a document will
                automatically identify and suggest T&Cs. For now, click &ldquo;Extract terms (demo)&rdquo; to preview
                the planned experience.
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={simulateExtract}
                disabled={!fileName}
                className="rounded-2xl bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Extract terms (demo)
              </button>
              <Link
                href="/account-it/terms-library"
                className="flex items-center rounded-2xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </div>
        )}

        {/* Step: Preview extracted terms */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-[#111827]">Extracted terms preview</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    IT found {terms.length} potential terms in <span className="font-medium text-slate-600">{fileName}</span>.
                    Select the ones you want to add to your library.
                  </p>
                </div>
                <span className="rounded-full bg-[#7C3AED]/10 px-3 py-1 text-xs font-semibold text-[#7C3AED]">
                  {selectedCount} selected
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {terms.map((term) => (
                <div
                  key={term.id}
                  onClick={() => toggleTerm(term.id)}
                  className={`cursor-pointer rounded-[20px] border p-5 shadow-sm transition ${
                    term.selected
                      ? "border-[#7C3AED]/40 bg-[#7C3AED]/5"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                        term.selected ? "border-[#7C3AED] bg-[#7C3AED]" : "border-slate-300 bg-white"
                      }`}
                    >
                      {term.selected && (
                        <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{term.title}</p>
                      <p className="mt-1 text-sm text-slate-500 leading-relaxed">{term.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveToLibrary}
                disabled={selectedCount === 0}
                className="rounded-2xl bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save {selectedCount > 0 ? `${selectedCount} terms` : "terms"} to library
              </button>
              <button
                onClick={() => setStep("upload")}
                className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step: Saved confirmation */}
        {step === "approve" && (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8 text-emerald-600">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[#111827]">Terms saved for approval</h2>
            <p className="mt-2 text-sm text-slate-600">
              {selectedCount} term{selectedCount !== 1 ? "s" : ""} have been added to your Terms Library with
              &ldquo;Pending approval&rdquo; status. Review and activate them from the library.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/account-it/terms-library"
                className="rounded-2xl bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9]"
              >
                Go to Terms Library
              </Link>
              <button
                onClick={() => { setStep("upload"); setFileName(null); setSaved(false); }}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Upload another
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
