"use client";

import { useEffect, useState } from "react";
import CustomerPortalShell from "@/components/CustomerPortalShell";
import { supabase } from "@/lib/supabaseClient";

type DocumentItem = {
  id: string;
  job_reference: string | null;
  document_filename: string | null;
  document_url: string | null;
  document_file_type: string | null;
  updated_at: string | null;
};

function toLocale(value: string | null): string {
  if (!value) return "-";
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? new Date(ts).toLocaleString() : "-";
}

export default function CustomerDocumentsPage() {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!supabase) throw new Error("Supabase is unavailable");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Please sign in");

        const response = await fetch("/api/customer/documents", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const payload = (await response.json()) as { documents?: DocumentItem[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? `Failed to load documents (${response.status})`);
        }
        setItems(payload.documents ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      }
    }

    void load();
  }, []);

  return (
    <CustomerPortalShell>
      <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Documents</p>
        <h2 className="text-2xl font-semibold text-slate-950">Your Documents</h2>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No documents available yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Order</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Filename</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Updated</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-slate-700">{item.job_reference || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{item.document_filename || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{item.document_file_type || "-"}</td>
                    <td className="px-3 py-2 text-slate-600">{toLocale(item.updated_at)}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.document_url ? (
                        <a href={item.document_url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </CustomerPortalShell>
  );
}
