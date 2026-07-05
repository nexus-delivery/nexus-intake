"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DashboardRow } from "@/lib/orders/dashboard";

type TrackItBoardProps = {
  scope: "admin" | "merchant";
  title: string;
  subtitle: string;
};

type DashboardResponse = {
  jobs: DashboardRow[];
  error?: string;
};

function deriveTransitState(job: DashboardRow): string {
  const current = (job.currentStatus || "").toLowerCase();
  const lifecycle = (job.rawLifecycleStatus || "").toLowerCase();
  if (current.includes("delivered") || lifecycle.includes("delivered")) return "Delivered";
  if (current.includes("transit") || current.includes("out for delivery")) return "In transit";
  if (current.includes("collect") || lifecycle.includes("collection_released")) return "Collection released";
  if (job.trackPodCollectionOrderId || job.trackPodDeliveryOrderId) return "Planning";
  return "Awaiting release";
}

function toLocale(value: string): string {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : "-";
}

export default function TrackItBoard({ scope, title, subtitle }: TrackItBoardProps) {
  const [jobs, setJobs] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!supabase) throw new Error("Supabase client is unavailable");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) throw new Error("Please sign in to view tracking");

      const response = await fetch(`/api/orders/dashboard?scope=${scope}&limit=300`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = (await response.json()) as DashboardResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to load tracking (${response.status})`);
      }

      setJobs(payload.jobs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracking");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadJobs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadJobs]);

  const trackableJobs = useMemo(
    () =>
      jobs.filter((job) => {
        if (job.rawLifecycleStatus.toLowerCase() === "archived") return false;
        return Boolean(
          job.trackPodCollectionOrderId ||
            job.trackPodDeliveryOrderId ||
            job.trackPodCollectionTrackingUrl ||
            job.trackPodDeliveryTrackingUrl ||
            ["ready_for_route", "collection_released_delivery_held", "collection_confirmed_awaiting_delivery_release", "delivered", "in_transit", "trackpod_error"].includes(job.rawLifecycleStatus.toLowerCase())
        );
      }),
    [jobs]
  );

  return (
    <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Track it</p>
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Routes shown here are provisional. An email and text will be sent when the route is finalised.
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <p className="text-sm text-slate-500">Loading tracked orders...</p>
      ) : trackableJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          No accepted or tracked orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Order Ref</th>
                {scope === "admin" ? <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Merchant</th> : null}
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Delivery Address</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Collection Link</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Delivery Link</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Collection ID</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Delivery ID</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Current Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Transit State</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {trackableJobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-3 py-2 font-semibold text-slate-900">{job.internalOrderNumber || "-"}</td>
                  {scope === "admin" ? <td className="px-3 py-2 text-slate-700">{job.merchantName || "-"}</td> : null}
                  <td className="px-3 py-2 text-slate-700">{job.customerMerchant || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{job.deliveryAddress || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {job.trackPodCollectionTrackingUrl ? (
                      <a href={job.trackPodCollectionTrackingUrl} target="_blank" rel="noreferrer" className="text-violet-700 underline">
                        Open
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {job.trackPodDeliveryTrackingUrl ? (
                      <a href={job.trackPodDeliveryTrackingUrl} target="_blank" rel="noreferrer" className="text-violet-700 underline">
                        Open
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{job.trackPodCollectionOrderId || "-"}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{job.trackPodDeliveryOrderId || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{job.currentStatus || job.lifecycleStatus}</td>
                  <td className="px-3 py-2 text-slate-700">{deriveTransitState(job)}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{toLocale(job.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}