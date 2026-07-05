"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  buildCollectionProfileName,
  parseCollectionProfileName,
  toEmptyDefaultCollectionProfile,
  type DefaultCollectionProfile,
} from "@/lib/defaultCollectionProfiles";

type ProfilePayload = {
  companyName?: string;
  profile?: DefaultCollectionProfile | null;
  profiles?: DefaultCollectionProfile[];
  error?: string;
};

type MerchantAddressRole = "Warehouse" | "Depot" | "Supplier" | "Collection Location";

type Props = {
  activeWorkspaceName?: string;
};

const ROLE_OPTIONS: MerchantAddressRole[] = [
  "Warehouse",
  "Depot",
  "Supplier",
  "Collection Location",
];

function splitRoleAndName(profileName: string): { role: MerchantAddressRole; name: string } {
  const parsedName = parseCollectionProfileName(profileName);
  const trimmed = parsedName.name;
  const match = trimmed.match(/^(Warehouse|Depot|Supplier|Collection Location):\s*(.+)$/i);
  if (!match) {
    return { role: "Depot", name: trimmed };
  }

  const role = ROLE_OPTIONS.find((option) => option.toLowerCase() === match[1].toLowerCase()) ?? "Depot";
  return { role, name: match[2].trim() };
}

function buildProfileName(role: MerchantAddressRole, name: string): string {
  const cleanedName = name.trim() || "Address";
  return `${role}: ${cleanedName}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function CollectionAddressesManager({ activeWorkspaceName = "" }: Props) {
  const [profiles, setProfiles] = useState<DefaultCollectionProfile[]>([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<DefaultCollectionProfile>(toEmptyDefaultCollectionProfile(""));
  const [addressRole, setAddressRole] = useState<MerchantAddressRole>("Depot");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const workspaceScopedProfiles = useMemo(() => {
    const activeWorkspace = activeWorkspaceName.trim().toLowerCase();
    if (!activeWorkspace) return [] as DefaultCollectionProfile[];

    return profiles.filter((profile) => {
      const parsed = parseCollectionProfileName(profile.profileName);
      const scopedWorkspace = parsed.workspaceName.trim().toLowerCase();
      if (scopedWorkspace) {
        return scopedWorkspace === activeWorkspace;
      }
      return profile.companyName.trim().toLowerCase() === activeWorkspace;
    });
  }, [activeWorkspaceName, profiles]);

  async function load(shouldResetSelection = false) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reference/default-collection-profile", {
        headers: await authHeaders(),
      });
      const payload = (await response.json().catch(() => ({}))) as ProfilePayload;
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load collection profiles");
      }

      const nextProfiles = payload.profiles ?? (payload.profile ? [payload.profile] : []);
      setProfiles(nextProfiles);

      const activeWorkspace = activeWorkspaceName.trim().toLowerCase();
      const scopedProfiles = nextProfiles.filter((profile) => {
        const parsed = parseCollectionProfileName(profile.profileName);
        const scopedWorkspace = parsed.workspaceName.trim().toLowerCase();
        if (scopedWorkspace) {
          return scopedWorkspace === activeWorkspace;
        }
        return profile.companyName.trim().toLowerCase() === activeWorkspace;
      });
      const preferredCurrent = scopedProfiles.find((profile) => profile.id === editingId);
      const preferred =
        !shouldResetSelection && preferredCurrent
          ? preferredCurrent
          : scopedProfiles.find((profile) => profile.isDefault) ?? scopedProfiles[0];

      if (preferred) {
        const parsed = splitRoleAndName(preferred.profileName);
        setEditingId(preferred.id);
        setAddressRole(parsed.role);
        setForm({ ...preferred, profileName: parsed.name });
      } else {
        setEditingId("");
        setAddressRole("Depot");
        setForm(toEmptyDefaultCollectionProfile(""));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load collection profiles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectProfile(profile: DefaultCollectionProfile) {
    const parsed = splitRoleAndName(profile.profileName);
    setEditingId(profile.id);
    setAddressRole(parsed.role);
    setForm({ ...profile, profileName: parsed.name });
    setError(null);
    setMessage(null);
  }

  function createNewProfile() {
    setEditingId("");
    setForm({
      ...toEmptyDefaultCollectionProfile(""),
      companyName: "",
      isDefault: profiles.length === 0,
    });
    setAddressRole("Depot");
    setError(null);
    setMessage(null);
  }

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/reference/default-collection-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          ...form,
          profileName: buildCollectionProfileName(
            activeWorkspaceName,
            buildProfileName(addressRole, form.profileName)
          ),
          id: editingId || undefined,
          isDefault: form.isDefault === true,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        profile?: DefaultCollectionProfile;
        profiles?: DefaultCollectionProfile[];
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error ?? "Failed to save profile");
      }

      const nextProfiles = payload.profiles ?? [payload.profile];
      setProfiles(nextProfiles);
      setEditingId(payload.profile.id);
      const parsed = splitRoleAndName(payload.profile.profileName);
      setAddressRole(parsed.role);
      setForm({ ...payload.profile, profileName: parsed.name });
      setMessage("Address saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Manage-it</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Collection Addresses</h1>
          <p className="mt-1 text-sm text-slate-600">Merchant Address Book: save warehouses, depots, suppliers, and collection locations for booking reuse.</p>
          {activeWorkspaceName ? (
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workspace: {activeWorkspaceName}</p>
          ) : null}
        </div>
        <button
          onClick={createNewProfile}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Add Address
        </button>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Saved Addresses</p>
          {loading ? (
            <p className="text-sm text-slate-500">Loading profiles...</p>
          ) : workspaceScopedProfiles.length === 0 ? (
            <p className="text-sm text-slate-500">No addresses for this merchant workspace yet.</p>
          ) : (
            workspaceScopedProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => selectProfile(profile)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  editingId === profile.id
                    ? "border-[#7C3AED] bg-violet-50 text-violet-900"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <p className="font-semibold">{splitRoleAndName(profile.profileName).name || "Address"}</p>
                <p className="mt-1 text-xs opacity-80">{profile.addressLine1 || "Address pending"}</p>
                {profile.isDefault ? <p className="mt-1 text-xs font-semibold">Default</p> : null}
              </button>
            ))
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Address Type</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={addressRole}
                onChange={(event) => setAddressRole(event.target.value as MerchantAddressRole)}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Address Label</label>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.profileName} onChange={(event) => setForm((prev) => ({ ...prev, profileName: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Site / Company Name</label>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.companyName} onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Contact Name</label>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.contactName} onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Contact Phone</label>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Address Line 1</label>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.addressLine1} onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Address Line 2</label>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.addressLine2} onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Address Line 3</label>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.addressLine3} onChange={(event) => setForm((prev) => ({ ...prev, addressLine3: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Postcode</label>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.postcode} onChange={(event) => setForm((prev) => ({ ...prev, postcode: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Contact Email</label>
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Instructions</label>
              <textarea rows={3} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={form.instructions} onChange={(event) => setForm((prev) => ({ ...prev, instructions: event.target.value }))} />
            </div>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isDefault === true}
                onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
              />
              Set as default collection profile
            </label>
          </div>

          <button
            disabled={saving}
            onClick={() => void saveProfile()}
            className="mt-4 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Address"}
          </button>
        </div>
      </div>
    </section>
  );
}
