"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DashboardDetail, DashboardRow } from "@/lib/orders/dashboard";

function toLocale(value: string): string {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : "-";
}

type Mode = "orders" | "track";

export default function CustomerOrdersModule({ mode }: { mode: Mode }) {
  const [jobs, setJobs] = useState<DashboardRow[]>([]);
  const [selected, setSelected] = useState<DashboardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) throw new Error("Supabase is unavailable");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in");

      const response = await fetch("/api/customer/orders", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = (await response.json()) as { jobs?: DashboardRow[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to load orders (${response.status})`);
      }
      setJobs(payload.jobs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function viewOrder(id: string) {
    try {
      setDetailLoading(true);
      setError(null);

      if (!supabase) throw new Error("Supabase is unavailable");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in");

      const response = await fetch(`/api/customer/orders/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = (await response.json()) as { detail?: DashboardDetail; error?: string };
      if (!response.ok || !payload.detail) {
        throw new Error(payload.error ?? `Failed to load order detail (${response.status})`);
      }

      setSelected(payload.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order detail");
    } finally {
      setDetailLoading(false);
    }
  }

  const filtered =
    mode === "track"
      ? jobs.filter((job) => Boolean(job.trackPodDeliveryTrackingUrl || job.trackPodCollectionTrackingUrl))
      : jobs;

  return (
    <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {mode === "track" ? "Track Order" : "Orders"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            {mode === "track" ? "Track Your Live Orders" : "Your Orders"}
          </h2>
        </div>
        <button
          onClick={() => void loadOrders()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading orders...</p> : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No orders to show.
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Order</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Track</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Updated</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((job) => (
                <tr key={job.id}>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-900">{job.internalOrderNumber || "-"}</p>
                    <p className="text-xs text-slate-500">{job.externalOrderReference || "-"}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{job.currentStatus || job.lifecycleStatus}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {job.trackPodDeliveryTrackingUrl ? (
                      <a href={job.trackPodDeliveryTrackingUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                        Delivery
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">Pending</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{toLocale(job.updatedAt)}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => void viewOrder(job.id)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {selected ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Order detail</h3>
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            >
              Close
            </button>
          </div>

          {detailLoading ? <p className="mt-3 text-sm text-slate-500">Loading detail...</p> : null}

          {!detailLoading ? (
            <div className="mt-3 space-y-2">
              {selected.timeline.slice(0, 10).map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                    <p className="text-xs text-slate-500">{toLocale(entry.timestamp)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{entry.detail}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
