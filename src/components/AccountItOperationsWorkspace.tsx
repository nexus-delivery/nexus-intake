"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type InvoiceQueueItem = {
  id: string;
  jobReference: string;
  customer: string;
  goodsDescription: string;
  total: string;
  net: string;
  vat: string;
  xeroDraftInvoiceId: string | null;
  lifecycleStatus: string;
  currentStatus: string;
  updatedAt: string;
};

type InvoiceApiResponse = {
  awaitingInvoice: InvoiceQueueItem[];
  invoiceHistory: InvoiceQueueItem[];
  payments: {
    pendingCount: number;
    postedToday: number;
  };
  creditNotes: {
    openCount: number;
  };
  statements: {
    generatedToday: number;
  };
  financeDashboard: {
    awaitingInvoiceCount: number;
    invoicedCount: number;
  };
  error?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function AccountItOperationsWorkspace() {
  const [data, setData] = useState<InvoiceApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingInvoiceId, setCreatingInvoiceId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/account-it/invoices", {
        headers: await authHeaders(),
      });

      const payload = (await response.json().catch(() => ({}))) as InvoiceApiResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load Account-it data");
      }

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Account-it data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createInvoice(order: InvoiceQueueItem) {
    setCreatingInvoiceId(order.id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/account-it/invoices/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ draftJobId: order.id }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        invoiceId?: string;
        simulated?: boolean;
        alreadyExists?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to create invoice");
      }

      const status = payload.simulated ? "Simulated" : payload.alreadyExists ? "Already created" : "Created";
      setMessage(`${status} invoice ${payload.invoiceId ?? ""} for ${order.jobReference}.`.trim());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setCreatingInvoiceId(null);
    }
  }

  const financeSummary = useMemo(() => {
    if (!data) {
      return {
        awaiting: 0,
        invoiced: 0,
      };
    }

    return {
      awaiting: data.financeDashboard.awaitingInvoiceCount,
      invoiced: data.financeDashboard.invoicedCount,
    };
  }, [data]);

  return (
    <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operational Finance</p>
        <h2 className="text-3xl font-semibold text-slate-950">Account-it Operations</h2>
        <p className="max-w-3xl text-sm text-slate-600">
          Orders awaiting invoice, invoice creation, history, payments, credit notes, statements, and finance dashboard.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Orders awaiting invoice</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{financeSummary.awaiting}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Invoice history</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{financeSummary.invoiced}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Payments</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{data?.payments.pendingCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Credit notes</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{data?.creditNotes.openCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Statements</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{data?.statements.generatedToday ?? 0}</p>
        </div>
        <button onClick={() => void load()} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          Refresh
        </button>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading finance workspace...</p> : null}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Orders Awaiting Invoice</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Order</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(data?.awaitingInvoice ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                    No orders currently awaiting invoice.
                  </td>
                </tr>
              ) : (
                (data?.awaitingInvoice ?? []).map((order) => (
                  <tr key={order.id}>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-900">{order.jobReference || order.id}</p>
                      <p className="text-xs text-slate-500">{order.goodsDescription || "Operational order"}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{order.customer || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{order.total || order.net || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{order.lifecycleStatus || order.currentStatus || "-"}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => void createInvoice(order)}
                        disabled={creatingInvoiceId === order.id}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                      >
                        {creatingInvoiceId === order.id ? "Creating..." : "Create Invoice"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Invoice History</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Order</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Invoice ID</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(data?.invoiceHistory ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                    No invoice history yet.
                  </td>
                </tr>
              ) : (
                (data?.invoiceHistory ?? []).map((order) => (
                  <tr key={order.id}>
                    <td className="px-3 py-2 text-slate-700">{order.jobReference || order.id}</td>
                    <td className="px-3 py-2 text-slate-700">{order.xeroDraftInvoiceId || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{order.customer || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{new Date(order.updatedAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
