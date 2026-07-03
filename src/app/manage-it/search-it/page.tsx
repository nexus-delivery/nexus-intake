"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { fetchCurrentProfile, supabase } from "@/lib/supabaseClient";

// ── Types ─────────────────────────────────────────────────────────────────────

type SearchField = {
  key: string;
  label: string;
  category: "reference" | "person" | "address" | "contact";
};

type SearchResult = {
  id: string;
  type: "document" | "draft_job" | "live_job";
  label: string;
  status: string;
  merchant: string;
  customer: string;
  matchedOn: string[];
  uploadDate?: string;
  jobRef?: string;
  trackPodRef?: string;
};

// ── Searchable fields ─────────────────────────────────────────────────────────

const SEARCH_FIELDS: SearchField[] = [
  { key: "job_reference", label: "Job Reference", category: "reference" },
  { key: "order_reference", label: "Order Reference", category: "reference" },
  { key: "po_number", label: "PO Number", category: "reference" },
  { key: "consignment_reference", label: "Consignment Reference", category: "reference" },
  { key: "trackpod_reference", label: "Track-POD Reference", category: "reference" },
  { key: "booking_reference", label: "Booking Reference", category: "reference" },
  { key: "invoice_number", label: "Invoice Number", category: "reference" },
  { key: "customer_name", label: "Customer Name", category: "person" },
  { key: "delivery_name", label: "Delivery Name", category: "person" },
  { key: "collection_name", label: "Collection Name", category: "person" },
  { key: "delivery_address", label: "Delivery Address", category: "address" },
  { key: "collection_address", label: "Collection Address", category: "address" },
  { key: "delivery_postcode", label: "Delivery Postcode", category: "address" },
  { key: "collection_postcode", label: "Collection Postcode", category: "address" },
  { key: "delivery_phone", label: "Delivery Phone", category: "contact" },
  { key: "collection_phone", label: "Collection Phone", category: "contact" },
  { key: "delivery_email", label: "Delivery Email", category: "contact" },
  { key: "collection_email", label: "Collection Email", category: "contact" },
  { key: "merchant", label: "Merchant", category: "person" },
  { key: "filename", label: "Filename", category: "reference" },
  { key: "product_description", label: "Product Description", category: "reference" },
  { key: "goods_description", label: "Goods Description", category: "reference" },
];

// Fields that count as "strong" identifiers (references and contact details)
// A single "weak" field (postcode, surname, phone, email, filename, product)
// is not enough — two independent matches are required.
const STRONG_FIELDS = new Set([
  "job_reference",
  "order_reference",
  "po_number",
  "consignment_reference",
  "trackpod_reference",
  "booking_reference",
  "invoice_number",
]);

// ── Two-match security check ─────────────────────────────────────────────────
//
// Rules:
//   • At least TWO non-empty search terms must be provided.
//   • At least one must be from a different category than the other, OR
//     at least one must be a strong reference field.
//   • A single category (e.g. two address fields) does NOT satisfy the rule.

function meetsSecurityRule(terms: Record<string, string>): {
  ok: boolean;
  message?: string;
} {
  const populated = Object.entries(terms).filter(([, v]) => v.trim().length > 0);
  if (populated.length < 2) {
    return {
      ok: false,
      message:
        "Please provide at least two matching details to protect customer information.",
    };
  }

  // Count distinct categories that have a non-empty value
  const categories = new Set(
    populated.map(([k]) => {
      const field = SEARCH_FIELDS.find((f) => f.key === k);
      return field?.category ?? "reference";
    }),
  );

  // Check if there's at least one strong reference field
  const hasStrongField = populated.some(([k]) => STRONG_FIELDS.has(k));

  if (categories.size < 2 && !hasStrongField) {
    return {
      ok: false,
      message:
        "Please provide at least two matching details to protect customer information.",
    };
  }

  return { ok: true };
}

// ── Result card ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  document: "Document",
  draft_job: "Draft Job",
  live_job: "Live Job",
};

const TYPE_COLOURS: Record<SearchResult["type"], string> = {
  document: "bg-purple-50 text-purple-700",
  draft_job: "bg-amber-50 text-amber-700",
  live_job: "bg-teal-50 text-teal-700",
};

