"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { MerchantCustomer } from "@/lib/merchantCustomers";

type AddressType = "collection" | "delivery";

type CustomerAddress = {
  id: string;
  customerId: string;
  addressType: AddressType;
  label: string;
  contactName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postcode: string;
  country: string;
  instructions: string;
  isDefault: boolean;
  archivedAt: string | null;
};

type AddressForm = {
  addressType: AddressType;
  label: string;
  contactName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postcode: string;
  country: string;
  instructions: string;
  isDefault: boolean;
};

const emptyForm: AddressForm = {
  addressType: "collection",
  label: "",
  contactName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  addressLine3: "",
  postcode: "",
  country: "UK",
  instructions: "",
  isDefault: false,
};

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function CustomerAddressesManager() {
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AddressType>("all");
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleAddresses = useMemo(() => {
    return addresses.filter((address) => typeFilter === "all" || address.addressType === typeFilter);
  }, [addresses, typeFilter]);

  async function loadCustomers() {
    const response = await fetch("/api/merchant/customers", { headers: await authHeaders() });
    const payload = (await response.json().catch(() => ({}))) as {
      customers?: MerchantCustomer[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load customers");
    }

    const nextCustomers = payload.customers ?? [];
    setCustomers(nextCustomers);
    if (!selectedCustomerId && nextCustomers.length > 0) {
      setSelectedCustomerId(nextCustomers[0].id);
    }
  }

  async function loadAddresses(customerId: string) {
    if (!customerId) {
      setAddresses([]);
      return;
    }

    const response = await fetch(`/api/merchant/customers/${encodeURIComponent(customerId)}/addresses`, {
      headers: await authHeaders(),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      addresses?: CustomerAddress[];
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load addresses");
    }

    setAddresses(payload.addresses ?? []);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        await loadCustomers();
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load customers");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedCustomerId) {
      setAddresses([]);
      return;
    }

    setError(null);
    void (async () => {
      try {
        await loadAddresses(selectedCustomerId);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load addresses");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedCustomerId]);

  async function createAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomerId) {
      setError("Select a customer first.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/merchant/customers/${encodeURIComponent(selectedCustomerId)}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save address");
      }

      setForm((prev) => ({ ...emptyForm, addressType: prev.addressType }));
      setMessage("Address saved.");
      await loadAddresses(selectedCustomerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  async function setDefaultAddress(address: CustomerAddress) {
    if (!selectedCustomerId) return;

    try {
      const response = await fetch(
        `/api/merchant/customers/${encodeURIComponent(selectedCustomerId)}/addresses/${encodeURIComponent(address.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await authHeaders()),
          },
          body: JSON.stringify({ isDefault: true }),
        }
      );

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to set default address");
      }

      await loadAddresses(selectedCustomerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default address");
    }
  }

  async function archiveAddress(address: CustomerAddress) {
    if (!selectedCustomerId) return;

    try {
      const response = await fetch(
        `/api/merchant/customers/${encodeURIComponent(selectedCustomerId)}/addresses/${encodeURIComponent(address.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await authHeaders()),
          },
          body: JSON.stringify({ archive: true }),
        }
      );

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to archive address");
      }

      await loadAddresses(selectedCustomerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive address");
    }
  }

  return (
    <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CRM Addresses</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">Customer Addresses</h2>
        <p className="mt-1 text-sm text-slate-600">
          Customers can hold unlimited collection and delivery addresses. Save reusable addresses and set defaults per customer and type.
        </p>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading address workspace...</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={selectedCustomerId}
          onChange={(event) => setSelectedCustomerId(event.target.value)}
        >
          <option value="">Select customer...</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.customerName}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as "all" | AddressType)}
        >
          <option value="all">All address types</option>
          <option value="collection">Collection</option>
          <option value="delivery">Delivery</option>
        </select>
      </div>

      <form onSubmit={createAddress} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Add address</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            value={form.addressType}
            onChange={(event) => setForm((prev) => ({ ...prev, addressType: event.target.value as AddressType }))}
          >
            <option value="collection">Collection</option>
            <option value="delivery">Delivery</option>
          </select>
          <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Label (e.g. Main depot)" value={form.label} onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))} />
          <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Contact" value={form.contactName} onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))} />
          <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
          <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Address line 1" value={form.addressLine1} onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))} required />
          <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Address line 2" value={form.addressLine2} onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))} />
          <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Address line 3" value={form.addressLine3} onChange={(event) => setForm((prev) => ({ ...prev, addressLine3: event.target.value }))} />
          <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Postcode" value={form.postcode} onChange={(event) => setForm((prev) => ({ ...prev, postcode: event.target.value }))} required />
          <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Country" value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
          <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm md:col-span-2 xl:col-span-3" placeholder="Instructions" value={form.instructions} onChange={(event) => setForm((prev) => ({ ...prev, instructions: event.target.value }))} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))} />
          Set as default for selected type
        </label>
        <button type="submit" disabled={saving || !selectedCustomerId} className="mt-3 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Saving..." : "Save address"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Type</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Label</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Address</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Contact</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {visibleAddresses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">No addresses yet for this customer.</td>
              </tr>
            ) : (
              visibleAddresses.map((address) => (
                <tr key={address.id}>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">{address.addressType}</span>
                    {address.isDefault ? <span className="ml-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-700">Default</span> : null}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{address.label || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">
                    <p>{address.addressLine1}</p>
                    <p className="text-xs text-slate-500">{[address.addressLine2, address.addressLine3, address.postcode, address.country].filter(Boolean).join(", ")}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <p>{address.contactName || "-"}</p>
                    <p className="text-xs text-slate-500">{address.phone || address.email || "-"}</p>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {!address.isDefault ? (
                        <button onClick={() => void setDefaultAddress(address)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">Set default</button>
                      ) : null}
                      <button onClick={() => void archiveAddress(address)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Archive</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
