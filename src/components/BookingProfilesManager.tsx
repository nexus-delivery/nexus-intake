"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { MerchantCustomer } from "@/lib/merchantCustomers";

type BookingProfile = {
  id: string;
  customerId: string;
  profileName: string;
  collectionAddressId: string | null;
  deliveryAddressId: string | null;
  collectionSnapshot: Record<string, unknown>;
  deliverySnapshot: Record<string, unknown>;
  serviceDefaults: Record<string, unknown>;
  goodsDefaults: Array<Record<string, unknown>>;
  commercialDefaults: Record<string, unknown>;
  instructions: string;
  archivedAt: string | null;
  updatedAt: string;
};

type Address = {
  id: string;
  addressType: string;
  label: string;
  addressLine1: string;
  postcode: string;
  isDefault: boolean;
};

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function BookingProfilesManager() {
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [profiles, setProfiles] = useState<BookingProfile[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profileName, setProfileName] = useState("");
  const [collectionAddressId, setCollectionAddressId] = useState("");
  const [deliveryAddressId, setDeliveryAddressId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const collectionAddresses = useMemo(
    () => addresses.filter((address) => address.addressType === "collection" || address.addressType === "depot" || address.addressType === "supplier"),
    [addresses]
  );
  const deliveryAddresses = useMemo(
    () => addresses.filter((address) => address.addressType === "delivery" || address.addressType === "warehouse" || address.addressType === "branch"),
    [addresses]
  );

  async function loadCustomers() {
    const response = await fetch("/api/merchant/customers?archived=false", { headers: await authHeaders() });
    const payload = (await response.json().catch(() => ({}))) as { customers?: MerchantCustomer[]; error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Failed to load customers");
    const next = payload.customers ?? [];
    setCustomers(next);
    if (!selectedCustomerId && next.length > 0) {
      setSelectedCustomerId(next[0].id);
    }
  }

  async function loadCustomerData(customerId: string) {
    if (!customerId) {
      setProfiles([]);
      setAddresses([]);
      return;
    }

    const headers = await authHeaders();
    const [profilesResponse, addressesResponse] = await Promise.all([
      fetch(`/api/merchant/customers/${encodeURIComponent(customerId)}/booking-profiles?archived=false`, { headers }),
      fetch(`/api/merchant/customers/${encodeURIComponent(customerId)}/addresses?archived=false`, { headers }),
    ]);

    const profilesPayload = (await profilesResponse.json().catch(() => ({}))) as {
      profiles?: BookingProfile[];
      error?: string;
    };
    const addressesPayload = (await addressesResponse.json().catch(() => ({}))) as {
      addresses?: Address[];
      error?: string;
    };

    if (!profilesResponse.ok) throw new Error(profilesPayload.error ?? "Failed to load booking profiles");
    if (!addressesResponse.ok) throw new Error(addressesPayload.error ?? "Failed to load addresses");

    setProfiles(profilesPayload.profiles ?? []);
    setAddresses(addressesPayload.addresses ?? []);
  }

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        await loadCustomers();
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Failed to load CRM");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCustomerData(selectedCustomerId).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load customer booking profiles");
    });
  }, [selectedCustomerId]);

  function beginEdit(profile: BookingProfile) {
    setEditingId(profile.id);
    setProfileName(profile.profileName);
    setCollectionAddressId(profile.collectionAddressId ?? "");
    setDeliveryAddressId(profile.deliveryAddressId ?? "");
    setInstructions(profile.instructions ?? "");
    setError(null);
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setProfileName("");
    setCollectionAddressId("");
    setDeliveryAddressId("");
    setInstructions("");
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomerId) {
      setError("Select a customer first.");
      return;
    }
    if (!profileName.trim()) {
      setError("Booking profile name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      };

      const payload = {
        profileName: profileName.trim(),
        collectionAddressId,
        deliveryAddressId,
        instructions,
      };

      const url = editingId
        ? `/api/merchant/customers/${encodeURIComponent(selectedCustomerId)}/booking-profiles/${encodeURIComponent(editingId)}`
        : `/api/merchant/customers/${encodeURIComponent(selectedCustomerId)}/booking-profiles`;
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Failed to save booking profile");

      await loadCustomerData(selectedCustomerId);
      setMessage(editingId ? "Booking profile updated." : "Booking profile created.");
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function duplicateProfile(profile: BookingProfile) {
    if (!selectedCustomerId) return;
    try {
      const response = await fetch(
        `/api/merchant/customers/${encodeURIComponent(selectedCustomerId)}/booking-profiles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await authHeaders()),
          },
          body: JSON.stringify({
            profileName: `${profile.profileName} (Copy)`,
            duplicateFromProfileId: profile.id,
          }),
        }
      );

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Duplicate failed");

      await loadCustomerData(selectedCustomerId);
      setMessage("Booking profile duplicated.");
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : "Duplicate failed");
    }
  }

  async function archiveProfile(profileId: string) {
    if (!selectedCustomerId) return;
    try {
      const response = await fetch(
        `/api/merchant/customers/${encodeURIComponent(selectedCustomerId)}/booking-profiles/${encodeURIComponent(profileId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await authHeaders()),
          },
          body: JSON.stringify({ archive: true }),
        }
      );

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Archive failed");

      await loadCustomerData(selectedCustomerId);
      setMessage("Booking profile archived.");
      if (editingId === profileId) {
        resetForm();
      }
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Archive failed");
    }
  }

  return (
    <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CRM Booking Profiles</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">Customer Booking Profiles</h2>
        <p className="mt-1 text-sm text-slate-600">
          Store reusable booking defaults per customer. Create-it consumes these profiles so operators only add order-specific data.
        </p>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading booking profile workspace...</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <select
        value={selectedCustomerId}
        onChange={(event) => setSelectedCustomerId(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">Select customer...</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>{customer.customerName}</option>
        ))}
      </select>

      <form onSubmit={saveProfile} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">{editingId ? "Edit Booking Profile" : "New Booking Profile"}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="Profile name (e.g. Daily Deliveries)"
          />
          <input
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="Default instructions"
          />
          <select
            value={collectionAddressId}
            onChange={(event) => setCollectionAddressId(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Collection address snapshot/manual</option>
            {collectionAddresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label || address.addressLine1} {address.isDefault ? "(Default)" : ""}
              </option>
            ))}
          </select>
          <select
            value={deliveryAddressId}
            onChange={(event) => setDeliveryAddressId(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Delivery address snapshot/manual</option>
            {deliveryAddresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label || address.addressLine1} {address.isDefault ? "(Default)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" disabled={saving || !selectedCustomerId} className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Update Profile" : "Create Profile"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Profile</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Addresses</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Updated</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">No booking profiles for this customer yet.</td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-900">{profile.profileName}</p>
                    <p className="text-xs text-slate-500">{profile.instructions || "No default instructions"}</p>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-700">
                    <p>Collection: {profile.collectionAddressId || "Manual snapshot"}</p>
                    <p>Delivery: {profile.deliveryAddressId || "Manual snapshot"}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{new Date(profile.updatedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => beginEdit(profile)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">Edit</button>
                      <button type="button" onClick={() => void duplicateProfile(profile)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">Duplicate</button>
                      <button type="button" onClick={() => void archiveProfile(profile.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Archive</button>
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
