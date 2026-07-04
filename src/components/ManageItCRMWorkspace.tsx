"use client";

import { useEffect, useMemo, useState } from "react";
import CollectionAddressesManager from "@/components/CollectionAddressesManager";
import CustomerAddressesManager from "@/components/CustomerAddressesManager";
import MerchantCustomersManager from "@/components/MerchantCustomersManager";
import WorkflowStageBanner from "@/components/WorkflowStageBanner";
import { supabase } from "@/lib/supabaseClient";

type MerchantWorkspace = {
  id: string;
  merchantName: string;
  contactEmail: string;
  status: "Draft" | "Invited" | "Active" | "Archived";
  createdAt: string;
};

const initialMerchants: MerchantWorkspace[] = [
  {
    id: "merch-doorway",
    merchantName: "Doorway Group LTD",
    contactEmail: "ops@doorway-group.example",
    status: "Active",
    createdAt: "2026-07-01",
  },
  {
    id: "merch-nook",
    merchantName: "Nook Home",
    contactEmail: "hello@nook-home.example",
    status: "Invited",
    createdAt: "2026-07-02",
  },
];

const MERCHANT_WORKSPACES_STORAGE_KEY = "nexus.manageit.merchantWorkspaces.v1";

const workspaceSections = [
  "Customers",
  "Collection Addresses",
  "Delivery Addresses",
  "Saved Forms",
  "Orders",
  "Documents",
  "Inventory",
  "Users",
  "Settings",
];

