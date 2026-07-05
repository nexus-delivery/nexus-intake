"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCurrentProfile } from "@/lib/supabaseClient";
import type { CatalogueItem, CatalogueItemType } from "@/lib/catalogue";

type MerchantWorkspace = {
  id: string;
  merchantName: string;
};

const MERCHANT_WORKSPACES_STORAGE_KEY = "nexus.manageit.merchantWorkspaces.v1";
const ACTIVE_WORKSPACE_STORAGE_KEY = "nexus.manageit.activeWorkspaceId.v1";

function parseWorkspaceTaggedName(name: string): { workspaceName: string; displayName: string } {
  const match = name.trim().match(/^\[\[(.+?)\]\]\s*(.+)$/);
  if (!match) {
    return { workspaceName: "", displayName: name.trim() };
  }
  return {
    workspaceName: match[1]?.trim() ?? "",
    displayName: match[2]?.trim() ?? "",
  };
}

function buildWorkspaceTaggedName(workspaceName: string, name: string): string {
  const cleanedName = name.trim();
  const cleanedWorkspace = workspaceName.trim();
  if (!cleanedWorkspace) return cleanedName;
  return `[[${cleanedWorkspace}]] ${cleanedName}`;
}

const itemTypes: CatalogueItemType[] = ["product", "service", "surcharge", "labour", "storage"];

export default function CatalogueItPanel() {
  const [merchantId, setMerchantId] = useState("");
  const [activeWorkspaceName] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const activeId = window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)?.trim() ?? "";
      const workspaces = JSON.parse(
        window.localStorage.getItem(MERCHANT_WORKSPACES_STORAGE_KEY) ?? "[]"
      ) as MerchantWorkspace[];
      const active = Array.isArray(workspaces)
        ? workspaces.find((workspace) => workspace.id === activeId)
        : undefined;
      return active?.merchantName ?? "";
    } catch {
      return "";
    }
  });
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    item_type: "product" as CatalogueItemType,
    sku: "",
    name: "",
    description: "",
    default_price: "0",
    vat_rate: "20",
    xero_account_code: "",
    xero_tax_code: "",
  });

  useEffect(() => {
    let cancelled = false;
    void fetchCurrentProfile().then((result) => {
      if (!cancelled && result.success) {
        setMerchantId(result.data.companyId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!merchantId) return;

    const timer = window.setTimeout(() => {
      void fetch(`/api/catalogue/items?merchant_id=${encodeURIComponent(merchantId)}&query=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((payload: { items?: CatalogueItem[] }) => {
          setItems(Array.isArray(payload.items) ? payload.items : []);
        })
        .catch(() => setItems([]));
    }, 200);

    return () => window.clearTimeout(timer);
  }, [merchantId, query]);

  const sortedItems = useMemo(() => {
    const workspaceNeedle = activeWorkspaceName.trim().toLowerCase();
    if (!workspaceNeedle) return items;
    return items.filter((item) => {
      const parsed = parseWorkspaceTaggedName(item.name);
      if (!parsed.workspaceName) return false;
      return parsed.workspaceName.trim().toLowerCase() === workspaceNeedle;
    });
  }, [activeWorkspaceName, items]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!merchantId) {
      setMessage("No merchant profile is linked to this session.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/catalogue/items?merchant_id=" + encodeURIComponent(merchantId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          item_type: form.item_type,
          sku: form.sku,
          name: buildWorkspaceTaggedName(activeWorkspaceName, form.name),
          description: form.description,
          default_price: Number.parseFloat(form.default_price) || 0,
          vat_rate: Number.parseFloat(form.vat_rate) || 0,
          xero_account_code: form.xero_account_code,
          xero_tax_code: form.xero_tax_code,
          active: true,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { item?: CatalogueItem; error?: string };
      if (!response.ok || !payload.item) {
        setMessage(payload.error ?? "Could not save catalogue item.");
        return;
      }

      setForm({
        item_type: "product",
        sku: "",
        name: "",
        description: "",
        default_price: "0",
        vat_rate: "20",
        xero_account_code: "",
        xero_tax_code: "",
      });
      setMessage(`Saved ${payload.item.name}`);
      const refreshed = await fetch(`/api/catalogue/items?merchant_id=${encodeURIComponent(merchantId)}&query=${encodeURIComponent(query)}`);
      const refreshedPayload = (await refreshed.json().catch(() => ({}))) as { items?: CatalogueItem[] };
      setItems(Array.isArray(refreshedPayload.items) ? refreshedPayload.items : []);
    } catch {
      setMessage("Network error while saving catalogue item.");
    }

    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
        <h2 className="text-lg font-semibold text-slate-950">Create Catalogue Item</h2>
        <p className="mt-2 text-sm text-slate-600">Catalogue It is the commercial source of truth for goods, delivery services, labour, storage, and surcharges.</p>
            {activeWorkspaceName ? (
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workspace: {activeWorkspaceName}</p>
            ) : null}

        <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Item Type
            <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.item_type} onChange={(e) => setForm((prev) => ({ ...prev, item_type: e.target.value as CatalogueItemType }))}>
              {itemTypes.map((itemType) => <option key={itemType} value={itemType}>{itemType}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            SKU
            <input className="rounded-2xl border border-slate-200 px-4 py-3" value={form.sku} onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
            Name
            <input className="rounded-2xl border border-slate-200 px-4 py-3" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
            Description
            <textarea className="rounded-2xl border border-slate-200 px-4 py-3" rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Default Price
            <input className="rounded-2xl border border-slate-200 px-4 py-3" value={form.default_price} onChange={(e) => setForm((prev) => ({ ...prev, default_price: e.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            VAT Rate
            <input className="rounded-2xl border border-slate-200 px-4 py-3" value={form.vat_rate} onChange={(e) => setForm((prev) => ({ ...prev, vat_rate: e.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Xero Account Code
            <input className="rounded-2xl border border-slate-200 px-4 py-3" value={form.xero_account_code} onChange={(e) => setForm((prev) => ({ ...prev, xero_account_code: e.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Xero Tax Code
            <input className="rounded-2xl border border-slate-200 px-4 py-3" value={form.xero_tax_code} onChange={(e) => setForm((prev) => ({ ...prev, xero_tax_code: e.target.value }))} />
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <button disabled={busy} className="rounded-2xl bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" type="submit">
              {busy ? "Saving..." : "Save Item"}
            </button>
            <span className="text-sm text-slate-600">Each saved item becomes available for booking autocomplete and later Xero lines.</span>
          </div>
        </form>

        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Merchant Catalogue</h2>
            <p className="mt-1 text-sm text-slate-600">Search the merchant&apos;s active commercial items.</p>
          </div>
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, SKU, or description"
          />
        </div>

        <div className="mt-4 grid gap-3">
          {sortedItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{parseWorkspaceTaggedName(item.name).displayName}</p>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <p>{item.item_type}</p>
                  <p>£{Number(item.default_price).toFixed(2)} | VAT {Number(item.vat_rate).toFixed(2)}%</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {item.sku ? <span>SKU {item.sku} · </span> : null}
                {item.xero_account_code ? <span>Account {item.xero_account_code} · </span> : null}
                {item.xero_tax_code ? <span>Tax {item.xero_tax_code}</span> : null}
              </div>
            </article>
          ))}
          {!sortedItems.length ? <p className="text-sm text-slate-500">No items found.</p> : null}
        </div>
      </section>
    </div>
  );
}
