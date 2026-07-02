"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { MerchantCustomer, MerchantCustomerUpsert } from "@/lib/merchantCustomers";

const emptyForm: MerchantCustomerUpsert = {
  customerName: "",
  company: "",
  contactName: "",
  email: "",
  mobile: "",
  phone: "",
  billingAddress: "",
  defaultCollectionAddress: "",
  defaultDeliveryAddress: "",
  deliveryInstructions: "",
  vatNumber: "",
  accountNumber: "",
  pricingProfile: "",
  defaultService: "",
  notes: "",
};

type Mode = "create" | "edit";

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function MerchantCustomersManager() {
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MerchantCustomerUpsert>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [inviteSending, setInviteSending] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((customer) =>
      [customer.customerName, customer.company, customer.contactName, customer.email, customer.phone, customer.mobile]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [customers, search]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const params = new URLSearchParams({ archived: showArchived ? "true" : "false" });
      if (search.trim()) params.set("search", search.trim());
      const response = await fetch(`/api/merchant/customers?${params.toString()}`, { headers });
      const payload = (await response.json()) as { customers?: MerchantCustomer[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to load customers (${response.status})`);
      }
      setCustomers(payload.customers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [search, showArchived]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(customer: MerchantCustomer) {
    setMode("edit");
    setEditingId(customer.id);
    setForm({
      customerName: customer.customerName,
      company: customer.company,
      contactName: customer.contactName,
      email: customer.email,
      mobile: customer.mobile,
      phone: customer.phone,
      billingAddress: customer.billingAddress,
      defaultCollectionAddress: customer.defaultCollectionAddress,
      defaultDeliveryAddress: customer.defaultDeliveryAddress,
      deliveryInstructions: customer.deliveryInstructions,
      vatNumber: customer.vatNumber,
      accountNumber: customer.accountNumber,
      pricingProfile: customer.pricingProfile,
      defaultService: customer.defaultService,
      notes: customer.notes,
    });
    setModalOpen(true);
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      };

      if (mode === "create") {
        const response = await fetch("/api/merchant/customers", {
          method: "POST",
          headers,
          body: JSON.stringify(form),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? `Failed to create customer (${response.status})`);
        }
      } else {
        const response = await fetch(`/api/merchant/customers/${editingId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(form),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? `Failed to update customer (${response.status})`);
        }
      }

      setModalOpen(false);
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function archiveCustomer(id: string, restore: boolean) {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      };
      const response = await fetch(`/api/merchant/customers/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(restore ? { restore: true } : { archive: true }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Archive action failed");
      }
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive action failed");
    }
  }

  async function importCsv() {
    try {
      const response = await fetch("/api/merchant/customers/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ csvText }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "CSV import failed");
      }
      setCsvText("");
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV import failed");
    }
  }

  async function exportCsv() {
    try {
      const response = await fetch("/api/merchant/customers/export", {
        headers: await authHeaders(),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "CSV export failed");
      }
      const csv = await response.text();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "merchant-customers.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV export failed");
    }
  }

  async function inviteCustomer(customer: MerchantCustomer) {
    if (!customer.email) {
      setError("Customer email is required before sending invite");
      return;
    }

    setInviteSending(customer.id);
    try {
      const response = await fetch("/api/merchant/customers/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          customerId: customer.id,
          email: customer.email,
          customerName: customer.contactName || customer.customerName,
        }),
      });
      const payload = (await response.json()) as { error?: string; inviteUrl?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Invite failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviteSending(null);
    }
  }

  return (
    <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Customers</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Customer Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage customer accounts, defaults, pricing profile, and invites per merchant company.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openCreate} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Add Customer
          </button>
          <button onClick={() => void exportCsv()} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customers"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          Show archived
        </label>
        <button onClick={() => void loadCustomers()} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          Refresh
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Import CSV</p>
        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          placeholder="Paste CSV content with headers e.g. Customer Name,Company,Contact Name,Email..."
        />
        <button onClick={() => void importCsv()} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
          Import CSV
        </button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading customers...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No customers found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Contact</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Pricing</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Defaults</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-900">{customer.customerName}</p>
                    <p className="text-xs text-slate-500">{customer.company || "-"}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <p>{customer.contactName || "-"}</p>
                    <p className="text-xs text-slate-500">{customer.email || "-"}</p>
                    <p className="text-xs text-slate-500">{customer.mobile || customer.phone || "-"}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <p>{customer.pricingProfile || "-"}</p>
                    <p className="text-xs text-slate-500">{customer.defaultService || "-"}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <p className="line-clamp-2 text-xs">C: {customer.defaultCollectionAddress || "-"}</p>
                    <p className="line-clamp-2 text-xs">D: {customer.defaultDeliveryAddress || "-"}</p>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => openEdit(customer)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">Edit</button>
                      <button
                        onClick={() => void inviteCustomer(customer)}
                        disabled={inviteSending === customer.id}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                      >
                        {inviteSending === customer.id ? "Inviting..." : "Invite"}
                      </button>
                      {customer.archivedAt ? (
                        <button onClick={() => void archiveCustomer(customer.id, true)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">Restore</button>
                      ) : (
                        <button onClick={() => void archiveCustomer(customer.id, false)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Archive</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitForm} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{mode === "create" ? "Add customer" : "Edit customer"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1 text-sm">Close</button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["customerName", "Customer Name"],
                ["company", "Company"],
                ["contactName", "Contact Name"],
                ["email", "Email"],
                ["mobile", "Mobile"],
                ["phone", "Phone"],
                ["billingAddress", "Billing Address"],
                ["defaultCollectionAddress", "Default Collection Address"],
                ["defaultDeliveryAddress", "Default Delivery Address"],
                ["deliveryInstructions", "Delivery Instructions"],
                ["vatNumber", "VAT Number"],
                ["accountNumber", "Account Number"],
                ["pricingProfile", "Pricing Profile"],
                ["defaultService", "Default Service"],
                ["notes", "Notes"],
              ].map(([key, label]) => (
                <label key={key} className={`text-sm ${key === "notes" ? "md:col-span-2" : ""}`}>
                  <span className="mb-1 block font-medium text-slate-700">{label}</span>
                  {key === "notes" ? (
                    <textarea
                      rows={3}
                      value={form[key as keyof MerchantCustomerUpsert] as string}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, [key]: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  ) : (
                    <input
                      value={form[key as keyof MerchantCustomerUpsert] as string}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, [key]: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Saving..." : mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