function localId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ManageItCRMWorkspace() {
  const [merchants, setMerchants] = useState<MerchantWorkspace[]>(initialMerchants);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(initialMerchants[0]?.id ?? "");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [seedingDoorway, setSeedingDoorway] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(MERCHANT_WORKSPACES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as MerchantWorkspace[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMerchants(parsed);
        setActiveWorkspaceId(parsed[0].id);
      }
    } catch {
      // Ignore malformed local storage data.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MERCHANT_WORKSPACES_STORAGE_KEY, JSON.stringify(merchants));
  }, [merchants]);

  const activeWorkspace = useMemo(
    () => merchants.find((merchant) => merchant.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId, merchants]
  );

  function createMerchantWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      setMessage("Merchant name and invite email are required.");
      return;
    }

    const next: MerchantWorkspace = {
      id: `merch-${localId()}`,
      merchantName: formName.trim(),
      contactEmail: formEmail.trim().toLowerCase(),
      status: "Invited",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setMerchants((current) => [next, ...current]);
    setActiveWorkspaceId(next.id);
    setFormName("");
    setFormEmail("");
    setMessage(`Merchant workspace created for ${next.merchantName}. You can work in this workspace before invitation acceptance.`);
  }

  function toggleArchive(id: string) {
    setMerchants((current) =>
      current.map((merchant) =>
        merchant.id === id
          ? {
              ...merchant,
              status: merchant.status === "Archived" ? "Active" : "Archived",
            }
          : merchant
      )
    );
  }

  async function authHeaders(): Promise<Record<string, string>> {
    if (!supabase) return {};
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  async function seedDoorwayWorkspace() {
    setSeedingDoorway(true);
    try {
      const response = await fetch("/api/manage-it/doorway/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to seed Doorway data");
      }

      if (typeof window !== "undefined") {
        const storageKey = "nexus.saved.booking.forms.v1";
        const existing = window.localStorage.getItem(storageKey);
        const parsed = existing ? (JSON.parse(existing) as Array<Record<string, unknown>>) : [];

        const doorwayTemplate = {
          id: "doorway-template-standard",
          name: "Doorway Standard Delivery",
          savedAt: new Date().toISOString(),
          customerId: "",
          salesChannelId: "",
          salesChannelName: "Doorway Standard",
          collectionMode: "depot",
          merchant: "Doorway Group LTD",
          customer: "",
          collection: {
            company: "Doorway Group LTD",
            contact: "Doorway Operations",
            addressLine1: "Doorway North Hub",
            addressLine2: "12 Distribution Way",
            addressLine3: "Tamworth",
            postcode: "B77 5AA",
            country: "UK",
            phone: "+44 1827 100100",
            email: "ops@doorwaygroup.co.uk",
            date: "",
            time: "",
            instructions: "Primary Doorway collection hub",
            latitude: "",
            longitude: "",
          },
          delivery: {
            company: "",
            contact: "",
            addressLine1: "",
            addressLine2: "",
            addressLine3: "",
            postcode: "",
            country: "UK",
            phone: "",
            email: "",
            date: "",
            time: "",
            instructions: "",
            latitude: "",
            longitude: "",
          },
          notes: "",
          defaultService: "Doorway Booking Form",
        };

        const filtered = parsed.filter((entry) => entry.id !== doorwayTemplate.id);
        window.localStorage.setItem(storageKey, JSON.stringify([doorwayTemplate, ...filtered]));
      }

      setMessage("Doorway workspace seeded with customers, reusable addresses, saved booking template, and operational orders.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Doorway seed failed.");
    } finally {
      setSeedingDoorway(false);
    }
  }

  function markInvited(id: string) {
    setMerchants((current) =>
      current.map((merchant) =>
        merchant.id === id
          ? {
              ...merchant,
              status: "Invited",
            }
          : merchant
      )
    );
    const workspace = merchants.find((merchant) => merchant.id === id);
    if (workspace) {
      setMessage(`Invite sent to ${workspace.contactEmail}. Workspace remains available to admins.`);
    }
  }

  return (
    <div className="space-y-6">
      <WorkflowStageBanner
        currentStage="create"
        orderStatus="CRM workspace setup in progress"
        nextRequiredAction="Create or select merchant workspace, then configure customer and address defaults"
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Oversee it = CRM</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Merchant CRM Workspace</h1>
        <p className="mt-2 max-w-4xl text-sm text-slate-600">
          Manage merchants, customers, reusable addresses, and users from one CRM surface. Admins can create a merchant workspace,
          invite by email, and continue working inside that workspace before invitation acceptance.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <form onSubmit={createMerchantWorkspace} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Create Merchant</p>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="merchantName">Merchant Name</label>
              <input
                id="merchantName"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Example Logistics Ltd"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="merchantEmail">Invite Email</label>
              <input
                id="merchantEmail"
                type="email"
                value={formEmail}
                onChange={(event) => setFormEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="ops@example-logistics.com"
              />
            </div>
            <button type="submit" className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white">
              Create Merchant Workspace
            </button>
          </form>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace Blueprint</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {workspaceSections.map((section) => (
                <div key={section} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  {section}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void seedDoorwayWorkspace()}
              disabled={seedingDoorway}
              className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              {seedingDoorway ? "Seeding Doorway..." : "Seed Doorway Operational Workspace"}
            </button>
          </div>
        </div>

        {message ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Merchant Workspaces</p>
          <p className="text-xs text-slate-500">{merchants.length} workspaces</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {merchants.map((merchant) => {
            const active = merchant.id === activeWorkspaceId;
            return (
              <div
                key={merchant.id}
                className={
                  "rounded-xl border p-4 " +
                  (active
                    ? "border-[#7C3AED] bg-violet-50"
                    : "border-slate-200 bg-white")
                }
              >
                <p className="text-base font-semibold text-slate-900">{merchant.merchantName}</p>
                <p className="mt-1 text-xs text-slate-500">{merchant.contactEmail}</p>
                <p className="mt-1 text-xs text-slate-500">Created {merchant.createdAt}</p>
                <p className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">{merchant.status}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveWorkspaceId(merchant.id)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    Open Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => markInvited(merchant.id)}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                  >
                    Invite
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleArchive(merchant.id)}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
                  >
                    {merchant.status === "Archived" ? "Unarchive" : "Archive"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {activeWorkspace ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{activeWorkspace.merchantName}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Admin and merchant administrators can add and edit customers, maintain reusable collection and delivery addresses,
            add contacts, and create operational orders from this workspace.
          </p>
        </section>
      ) : null}

      <MerchantCustomersManager />
      <CustomerAddressesManager />
      <CollectionAddressesManager />
    </div>
  );
}