function ResultCard({ result }: { result: SearchResult }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLOURS[result.type]}`}
            >
              {TYPE_LABELS[result.type]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {result.status}
            </span>
          </div>
          <p className="text-base font-semibold text-slate-900">{result.label}</p>
          <p className="text-sm text-slate-500 mt-0.5">
            {result.merchant} · {result.customer}
          </p>
          {result.uploadDate && (
            <p className="text-xs text-slate-400 mt-1">Uploaded: {result.uploadDate}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.matchedOn.map((m) => (
              <span
                key={m}
                className="rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-xs font-medium text-[#7C3AED]"
              >
                ✓ {m}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          {showDetail ? "Hide" : "View"}
        </button>
      </div>

      {showDetail && (
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {result.jobRef && (
              <div>
                <p className="text-xs text-slate-400">Job Reference</p>
                <p className="font-medium text-slate-800">{result.jobRef}</p>
              </div>
            )}
            {result.trackPodRef && (
              <div>
                <p className="text-xs text-slate-400">Track-POD Reference</p>
                <p className="font-medium text-slate-800">{result.trackPodRef}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              Open Document
            </button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              View Timeline
            </button>
            {result.type !== "document" && (
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                View Job
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<SearchField["category"], string> = {
  reference: "Reference Numbers",
  person: "Names & Merchants",
  address: "Address Details",
  contact: "Contact Details",
};

export default function SearchItPage() {
  const [terms, setTerms] = useState<Record<string, string>>(() =>
    Object.fromEntries(SEARCH_FIELDS.map((f) => [f.key, ""])),
  );
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  function setTerm(key: string, value: string) {
    setTerms((prev) => ({ ...prev, [key]: value }));
    setSecurityError(null);
    setSearchError(null);
    setResults(null);
  }

  function clearAll() {
    setTerms(Object.fromEntries(SEARCH_FIELDS.map((f) => [f.key, ""])));
    setResults(null);
    setSecurityError(null);
    setSearchError(null);
  }

  const populatedCount = Object.values(terms).filter((v) => v.trim().length > 0).length;

  async function handleSearch() {
    setResults(null);
    setSecurityError(null);
    setSearchError(null);

    const check = meetsSecurityRule(terms);
    if (!check.ok) {
      setSecurityError(check.message ?? "Security rule not met.");
      return;
    }

    setSearching(true);
    try {
      if (!supabase) {
        setSearchError("Supabase is not configured for live search in this environment.");
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (sessionError || !token) {
        setSearchError("Sign in is required to run secure order and data search.");
        return;
      }

      const populatedSearchValues = Object.entries(terms)
        .filter(([, value]) => value.trim().length > 0)
        .map(([, value]) => value.trim());
      const searchQuery = populatedSearchValues.join(" ");

      const response = await fetch(
        `/api/orders/dashboard?search=${encodeURIComponent(searchQuery)}&limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        jobs?: Array<{
          id: string;
          internalOrderNumber: string;
          lifecycleStatus: string;
          customerMerchant: string;
          salesChannelName: string;
          createdAt: string;
          trackPodDeliveryOrderId: string | null;
          trackPodCollectionOrderId: string | null;
        }>;
      };

      if (!response.ok) {
        setSearchError(payload.error ?? "Search failed.");
        return;
      }

      const orderResults: SearchResult[] = (payload.jobs ?? []).map((job) => ({
        id: `job-${job.id}`,
        type: "draft_job",
        label: job.internalOrderNumber || job.id,
        status: job.lifecycleStatus,
        merchant: job.salesChannelName || "—",
        customer: job.customerMerchant || "—",
        matchedOn: ["Order and data criteria matched"],
        uploadDate: job.createdAt
          ? new Date(job.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : undefined,
        jobRef: job.internalOrderNumber || undefined,
        trackPodRef: job.trackPodDeliveryOrderId ?? job.trackPodCollectionOrderId ?? undefined,
      }));

      const fileName = terms.filename.trim();
      const documentResults: SearchResult[] = [];
      if (fileName) {
        const profile = await fetchCurrentProfile();
        if (profile.success) {
          const { data: docs } = await supabase
            .from("uploaded_documents")
            .select("id, file_name, status, created_at")
            .eq("company_id", profile.data.companyId)
            .ilike("file_name", `%${fileName}%`)
            .limit(20);

          for (const d of docs ?? []) {
            documentResults.push({
              id: `doc-${d.id}`,
              type: "document",
              label: d.file_name ?? d.id,
              status: d.status ?? "Uploaded",
              merchant: "—",
              customer: "—",
              matchedOn: [`Filename: ${d.file_name ?? "document"}`],
              uploadDate: d.created_at
                ? new Date(d.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : undefined,
            });
          }
        }
      }

      setResults([...documentResults, ...orderResults]);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  // Group fields by category
  const grouped = (
    ["reference", "person", "address", "contact"] as SearchField["category"][]
  ).map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    fields: SEARCH_FIELDS.filter((f) => f.category === cat),
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7C3AED]">Manage it.</p>
          <h1 className="text-2xl font-bold text-slate-900">Search it.</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Locate documents, draft jobs, live jobs and completed deliveries.
          </p>
        </div>

        {/* Security notice */}
        <div className="flex gap-3 rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4">
          <div className="mt-0.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" className="h-5 w-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#7C3AED]">Two-Match Security Rule</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Customer information is protected. You must provide at least <strong>two independent matching
              identifiers</strong> before any document or delivery is displayed. A single search term
              (surname, postcode, phone, email, filename or product alone) is not sufficient.
            </p>
          </div>
        </div>

        {/* Search form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {grouped.map(({ category, label, fields }) => (
            <div key={category}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {label}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`search-${field.key}`}
                      className="mb-1 block text-xs font-medium text-slate-600"
                    >
                      {field.label}
                    </label>
                    <input
                      id={`search-${field.key}`}
                      type="text"
                      value={terms[field.key]}
                      onChange={(e) => setTerm(field.key, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSearch();
                      }}
                      placeholder={`Enter ${field.label.toLowerCase()}…`}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={() => void handleSearch()}
              disabled={searching}
              className="rounded-xl bg-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-60 transition"
            >
              {searching ? "Searching…" : "Search"}
            </button>
            <button
              onClick={clearAll}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Clear All
            </button>
            {populatedCount > 0 && (
              <span className="text-xs text-slate-400">
                {populatedCount} field{populatedCount !== 1 ? "s" : ""} filled
                {populatedCount >= 2 ? " ✓" : " — add one more to enable search"}
              </span>
            )}
          </div>
        </div>

        {/* Security error */}
        {securityError && (
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="h-5 w-5 mt-0.5 shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">{securityError}</p>
              <p className="text-xs text-amber-700 mt-1">
                Examples of valid combinations: Customer Name + Postcode, Reference + Email,
                Reference + Phone, PO Number + Customer Name, Phone + Postcode.
              </p>
            </div>
          </div>
        )}

        {searchError && (
          <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="h-5 w-5 mt-0.5 shrink-0">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">{searchError}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results !== null && (
          <div>
            <p className="mb-4 text-sm font-semibold text-slate-700">
              {results.length === 0
                ? "No matching records found."
                : `${results.length} record${results.length !== 1 ? "s" : ""} found`}
            </p>
            {results.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-400">
                  No documents or jobs matched the search criteria. Try adjusting your search terms.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Allowed/disallowed examples */}
        {results === null && !securityError && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="mb-3 text-sm font-semibold text-green-700">✓ Allowed combinations</p>
              <ul className="space-y-1 text-xs text-green-800">
                {[
                  "Customer Name + Postcode",
                  "Reference + Email",
                  "Reference + Phone",
                  "PO Number + Customer Name",
                  "Phone + Postcode",
                  "Reference + Delivery Name",
                ].map((ex) => (
                  <li key={ex}>· {ex}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="mb-3 text-sm font-semibold text-red-700">✗ Not allowed (single weak term)</p>
              <ul className="space-y-1 text-xs text-red-800">
                {[
                  "Surname only",
                  "Postcode only",
                  "Phone only",
                  "Email only",
                  "Filename only",
                  "Product description only",
                ].map((ex) => (
                  <li key={ex}>· {ex}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
