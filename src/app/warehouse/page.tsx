"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";

type WarehouseJob = {
  id: string;
  internalOrderNumber: string;
  customerMerchant: string;
  lifecycleStatus: string;
  serviceOptions: string[];
  createdAt: string;
  requestedDeliveryDate: string;
};

type DashboardResponse = {
  jobs?: WarehouseJob[];
  error?: string;
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export default function WarehousePage() {
  const [jobs, setJobs] = useState<WarehouseJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInventoryView() {
      try {
        if (!supabase) {
          if (!cancelled) {
            setError("Supabase is not configured for warehouse tracking.");
            setLoading(false);
          }
          return;
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (sessionError || !token) {
          if (!cancelled) {
            setError("Sign in is required to access warehouse tracking.");
            setLoading(false);
          }
          return;
        }

        const response = await fetch("/api/orders/dashboard?limit=200", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = (await response.json().catch(() => ({}))) as DashboardResponse;

        if (!response.ok) {
          if (!cancelled) {
            setError(payload.error ?? "Unable to load warehouse tracking data.");
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setJobs(payload.jobs ?? []);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load warehouse tracking data.");
          setLoading(false);
        }
      }
    }

    void loadInventoryView();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = jobs.length;
    const ready = jobs.filter((job) => job.lifecycleStatus === "Ready for Operations").length;
    const sent = jobs.filter((job) => job.lifecycleStatus === "Sent to Track-POD").length;
    const delivered = jobs.filter((job) => job.lifecycleStatus === "Delivered").length;
    const fragile = jobs.filter((job) => (job.serviceOptions ?? []).includes("Fragile")).length;
    return { total, ready, sent, delivered, fragile };
  }, [jobs]);

  const recent = jobs
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 20);

  return (
    <AppShell>
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Warehouse</p>
          <h1 className="text-3xl font-semibold text-slate-950">Inventory Tracking</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Live throughput and inventory-relevant order tracking from Create it through dispatch.
          </p>
        </div>

        {loading ? <p className="text-sm text-slate-500">Loading warehouse tracking data...</p> : null}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Tracked Orders" value={String(stats.total)} />
              <StatCard label="Ready For Ops" value={String(stats.ready)} />
              <StatCard label="Sent To Track-POD" value={String(stats.sent)} />
              <StatCard label="Delivered" value={String(stats.delivered)} />
              <StatCard label="Fragile Handling" value={String(stats.fragile)} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Recent Inventory Movements</h2>
              {recent.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No movements found yet.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500">
                        <th className="py-2 pr-4">Order</th>
                        <th className="py-2 pr-4">Customer</th>
                        <th className="py-2 pr-4">Lifecycle</th>
                        <th className="py-2 pr-4">Delivery Date</th>
                        <th className="py-2">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {recent.map((job) => (
                        <tr key={job.id}>
                          <td className="py-2 pr-4 font-medium text-slate-900">{job.internalOrderNumber || job.id}</td>
                          <td className="py-2 pr-4">{job.customerMerchant || "—"}</td>
                          <td className="py-2 pr-4">{job.lifecycleStatus}</td>
                          <td className="py-2 pr-4">{job.requestedDeliveryDate || "—"}</td>
                          <td className="py-2">
                            {job.createdAt
                              ? new Date(job.createdAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
