"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type View = "admin" | "merchant" | "customer" | "operations";

type DocumentRecord = {
  id: string;
  merchantName: string;
  customerName: string;
  orderNumber: string;
  orderRef: string;
  status: string;
  routeStatus: string;
  routeDate: string;
  etaWindow: string;
  etaFrom: string;
  etaTo: string;
  deliveryPostcode: string;
  documentType: string;
  documentUrl: string;
  podAvailable: boolean;
  trackPodLink: string;
  createdAt: string;
  updatedAt: string;
  callPhone: string;
  email: string;
  whatsappLink: string;
  viewOrderHref: string;
  needsAttention: boolean;
  issueReasons: string[];
};

type DocumentSummary = {
  total: number;
  needsAttention: number;
  withDocument: number;
  withPod: number;
  routeConfirmed: number;
};

type ResponsePayload = {
  scope?: View;
  activeView?: View;
  availableViews?: View[];
  total?: number;
  summary?: DocumentSummary;
  records?: DocumentRecord[];
  error?: string;
};

function toLocale(value: string): string {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : "-";
}

function statusClass(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("confirmed") || normalized.includes("delivered")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (normalized.includes("planning") || normalized.includes("provisional")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (normalized.includes("failed") || normalized.includes("issue") || normalized.includes("exception")) {
    return "bg-rose-50 text-rose-700 border border-rose-200";
  }
  return "bg-slate-50 text-slate-700 border border-slate-200";
}

export default function DocumentItWorkspace() {
  const [records, setRecords] = useState<DocumentRecord[]>([]);
  const [summary, setSummary] = useState<DocumentSummary>({
    total: 0,
    needsAttention: 0,
    withDocument: 0,
    withPod: 0,
    routeConfirmed: 0,
  });
  const [availableViews, setAvailableViews] = useState<View[]>([]);
  const [activeView, setActiveView] = useState<View>("merchant");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);

  const load = useCallback(async (view?: View) => {
    setLoading(true);
    setError(null);

    try {
      if (!supabase) throw new Error("Supabase is unavailable");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please sign in to open Document it");
      }

      const params = new URLSearchParams();
      if (view) params.set("view", view);
      if (onlyIssues) params.set("onlyIssues", "true");

      const response = await fetch(`/api/document-it/records?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const payload = (await response.json()) as ResponsePayload;
      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to load Document it (${response.status})`);
      }

      const nextViews = payload.availableViews ?? [payload.activeView ?? "merchant"];
      setAvailableViews(nextViews);
      setActiveView((payload.activeView ?? nextViews[0] ?? "merchant") as View);
      setRecords(payload.records ?? []);
      setSummary(
        payload.summary ?? {
          total: payload.total ?? (payload.records?.length ?? 0),
          needsAttention: (payload.records ?? []).filter((record) => record.needsAttention).length,
          withDocument: (payload.records ?? []).filter((record) => Boolean(record.documentUrl)).length,
          withPod: (payload.records ?? []).filter((record) => record.podAvailable).length,
          routeConfirmed: (payload.records ?? []).filter(
            (record) => record.routeStatus.toLowerCase() === "route confirmed"
          ).length,
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Document it");
    } finally {
      setLoading(false);
    }
  }, [onlyIssues]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) =>
      [
        record.orderNumber,
        record.orderRef,
        record.merchantName,
        record.customerName,
        record.deliveryPostcode,
        record.status,
        record.routeStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [records, search]);

  const csvRows = useMemo(() => {
    return filtered.map((record) => {
      const eta = record.etaWindow || [record.etaFrom, record.etaTo].filter(Boolean).join(" - ");
      return {
        status: record.status,
        merchant: record.merchantName,
        customer: record.customerName,
        route_status: record.routeStatus,
        route_date: record.routeDate,
        eta,
        order_number: record.orderNumber,
        order_ref: record.orderRef,
        delivery_postcode: record.deliveryPostcode,
        document_type: record.documentType,
        trackpod_link: record.trackPodLink,
        document_url: record.documentUrl,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
        needs_attention: String(record.needsAttention),
        issue_reasons: record.issueReasons.join("|"),
      };
    });
  }, [filtered]);

  const downloadCsv = useCallback(() => {
    if (csvRows.length === 0) return;
    const header = Object.keys(csvRows[0]);
    const lines = [
      header.join(","),
      ...csvRows.map((row) =>
        header
          .map((column) => {
            const value = String(row[column as keyof typeof row] ?? "").replaceAll('"', '""');
            return `"${value}"`;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `document-it-${activeView}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeView, csvRows]);

  return (
    <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Document it</p>
        <h1 className="text-2xl font-semibold text-slate-950">Document and Order Visibility</h1>
        <p className="text-sm text-slate-600">
          Central visibility across orders, PODs, invoices, uploaded files, route data, and Track-POD links.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {availableViews.map((view) => (
          <button
            key={view}
            onClick={() => void load(view)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
              view === activeView
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {view}
          </button>
        ))}
        <button
          onClick={() => void load(activeView)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          Refresh
        </button>
        <button
          onClick={() => setOnlyIssues((value) => !value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            onlyIssues
              ? "bg-rose-600 text-white"
              : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          {onlyIssues ? "Showing Issues" : "Show Issues Only"}
        </button>
        <button
          onClick={downloadCsv}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          Export CSV
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs uppercase text-slate-500">Visible records</p>
          <p className="text-xl font-semibold text-slate-900">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
          <p className="text-xs uppercase text-rose-600">Needs attention</p>
          <p className="text-xl font-semibold text-rose-700">{summary.needsAttention}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs uppercase text-slate-500">With document</p>
          <p className="text-xl font-semibold text-slate-900">{summary.withDocument}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs uppercase text-slate-500">With POD</p>
          <p className="text-xl font-semibold text-slate-900">{summary.withPod}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs uppercase text-slate-500">Route confirmed</p>
          <p className="text-xl font-semibold text-slate-900">{summary.routeConfirmed}</p>
        </div>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search order, merchant, customer, postcode"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
      />

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading visibility records...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No records found for this view.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Status",
                  "Merchant",
                  "Customer",
                  "Route Status",
                  "Route Date",
                  "ETA",
                  "Order Number",
                  "Order Ref",
                  "Delivery Postcode",
                  "Document Type",
                  "Track-POD",
                  "Created",
                  "Updated",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((record) => {
                const eta = record.etaWindow || [record.etaFrom, record.etaTo].filter(Boolean).join(" - ");
                return (
                  <tr key={record.id}>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{record.merchantName || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{record.customerName || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{record.routeStatus || "Not Planned"}</td>
                    <td className="px-3 py-2 text-slate-700">{record.routeDate || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{eta || "-"}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{record.orderNumber || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{record.orderRef || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{record.deliveryPostcode || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{record.documentType || "order_record"}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {record.trackPodLink ? (
                        <a href={record.trackPodLink} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                          Open
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{toLocale(record.createdAt)}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{toLocale(record.updatedAt)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1 text-xs">
                        {record.needsAttention ? (
                          <span className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">
                            Needs attention
                          </span>
                        ) : null}
                        <a href={record.viewOrderHref} className="rounded border border-slate-200 px-2 py-1 text-slate-700">View order</a>
                        {record.documentUrl ? (
                          <a href={record.documentUrl} target="_blank" rel="noreferrer" className="rounded border border-slate-200 px-2 py-1 text-slate-700">View document</a>
                        ) : null}
                        {record.documentUrl ? (
                          <a href={record.documentUrl} target="_blank" rel="noreferrer" download className="rounded border border-slate-200 px-2 py-1 text-slate-700">Download</a>
                        ) : null}
                        {record.callPhone ? (
                          <a href={`tel:${record.callPhone}`} className="rounded border border-slate-200 px-2 py-1 text-slate-700">Call</a>
                        ) : null}
                        {record.email ? (
                          <a href={`mailto:${record.email}`} className="rounded border border-slate-200 px-2 py-1 text-slate-700">Email</a>
                        ) : null}
                        {record.whatsappLink ? (
                          <a href={record.whatsappLink} target="_blank" rel="noreferrer" className="rounded border border-slate-200 px-2 py-1 text-slate-700">WhatsApp</a>
                        ) : null}
                      </div>
                      {record.issueReasons.length > 0 ? (
                        <p className="mt-1 text-[11px] text-rose-700">{record.issueReasons.join(", ")}</p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
