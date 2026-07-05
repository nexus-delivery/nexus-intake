"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DashboardDetail, DashboardRow } from "@/lib/orders/dashboard";

type OrdersStatusBoardProps = {
  scope: "admin" | "merchant";
  title: string;
  subtitle: string;
};

type DashboardResponse = {
  jobs: DashboardRow[];
  total: number;
  scope: "admin" | "merchant";
  error?: string;
};

function badgeClass(status: string): string {
  const val = status.toLowerCase();
  if (val.includes("delivered") || val.includes("sent")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (val.includes("failed") || val.includes("issue") || val.includes("error")) {
    return "bg-red-50 text-red-700 border border-red-200";
  }
  if (val.includes("collect") || val.includes("route")) {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }
  return "bg-slate-50 text-slate-700 border border-slate-200";
}

function toLocale(value: string): string {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : "-";
}

export default function OrdersStatusBoard(props: OrdersStatusBoardProps) {
  const [jobs, setJobs] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [salesChannel, setSalesChannel] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DashboardDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [sendingToProcessId, setSendingToProcessId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    externalOrderReference: "",
    collectionName: "",
    collectionAddress: "",
    collectionPostcode: "",
    deliveryName: "",
    deliveryAddress: "",
    deliveryPostcode: "",
    requestedCollectionDate: "",
    requestedDeliveryDate: "",
    notes: "",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("scope", props.scope);
    if (search.trim()) params.set("search", search.trim());
    if (status.trim()) params.set("status", status.trim());
    if (fromDate.trim()) params.set("from", fromDate.trim());
    if (toDate.trim()) params.set("to", toDate.trim());
    if (salesChannel.trim()) params.set("salesChannel", salesChannel.trim());
    params.set("limit", "300");
    return params.toString();
  }, [props.scope, search, status, fromDate, toDate, salesChannel]);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error("Supabase client is unavailable");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        throw new Error("Please sign in to view orders");
      }

      const response = await fetch(`/api/orders/dashboard?${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = (await response.json()) as DashboardResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to load orders (${response.status})`);
      }

      setJobs(payload.jobs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const loadDetail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true);
      setSelectedId(id);
      if (!supabase) {
        throw new Error("Supabase client is unavailable");
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error("Please sign in to view order detail");
      }

      const response = await fetch(`/api/orders/dashboard/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = (await response.json()) as { detail?: DashboardDetail; error?: string };
      if (!response.ok || !payload.detail) {
        throw new Error(payload.error ?? `Failed to load order detail (${response.status})`);
      }

      setSelectedDetail(payload.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order detail");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const archiveOrder = useCallback(async (id: string) => {
    try {
      if (!supabase) throw new Error("Supabase client is unavailable");
      setArchivingId(id);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Please sign in to archive orders");

      const response = await fetch("/api/process-it/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ draftJobId: id }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to archive order (${response.status})`);
      }

      setSelectedId(null);
      setSelectedDetail(null);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive order");
    } finally {
      setArchivingId(null);
    }
  }, [loadJobs]);

  const sendToProcess = useCallback(async (id: string) => {
    try {
      if (!supabase) throw new Error("Supabase client is unavailable");
      setSendingToProcessId(id);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Please sign in to continue");

      const response = await fetch(`/api/orders/dashboard/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "send_to_process" }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to send to Process It (${response.status})`);
      }

      await loadJobs();
      if (selectedId === id) {
        await loadDetail(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send to Process It");
    } finally {
      setSendingToProcessId(null);
    }
  }, [loadDetail, loadJobs, selectedId]);

  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    try {
      if (!supabase) throw new Error("Supabase client is unavailable");
      setSavingEdit(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Please sign in to edit orders");

      const response = await fetch(`/api/orders/dashboard/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to update order (${response.status})`);
      }

      setEditingId(null);
      await loadJobs();
      await loadDetail(editingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setSavingEdit(false);
    }
  }, [editForm, editingId, loadDetail, loadJobs]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadJobs();
  }, [loadJobs]);

  return (
    <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Orders</p>
          <h2 className="text-2xl font-semibold text-slate-950">{props.title}</h2>
          <p className="text-sm text-slate-600">{props.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadJobs()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Order #, ref, customer, postcode"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="">All statuses</option>
          <option value="Created">Created</option>
          <option value="Ready for Operations">Ready for Operations</option>
          <option value="Ready for Route">Ready for Route</option>
          <option value="Sent to Track-POD">Sent to Track-POD</option>
          <option value="Failed to send to Track-POD">Failed to send to Track-POD</option>
          <option value="Collected">Collected</option>
          <option value="Delivered">Delivered</option>
          <option value="Failed / issue">Failed / issue</option>
        </select>
        <input
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          type="date"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        />
        <input
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          type="date"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        />
        <input
          value={salesChannel}
          onChange={(event) => setSalesChannel(event.target.value)}
          placeholder="Sales channel"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading orders...</p>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          No orders matched your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Order #</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">External Ref</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Collection</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Delivery</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Lifecycle</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Track-POD</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Created</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Updated</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-3 py-2 font-semibold text-slate-900">{job.internalOrderNumber || "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{job.externalOrderReference || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{job.customerMerchant || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">
                    <div className="font-medium">{job.collectionName || "-"}</div>
                    <div className="text-xs text-slate-500">{job.collectionPostcode || "-"}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <div className="font-medium">{job.deliveryName || "-"}</div>
                    <div className="text-xs text-slate-500">{job.deliveryPostcode || "-"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(job.lifecycleStatus)}`}>
                      {job.lifecycleStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(job.trackPodPushStatus)}`}>
                        {job.trackPodPushStatus}
                      </span>
                      <div className="text-xs text-slate-500">
                        D: {job.trackPodDeliveryOrderId || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        C: {job.trackPodCollectionOrderId || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{toLocale(job.createdAt)}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{toLocale(job.updatedAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => void loadDetail(job.id)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(job.id);
                          setEditForm({
                            externalOrderReference: job.externalOrderReference || "",
                            collectionName: job.collectionName || "",
                            collectionAddress: job.collectionAddress || "",
                            collectionPostcode: job.collectionPostcode || "",
                            deliveryName: job.deliveryName || "",
                            deliveryAddress: job.deliveryAddress || "",
                            deliveryPostcode: job.deliveryPostcode || "",
                            requestedCollectionDate: job.requestedCollectionDate || "",
                            requestedDeliveryDate: job.requestedDeliveryDate || "",
                            notes: selectedDetail?.operations.notes || "",
                          });
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void archiveOrder(job.id)}
                        disabled={archivingId === job.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 disabled:opacity-60"
                      >
                        {archivingId === job.id ? "Archiving..." : "Archive"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void sendToProcess(job.id)}
                        disabled={sendingToProcessId === job.id}
                        className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 disabled:opacity-60"
                      >
                        {sendingToProcessId === job.id ? "Sending..." : "Send to Process It"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedId && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Order detail</h3>
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setSelectedDetail(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            >
              Close
            </button>
          </div>

          {detailLoading || !selectedDetail ? (
            <p className="text-sm text-slate-500">Loading detail...</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Collection</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selectedDetail.collection.company || "-"}</p>
                  <p className="text-sm text-slate-700">{selectedDetail.collection.addressLine1 || "-"}</p>
                  <p className="text-sm text-slate-700">{selectedDetail.collection.postcode || "-"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Delivery</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selectedDetail.delivery.company || "-"}</p>
                  <p className="text-sm text-slate-700">{selectedDetail.delivery.addressLine1 || "-"}</p>
                  <p className="text-sm text-slate-700">{selectedDetail.delivery.postcode || "-"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Timeline</p>
                {selectedDetail.timeline.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No timeline events yet.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {selectedDetail.timeline.map((event, index) => (
                      <div key={`${event.timestamp}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{event.label}</p>
                          <p className="text-xs text-slate-500">{toLocale(event.timestamp)}</p>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{event.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {editingId ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Edit order</h3>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="External ref" value={editForm.externalOrderReference} onChange={(event) => setEditForm((prev) => ({ ...prev, externalOrderReference: event.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Collection name" value={editForm.collectionName} onChange={(event) => setEditForm((prev) => ({ ...prev, collectionName: event.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Collection address" value={editForm.collectionAddress} onChange={(event) => setEditForm((prev) => ({ ...prev, collectionAddress: event.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Collection postcode" value={editForm.collectionPostcode} onChange={(event) => setEditForm((prev) => ({ ...prev, collectionPostcode: event.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Delivery name" value={editForm.deliveryName} onChange={(event) => setEditForm((prev) => ({ ...prev, deliveryName: event.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Delivery address" value={editForm.deliveryAddress} onChange={(event) => setEditForm((prev) => ({ ...prev, deliveryAddress: event.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Delivery postcode" value={editForm.deliveryPostcode} onChange={(event) => setEditForm((prev) => ({ ...prev, deliveryPostcode: event.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" type="date" value={editForm.requestedCollectionDate} onChange={(event) => setEditForm((prev) => ({ ...prev, requestedCollectionDate: event.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" type="date" value={editForm.requestedDeliveryDate} onChange={(event) => setEditForm((prev) => ({ ...prev, requestedDeliveryDate: event.target.value }))} />
            <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" rows={3} placeholder="Notes" value={editForm.notes} onChange={(event) => setEditForm((prev) => ({ ...prev, notes: event.target.value }))} />
          </div>

          <div className="mt-3">
            <button
              type="button"
              disabled={savingEdit}
              onClick={() => void saveEdit()}
              className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingEdit ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
