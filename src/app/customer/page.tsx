"use client";

import { useEffect, useState } from "react";
import CustomerPortalShell from "@/components/CustomerPortalShell";
import { supabase } from "@/lib/supabaseClient";

type SummaryPayload = {
  customer?: { customerName: string; contactName: string | null; email: string };
  summary?: {
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    latestUpdateAt: string | null;
  };
  error?: string;
};

function toLocale(value: string | null): string {
  if (!value) return "-";
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? new Date(ts).toLocaleString() : "-";
}

export default function CustomerDashboardPage() {
  const [payload, setPayload] = useState<SummaryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!supabase) throw new Error("Supabase is unavailable");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Please sign in");

        const response = await fetch("/api/customer/summary", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        const data = (await response.json()) as SummaryPayload;
        if (!response.ok) {
          throw new Error(data.error ?? `Failed to load summary (${response.status})`);
        }
        setPayload(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      }
    }

    void load();
  }, []);

  const summary = payload?.summary;

  return (
    <CustomerPortalShell>
      <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
        <h2 className="text-2xl font-semibold text-slate-950">Welcome {payload?.customer?.customerName ?? "Customer"}</h2>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {summary ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Total orders</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.totalOrders}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Active</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.activeOrders}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Delivered</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.deliveredOrders}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Latest update</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{toLocale(summary.latestUpdateAt)}</p>
            </article>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        )}
      </section>
    </CustomerPortalShell>
  );
}
