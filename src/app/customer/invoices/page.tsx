"use client";

import { useEffect, useState } from "react";
import CustomerPortalShell from "@/components/CustomerPortalShell";
import { supabase } from "@/lib/supabaseClient";

type InvoiceItem = {
  id: string;
  job_reference: string | null;
  purchase_order: string | null;
  commercial_net: number | null;
  commercial_vat: number | null;
  commercial_total: number | null;
  current_status: string | null;
  updated_at: string | null;
};

function money(value: number | null): string {
  return typeof value === "number" ? `£${value.toFixed(2)}` : "-";
}

export default function CustomerInvoicesPage() {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!supabase) throw new Error("Supabase is unavailable");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Please sign in");

        const response = await fetch("/api/customer/invoices", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const payload = (await response.json()) as { invoices?: InvoiceItem[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? `Failed to load invoices (${response.status})`);
        }
        setItems(payload.invoices ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoices");
      }
    }

    void load();
  }, []);

  return (
    <CustomerPortalShell>
      <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Invoices</p>
        <h2 className="text-2xl font-semibold text-slate-950">Invoice Overview</h2>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No invoices are available yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Order</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">PO</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Net</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">VAT</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Total</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-slate-700">{item.job_reference || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{item.purchase_order || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{money(item.commercial_net)}</td>
                    <td className="px-3 py-2 text-slate-700">{money(item.commercial_vat)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{money(item.commercial_total)}</td>
                    <td className="px-3 py-2 text-slate-700">{item.current_status || "-"}</td>
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
